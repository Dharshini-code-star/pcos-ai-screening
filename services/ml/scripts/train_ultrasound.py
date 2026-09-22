"""Train the ultrasound screening model (EfficientNetB0 transfer learning).

Pipeline, exactly as specified:

    Ultrasound image
      -> preprocessing (resize 224x224, EfficientNet preprocess)
      -> EfficientNetB0 (ImageNet weights, frozen base)
      -> GlobalAveragePooling2D
      -> Dense
      -> Dropout
      -> Dense(1, sigmoid)
      -> model-predicted probability

Split policy
------------
The dataset's own `test` split is treated as the held-out test set and is
NEVER used for training, validation, early stopping, checkpoint selection, or
fusion fitting. Validation is carved out of `train`.

The dataset has no patient identifiers (see prepare_ultrasound.py), so this is
an image-level split. Frames from one patient can therefore appear on both
sides, which can inflate metrics. That limitation is recorded in the metadata
this script writes, and should be surfaced wherever the metrics are shown.

Positive class
--------------
`infected` (PCOS-consistent appearance) is mapped to 1 so the sigmoid output
reads as "model-predicted probability of a PCOS-consistent appearance".

Run:  python scripts/train_ultrasound.py
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ML_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ML_DIR / "data" / "ultrasound"
ARTIFACTS = ML_DIR / "artifacts"
MODEL_PATH = ARTIFACTS / "ultrasound_model.keras"
META_PATH = ARTIFACTS / "ultrasound_metadata.json"

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
SEED = 42
VAL_FRACTION = 0.2
EPOCHS = 25
POSITIVE_CLASS = "infected"


def main() -> None:
    import numpy as np
    import tensorflow as tf
    from sklearn.metrics import (
        accuracy_score,
        brier_score_loss,
        confusion_matrix,
        roc_auc_score,
    )

    train_dir = DATA_DIR / "train"
    test_dir = DATA_DIR / "test"
    if not train_dir.exists() or not test_dir.exists():
        raise SystemExit(
            f"Dataset not found under {DATA_DIR}.\n"
            "Run:  python scripts/prepare_ultrasound.py   first."
        )

    tf.keras.utils.set_random_seed(SEED)

    # ---- data ----------------------------------------------------------
    train_ds = tf.keras.utils.image_dataset_from_directory(
        train_dir,
        validation_split=VAL_FRACTION,
        subset="training",
        seed=SEED,
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode="binary",
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        train_dir,
        validation_split=VAL_FRACTION,
        subset="validation",
        seed=SEED,
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode="binary",
    )
    test_ds = tf.keras.utils.image_dataset_from_directory(
        test_dir,
        shuffle=False,
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode="binary",
    )

    class_names = train_ds.class_names
    print(f"Class order from directory scan: {class_names}")
    # image_dataset_from_directory labels alphabetically: infected=0, notinfected=1.
    # We want infected (PCOS-consistent) = 1, so flip when that is the case.
    flip = class_names[0] == POSITIVE_CLASS
    if flip:
        print(f"Flipping labels so '{POSITIVE_CLASS}' is the positive class (1).")
        flip_fn = lambda x, y: (x, 1.0 - y)  # noqa: E731
        train_ds = train_ds.map(flip_fn)
        val_ds = val_ds.map(flip_fn)
        test_ds = test_ds.map(flip_fn)

    # class imbalance -> class weights, computed from the training split only
    train_labels = np.concatenate([y.numpy().ravel() for _, y in train_ds], axis=0)
    n_pos = float((train_labels == 1).sum())
    n_neg = float((train_labels == 0).sum())
    total = n_pos + n_neg
    class_weight = {0: total / (2 * n_neg), 1: total / (2 * n_pos)}
    print(f"Train class balance: positives={int(n_pos)} negatives={int(n_neg)}")
    print(f"Class weights: {class_weight}")

    autotune = tf.data.AUTOTUNE
    train_ds = train_ds.cache().shuffle(1000, seed=SEED).prefetch(autotune)
    val_ds = val_ds.cache().prefetch(autotune)
    test_ds = test_ds.cache().prefetch(autotune)

    # ---- model ---------------------------------------------------------
    augment = tf.keras.Sequential(
        [
            tf.keras.layers.RandomFlip("horizontal"),
            tf.keras.layers.RandomRotation(0.05),
            tf.keras.layers.RandomZoom(0.1),
        ],
        name="augment",
    )

    base = tf.keras.applications.EfficientNetB0(
        include_top=False, weights="imagenet", input_shape=(*IMG_SIZE, 3)
    )
    base.trainable = False

    inputs = tf.keras.Input(shape=(*IMG_SIZE, 3), name="ultrasound_image")
    x = augment(inputs)
    x = tf.keras.applications.efficientnet.preprocess_input(x)
    x = base(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D(name="gap")(x)
    x = tf.keras.layers.Dense(128, activation="relu", name="dense")(x)
    x = tf.keras.layers.Dropout(0.3, name="dropout")(x)
    outputs = tf.keras.layers.Dense(1, activation="sigmoid", name="prediction")(x)
    model = tf.keras.Model(inputs, outputs, name="pcosense_ultrasound_efficientnetb0")

    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-3),
        loss="binary_crossentropy",
        metrics=[tf.keras.metrics.AUC(name="auc"), "accuracy"],
    )

    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(
            MODEL_PATH, monitor="val_auc", mode="max", save_best_only=True, verbose=1
        ),
        tf.keras.callbacks.EarlyStopping(
            monitor="val_auc", mode="max", patience=6, restore_best_weights=True, verbose=1
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=3, min_lr=1e-6, verbose=1
        ),
    ]

    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS,
        class_weight=class_weight,
        callbacks=callbacks,
    )

    # ---- evaluation on the untouched test split ------------------------
    y_true = np.concatenate([y.numpy().ravel() for _, y in test_ds], axis=0)
    y_prob = model.predict(test_ds).ravel()
    y_pred = (y_prob >= 0.5).astype(int)

    metrics = {
        "auroc": float(roc_auc_score(y_true, y_prob)),
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "brier": float(brier_score_loss(y_true, y_prob)),
        "confusion_matrix": confusion_matrix(y_true, y_pred).tolist(),
        "n_test_images": int(len(y_true)),
    }
    print("\nHeld-out test metrics:", json.dumps(metrics, indent=2))

    # Validation-split probabilities are written out so the fusion model can
    # be fitted on validation data only (never on the test split).
    val_true = np.concatenate([y.numpy().ravel() for _, y in val_ds], axis=0)
    val_prob = model.predict(val_ds).ravel()
    np.savez(
        ARTIFACTS / "ultrasound_val_predictions.npz", y_true=val_true, y_prob=val_prob
    )

    metadata = {
        "model_version": "ultrasound-v1",
        "architecture": "EfficientNetB0 (frozen ImageNet base) -> GAP -> Dense(128) -> Dropout(0.3) -> Dense(1, sigmoid)",
        "image_size": list(IMG_SIZE),
        "positive_class": POSITIVE_CLASS,
        "dataset": "BTX24/PCOS-ultrasound-dataset (Hugging Face mirror of the Kaggle PCOS ultrasound data)",
        "class_names": class_names,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "epochs_run": len(history.history.get("loss", [])),
        "held_out_test": metrics,
        "limitations": (
            "Research prototype. Trained on a single public dataset with no patient "
            "identifiers, so splits are image-level: frames from the same patient may "
            "appear in more than one split, which can inflate these metrics. Not "
            "clinically validated, not a medical device, and not a diagnosis."
        ),
    }
    META_PATH.write_text(json.dumps(metadata, indent=2))
    print(f"\nSaved model -> {MODEL_PATH}")
    print(f"Saved metadata -> {META_PATH}")


if __name__ == "__main__":
    main()
