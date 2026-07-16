from __future__ import annotations

import argparse
from pathlib import Path
import shutil

import tensorflow as tf

from common import load_npz, write_json


def main() -> None:
    parser = argparse.ArgumentParser(description="Export a trained Keras model as TensorFlow Lite.")
    parser.add_argument("--data", default=Path("data/processed/static_landmarks.npz"), type=Path)
    parser.add_argument("--model", default=Path("outputs/static_classifier/best_model.keras"), type=Path)
    parser.add_argument("--output", default=Path("outputs/static_classifier/sign_classifier.tflite"), type=Path)
    parser.add_argument("--frontend-model-dir", default=Path("../frontend/public/models"), type=Path)
    parser.add_argument("--copy-to-frontend", action="store_true")
    args = parser.parse_args()

    dataset = load_npz(args.data)
    model = tf.keras.models.load_model(args.model)
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_model = converter.convert()

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(tflite_model)
    label_payload = {
        "version": "custom",
        "mode": "isolated-sign-mvp",
        "labels": dataset.labels,
        "featureCount": int(dataset.x.shape[1]),
    }
    write_json(args.output.with_name("labels.json"), label_payload)

    if args.copy_to_frontend:
        args.frontend_model_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(args.output, args.frontend_model_dir / "sign_classifier.tflite")
        write_json(args.frontend_model_dir / "labels.json", label_payload)

    print(f"Saved TensorFlow Lite model to {args.output}")


if __name__ == "__main__":
    main()
