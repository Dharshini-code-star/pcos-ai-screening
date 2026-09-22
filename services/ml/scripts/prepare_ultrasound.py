"""Fetch and lay out the ovarian ultrasound dataset for training.

Dataset (verified, not fabricated — inspected via the Hugging Face
datasets-server API before writing this script):

    BTX24/PCOS-ultrasound-dataset   (public, non-gated, parquet)
    https://huggingface.co/datasets/BTX24/PCOS-ultrasound-dataset

    splits   : train = 1539 examples, test = 385 examples
    features : image (Image), label (ClassLabel)
    classes  : ["infected", "notinfected"]   (index 0 = infected)

This is a mirror of the widely-used Kaggle "PCOS detection using ultrasound
images" data, which is organised as train/test folders of infected /
notinfected ovarian ultrasound frames.

IMPORTANT LIMITATION — read before trusting any metric produced downstream:
the dataset exposes ONLY `image` and `label`. There are no patient
identifiers, so a patient-level split is impossible here. Multiple frames
from the same patient may therefore sit on both sides of a split, which can
inflate scores. `train_ultrasound.py` keeps the dataset's own `test` split
entirely untouched as the held-out set and carves validation out of `train`,
which is the best available mitigation — but it is a mitigation, not a fix.
Any metric this produces should be read as provisional.

Run:  python scripts/prepare_ultrasound.py
"""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

ML_DIR = Path(__file__).resolve().parent.parent
OUT_DIR = ML_DIR / "data" / "ultrasound"
HF_DATASET = "BTX24/PCOS-ultrasound-dataset"


def main() -> None:
    try:
        from datasets import load_dataset
    except ImportError as exc:  # pragma: no cover - dependency guidance
        raise SystemExit(
            "The 'datasets' package is required.\n"
            "Install it with:  pip install datasets pillow"
        ) from exc

    print(f"Loading {HF_DATASET} ...")
    ds = load_dataset(HF_DATASET)

    # Discover splits/classes from the data itself rather than assuming.
    print(f"Splits found: {list(ds.keys())}")
    label_feature = ds[list(ds.keys())[0]].features["label"]
    class_names = list(label_feature.names)
    print(f"Classes found: {class_names}")

    manifest: dict[str, dict] = {"dataset": HF_DATASET, "classes": class_names, "splits": {}}

    for split in ds.keys():
        split_dir = OUT_DIR / split
        counts: Counter[str] = Counter()
        corrupted = 0
        saved = 0

        for cls in class_names:
            (split_dir / cls).mkdir(parents=True, exist_ok=True)

        for i, row in enumerate(ds[split]):
            cls = class_names[row["label"]]
            img = row["image"]
            try:
                # Validate + normalise: verify it decodes, force 3-channel RGB.
                img = img.convert("RGB")
                path = split_dir / cls / f"{split}_{i:05d}.png"
                img.save(path)
                counts[cls] += 1
                saved += 1
            except Exception as exc:  # corrupted / undecodable image
                corrupted += 1
                print(f"  skipping corrupted image {split}[{i}]: {exc}")

        manifest["splits"][split] = {
            "saved": saved,
            "corrupted_skipped": corrupted,
            "per_class": dict(counts),
        }
        print(f"{split}: saved {saved} images {dict(counts)} (skipped {corrupted} corrupted)")

    manifest_path = OUT_DIR / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2))
    print(f"\nWrote {manifest_path}")
    print(
        "\nNOTE: no patient IDs exist in this dataset, so splits are image-level.\n"
        "The dataset's own 'test' split is kept untouched as the held-out set."
    )


if __name__ == "__main__":
    main()
