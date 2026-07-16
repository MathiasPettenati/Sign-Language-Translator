from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.utils.class_weight import compute_class_weight

from common import load_npz, split_indices, write_json


def build_model(feature_count: int, class_count: int) -> tf.keras.Model:
    inputs = tf.keras.Input(shape=(feature_count,), name="static_landmarks")
    x = tf.keras.layers.LayerNormalization()(inputs)
    x = tf.keras.layers.Dense(192, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.25)(x)
    x = tf.keras.layers.Dense(96, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.18)(x)
    outputs = tf.keras.layers.Dense(class_count, activation="softmax", name="sign")(x)
    model = tf.keras.Model(inputs=inputs, outputs=outputs)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def main() -> None:
    parser = argparse.ArgumentParser(description="Train a static isolated-sign classifier.")
    parser.add_argument("--data", default=Path("data/processed/static_landmarks.npz"), type=Path)
    parser.add_argument("--output-dir", default=Path("outputs/static_classifier"), type=Path)
    parser.add_argument("--epochs", default=80, type=int)
    parser.add_argument("--batch-size", default=32, type=int)
    args = parser.parse_args()

    dataset = load_npz(args.data)
    train_idx = split_indices(dataset, "train")
    val_idx = split_indices(dataset, "validation")

    if len(train_idx) == 0:
        raise ValueError("No training samples found. Capture samples with split='train'.")
    if len(val_idx) == 0:
        raise ValueError("No validation samples found. Capture a separate validation session.")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    model = build_model(dataset.x.shape[1], len(dataset.labels))

    classes = np.unique(dataset.y[train_idx])
    weights = compute_class_weight(class_weight="balanced", classes=classes, y=dataset.y[train_idx])
    class_weight = {int(label): float(weight) for label, weight in zip(classes, weights)}

    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_accuracy",
            patience=12,
            restore_best_weights=True,
        ),
        tf.keras.callbacks.ModelCheckpoint(
            filepath=args.output_dir / "best_model.keras",
            monitor="val_accuracy",
            save_best_only=True,
        ),
    ]

    history = model.fit(
        dataset.x[train_idx],
        dataset.y[train_idx],
        validation_data=(dataset.x[val_idx], dataset.y[val_idx]),
        epochs=args.epochs,
        batch_size=args.batch_size,
        class_weight=class_weight,
        callbacks=callbacks,
        verbose=2,
    )

    model.save(args.output_dir / "final_model.keras")
    pd.DataFrame(history.history).to_csv(args.output_dir / "training_history.csv", index=False)
    write_json(
        args.output_dir / "metadata.json",
        {
            "labels": dataset.labels,
            "featureCount": int(dataset.x.shape[1]),
            "trainSamples": int(len(train_idx)),
            "validationSamples": int(len(val_idx)),
            "epochsRun": int(len(history.history["loss"])),
            "bestValidationAccuracy": float(max(history.history.get("val_accuracy", [0.0]))),
        },
    )

    print(f"Saved trained models and metadata in {args.output_dir}")


if __name__ == "__main__":
    main()
