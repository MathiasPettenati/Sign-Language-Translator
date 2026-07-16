from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix

from common import load_npz, split_indices, write_json


def confused_pairs(matrix: np.ndarray, labels: list[str], limit: int = 10) -> list[dict[str, object]]:
    pairs: list[dict[str, object]] = []
    for actual_index, actual_label in enumerate(labels):
        for predicted_index, predicted_label in enumerate(labels):
            if actual_index == predicted_index:
                continue
            count = int(matrix[actual_index, predicted_index])
            if count > 0:
                pairs.append(
                    {
                        "actual": actual_label,
                        "predicted": predicted_label,
                        "count": count,
                    }
                )

    return sorted(pairs, key=lambda item: int(item["count"]), reverse=True)[:limit]


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate a static isolated-sign classifier.")
    parser.add_argument("--data", default=Path("data/processed/static_landmarks.npz"), type=Path)
    parser.add_argument("--model", default=Path("outputs/static_classifier/best_model.keras"), type=Path)
    parser.add_argument("--split", default="test", choices=["train", "validation", "test"])
    parser.add_argument("--output-dir", default=Path("outputs/static_classifier/evaluation"), type=Path)
    args = parser.parse_args()

    dataset = load_npz(args.data)
    split_idx = split_indices(dataset, args.split)
    if len(split_idx) == 0:
        raise ValueError(f"No samples found for split='{args.split}'.")

    model = tf.keras.models.load_model(args.model)
    probabilities = model.predict(dataset.x[split_idx], verbose=0)
    predictions = probabilities.argmax(axis=1)
    y_true = dataset.y[split_idx]

    report = classification_report(
        y_true,
        predictions,
        labels=list(range(len(dataset.labels))),
        target_names=dataset.labels,
        output_dict=True,
        zero_division=0,
    )
    matrix = confusion_matrix(y_true, predictions, labels=list(range(len(dataset.labels))))

    args.output_dir.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(report).transpose().to_csv(args.output_dir / f"{args.split}_classification_report.csv")
    pd.DataFrame(matrix, index=dataset.labels, columns=dataset.labels).to_csv(
        args.output_dir / f"{args.split}_confusion_matrix.csv"
    )
    write_json(
        args.output_dir / f"{args.split}_metrics.json",
        {
            "split": args.split,
            "sampleCount": int(len(split_idx)),
            "accuracy": float(report["accuracy"]),
            "macroF1": float(report["macro avg"]["f1-score"]),
            "weightedF1": float(report["weighted avg"]["f1-score"]),
            "commonlyConfused": confused_pairs(matrix, dataset.labels),
        },
    )

    print(f"Saved evaluation artifacts in {args.output_dir}")


if __name__ == "__main__":
    main()
