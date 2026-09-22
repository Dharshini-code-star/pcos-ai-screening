"""Shortcut / leakage audit for the ultrasound dataset.

WHY THIS EXISTS
---------------
train_ultrasound.py produced AUROC 1.000 and accuracy 1.000 on the held-out
test split. A perfect score on medical imaging is a warning sign, not a
success, so this script tests the obvious alternative explanation: that the
two classes are separable using information that has nothing to do with
ovarian anatomy.

It fits a logistic regression on NON-ANATOMICAL features only:

    image width, height, area, aspect ratio, mean brightness, brightness sd

If that trivial baseline also scores near-perfectly, then the CNN's score is
explained by acquisition/source differences between the class folders (image
resolution, processing, brightness) rather than by anything clinical, and the
CNN metrics must not be presented as evidence of PCOS detection ability.

It also checks for byte-identical images shared across the train/test splits.

The findings are written back into artifacts/ultrasound_metadata.json so the
API and the UI surface them instead of a bare, misleading AUROC.

Run:  python scripts/check_ultrasound_shortcut.py
"""

from __future__ import annotations

import hashlib
import json
from collections import defaultdict
from pathlib import Path

ML_DIR = Path(__file__).resolve().parent.parent
DATA = ML_DIR / "data" / "ultrasound"
META_PATH = ML_DIR / "artifacts" / "ultrasound_metadata.json"
CLASSES = {"infected": 1, "notinfected": 0}


def main() -> None:
    import numpy as np
    from PIL import Image
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import accuracy_score, roc_auc_score

    if not DATA.exists():
        raise SystemExit(f"No dataset at {DATA}. Run scripts/prepare_ultrasound.py first.")

    def features(split: str):
        X, y = [], []
        for cls, label in CLASSES.items():
            for f in sorted((DATA / split / cls).glob("*.png")):
                im = Image.open(f)
                w, h = im.size
                g = np.asarray(im.convert("L"), dtype=np.float32)
                X.append([w, h, w * h, w / h, g.mean(), g.std()])
                y.append(label)
        return np.array(X), np.array(y)

    x_train, y_train = features("train")
    x_test, y_test = features("test")

    clf = LogisticRegression(max_iter=5000, class_weight="balanced")
    clf.fit(x_train, y_train)
    prob = clf.predict_proba(x_test)[:, 1]
    auroc = float(roc_auc_score(y_test, prob))
    acc = float(accuracy_score(y_test, (prob >= 0.5).astype(int)))

    # Exact-duplicate check across splits.
    hashes: dict[str, list[str]] = defaultdict(list)
    for split in ("train", "test"):
        for cls in CLASSES:
            for f in (DATA / split / cls).glob("*.png"):
                hashes[hashlib.md5(f.read_bytes()).hexdigest()].append(split)
    cross = sum(1 for v in hashes.values() if "train" in v and "test" in v)

    # Per-class geometry, to show *why* the shortcut works.
    geometry: dict[str, dict] = {}
    for cls in CLASSES:
        widths, heights, grays = [], [], []
        for f in sorted((DATA / "train" / cls).glob("*.png")):
            im = Image.open(f)
            widths.append(im.size[0])
            heights.append(im.size[1])
            grays.append(float(np.asarray(im.convert("L"), dtype=np.float32).mean()))
        geometry[cls] = {
            "median_width": float(np.median(widths)),
            "median_height": float(np.median(heights)),
            "mean_brightness": float(np.mean(grays)),
        }

    shortcut = auroc >= 0.95
    finding = {
        "non_anatomical_baseline": {
            "features": "image width, height, area, aspect ratio, mean brightness, brightness sd",
            "test_auroc": auroc,
            "test_accuracy": acc,
        },
        "exact_duplicate_hashes_across_splits": cross,
        "per_class_geometry_train": geometry,
        "shortcut_detected": shortcut,
        "interpretation": (
            "A model using only image geometry and brightness — no anatomy at all — reaches "
            f"AUROC {auroc:.3f} on the same held-out split. The two class folders therefore differ "
            "systematically in acquisition/processing (resolution and brightness), so the CNN's "
            "near-perfect score is explained by that shortcut rather than by detecting ovarian "
            "morphology. These metrics must NOT be presented as evidence of PCOS detection "
            "ability or of real-world performance."
            if shortcut
            else
            "The non-anatomical baseline does not separate the classes, so the CNN's score is not "
            "trivially explained by image geometry or brightness."
        ),
    }

    print(json.dumps(finding, indent=2))

    if META_PATH.exists():
        meta = json.loads(META_PATH.read_text())
        meta["shortcut_audit"] = finding
        if shortcut:
            meta["limitations"] = (
                "Research prototype — metrics are NOT evidence of PCOS detection ability. "
                f"A non-anatomical baseline (image size and brightness only) reaches AUROC {auroc:.3f} "
                "on the same held-out split, showing the two class folders differ by acquisition "
                "source rather than only by anatomy. The dataset also has no patient identifiers, so "
                "splits are image-level and frames from one patient may span splits. Not clinically "
                "validated, not a medical device, and not a diagnosis."
            )
        META_PATH.write_text(json.dumps(meta, indent=2))
        print(f"\nUpdated {META_PATH}")


if __name__ == "__main__":
    main()
