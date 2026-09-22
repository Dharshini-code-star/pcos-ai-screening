"""Ultrasound screening inference + Grad-CAM.

Loads the EfficientNetB0 artifact produced by scripts/train_ultrasound.py.

If the artifact is absent the service stays up and every ultrasound call
returns a clear "model not available" error. It never invents a probability
— there are no placeholder or hard-coded scores anywhere in this module.

Uploaded images are held in memory for the duration of the request only.
They are not written to disk and not logged.
"""

from __future__ import annotations

import base64
import io
import json
from pathlib import Path
from typing import Any

import numpy as np

APP_DIR = Path(__file__).resolve().parent
ARTIFACTS = APP_DIR.parent / "artifacts"
MODEL_PATH = ARTIFACTS / "ultrasound_model.keras"
META_PATH = ARTIFACTS / "ultrasound_metadata.json"

IMG_SIZE = (224, 224)
# Last conv block of EfficientNetB0 — the layer Grad-CAM reads activations from.
GRADCAM_LAYER = "top_activation"

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp", "image/bmp"}


class UltrasoundModelUnavailable(RuntimeError):
    """Raised when the trained artifact has not been generated yet."""


class UltrasoundModel:
    def __init__(self) -> None:
        self._model: Any | None = None
        self._base: Any | None = None
        self.metadata: dict | None = None
        if META_PATH.exists():
            try:
                self.metadata = json.loads(META_PATH.read_text())
            except json.JSONDecodeError:
                self.metadata = None

    @property
    def available(self) -> bool:
        return MODEL_PATH.exists()

    def _load(self):
        if self._model is not None:
            return self._model
        if not self.available:
            raise UltrasoundModelUnavailable(
                "The ultrasound model artifact has not been generated yet. "
                "Run: python scripts/prepare_ultrasound.py && python scripts/train_ultrasound.py"
            )
        import tensorflow as tf  # imported lazily so the clinical API stays light

        self._model = tf.keras.models.load_model(MODEL_PATH)
        return self._model

    # ---- preprocessing -------------------------------------------------
    def _preprocess(self, image_bytes: bytes):
        from PIL import Image, UnidentifiedImageError

        try:
            img = Image.open(io.BytesIO(image_bytes))
            img.verify()  # detects truncated/corrupt files
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except (UnidentifiedImageError, OSError) as exc:
            raise ValueError("That file could not be read as an image.") from exc

        img = img.resize(IMG_SIZE)
        arr = np.asarray(img, dtype=np.float32)
        return np.expand_dims(arr, axis=0), img

    # ---- prediction ----------------------------------------------------
    def predict(self, image_bytes: bytes) -> dict:
        model = self._load()
        batch, _ = self._preprocess(image_bytes)
        prob = float(model.predict(batch, verbose=0).ravel()[0])
        return {
            "image_probability": prob,
            "prediction": self._label(prob),
            "model": "EfficientNetB0",
            "model_version": (self.metadata or {}).get("model_version", "ultrasound-v1"),
        }

    @staticmethod
    def _label(prob: float) -> str:
        # Screening language only — never a diagnosis.
        if prob >= 0.66:
            return "PCOS-consistent appearance likely"
        if prob >= 0.33:
            return "Uncertain / borderline appearance"
        return "PCOS-consistent appearance less likely"

    # ---- Grad-CAM ------------------------------------------------------
    def gradcam(self, image_bytes: bytes) -> dict:
        """Return the prediction plus a base64 PNG Grad-CAM overlay."""
        import tensorflow as tf
        from PIL import Image

        model = self._load()
        batch, original = self._preprocess(image_bytes)

        # EfficientNetB0 sits inside the model as a nested functional model;
        # reach through it to get the conv activations Grad-CAM needs.
        base = None
        for layer in model.layers:
            if isinstance(layer, tf.keras.Model) and "efficientnet" in layer.name.lower():
                base = layer
                break
        if base is None:
            raise RuntimeError("Could not locate the EfficientNetB0 base for Grad-CAM.")

        conv_layer = base.get_layer(GRADCAM_LAYER)
        grad_model = tf.keras.Model(base.inputs, [conv_layer.output, base.output])

        # Reproduce the preprocessing the trained graph applies before the base.
        x = tf.keras.applications.efficientnet.preprocess_input(tf.convert_to_tensor(batch))

        with tf.GradientTape() as tape:
            conv_out, base_out = grad_model(x, training=False)
            tape.watch(conv_out)
            # Re-apply the trained head on top of the base output so the
            # gradient is taken with respect to the actual prediction.
            head = tf.keras.layers.GlobalAveragePooling2D()(conv_out)
            for name in ("dense", "dropout", "prediction"):
                try:
                    head = model.get_layer(name)(head, training=False)
                except ValueError:
                    continue
            score = head[:, 0]

        grads = tape.gradient(score, conv_out)
        if grads is None:
            raise RuntimeError("Grad-CAM could not compute gradients for this image.")

        weights = tf.reduce_mean(grads, axis=(0, 1, 2))
        cam = tf.reduce_sum(conv_out[0] * weights, axis=-1).numpy()
        cam = np.maximum(cam, 0)
        if cam.max() > 0:
            cam = cam / cam.max()

        heat = Image.fromarray(np.uint8(cam * 255)).resize(IMG_SIZE, Image.BILINEAR)
        heat_arr = np.asarray(heat, dtype=np.float32) / 255.0

        # Simple warm colour map (no matplotlib dependency).
        base_arr = np.asarray(original, dtype=np.float32) / 255.0
        overlay = np.zeros((*IMG_SIZE, 3), dtype=np.float32)
        overlay[..., 0] = heat_arr                      # red
        overlay[..., 1] = np.clip(heat_arr - 0.45, 0, 1)  # a little green at the hottest points
        overlay[..., 2] = np.clip(0.35 - heat_arr, 0, 1)  # cool where the map is weak

        alpha = 0.45 * heat_arr[..., None]
        blended = np.clip(base_arr * (1 - alpha) + overlay * alpha, 0, 1)

        buf = io.BytesIO()
        Image.fromarray(np.uint8(blended * 255)).save(buf, format="PNG")
        heatmap_b64 = base64.b64encode(buf.getvalue()).decode("ascii")

        prob = float(model.predict(batch, verbose=0).ravel()[0])
        return {
            "image_probability": prob,
            "prediction": self._label(prob),
            "model": "EfficientNetB0",
            "model_version": (self.metadata or {}).get("model_version", "ultrasound-v1"),
            "gradcam_png_base64": heatmap_b64,
        }


ultrasound_model = UltrasoundModel()
