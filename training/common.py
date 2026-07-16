from __future__ import annotations

import argparse
import json
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np

LANDMARK_COUNT = 21
COORDS_PER_LANDMARK = 3
HANDEDNESS_FEATURES = 3
MAX_HANDS = 2
FEATURES_PER_HAND = LANDMARK_COUNT * COORDS_PER_LANDMARK + HANDEDNESS_FEATURES
FEATURE_COUNT = MAX_HANDS * FEATURES_PER_HAND


@dataclass(frozen=True)
class PreparedDataset:
    x: np.ndarray
    y: np.ndarray
    labels: list[str]
    splits: np.ndarray
    participant_ids: np.ndarray
    session_ids: np.ndarray
    sample_ids: np.ndarray


def read_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        payload = json.load(file)

    if not isinstance(payload, dict):
        raise ValueError("Dataset export must be a JSON object.")

    return payload


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, indent=2)


def extract_samples(payload: dict[str, Any]) -> list[dict[str, Any]]:
    samples = payload.get("samples")
    if not isinstance(samples, list):
        raise ValueError("Dataset export is missing a 'samples' array.")

    return [sample for sample in samples if isinstance(sample, dict)]


def validate_session_splits(samples: list[dict[str, Any]]) -> None:
    session_splits: dict[str, set[str]] = defaultdict(set)

    for sample in samples:
        session_id = str(sample.get("sessionId", "unknown-session"))
        split = str(sample.get("split", "train"))
        session_splits[session_id].add(split)

    leaked_sessions = {
        session_id: sorted(splits)
        for session_id, splits in session_splits.items()
        if len(splits) > 1
    }

    if leaked_sessions:
        raise ValueError(
            "A recording session appears in multiple splits. "
            f"Start a new session before changing splits: {leaked_sessions}"
        )


def normalize_landmarks(landmarks: list[dict[str, Any]]) -> list[dict[str, float]]:
    if len(landmarks) != LANDMARK_COUNT:
        return []

    wrist = landmarks[0]
    middle_mcp = landmarks[9]
    index_mcp = landmarks[5]
    pinky_mcp = landmarks[17]
    palm_scale = max(
        distance(wrist, middle_mcp),
        distance(index_mcp, pinky_mcp),
        0.0001,
    )

    return [
        {
            "x": (float(point.get("x", 0.0)) - float(wrist.get("x", 0.0))) / palm_scale,
            "y": (float(point.get("y", 0.0)) - float(wrist.get("y", 0.0))) / palm_scale,
            "z": (float(point.get("z", 0.0)) - float(wrist.get("z", 0.0))) / palm_scale,
        }
        for point in landmarks
    ]


def distance(a: dict[str, Any], b: dict[str, Any]) -> float:
    return float(
        np.linalg.norm(
            [
                float(a.get("x", 0.0)) - float(b.get("x", 0.0)),
                float(a.get("y", 0.0)) - float(b.get("y", 0.0)),
                float(a.get("z", 0.0)) - float(b.get("z", 0.0)),
            ]
        )
    )


def handedness_vector(value: str) -> list[float]:
    lowered = value.lower()
    return [
        1.0 if lowered == "left" else 0.0,
        1.0 if lowered == "right" else 0.0,
        1.0 if lowered not in {"left", "right"} else 0.0,
    ]


def hand_sort_key(hand: dict[str, Any]) -> tuple[int, str]:
    handedness = str(hand.get("handedness", "Unknown"))
    order = {"Left": 0, "Right": 1, "Unknown": 2}
    return order.get(handedness, 2), handedness


def sample_to_features(sample: dict[str, Any]) -> np.ndarray:
    normalized_hands = sample.get("normalizedHands")
    raw_hands = sample.get("hands")

    hands: list[dict[str, Any]]
    if isinstance(raw_hands, list):
        hands = [hand for hand in raw_hands if isinstance(hand, dict)]
    else:
        hands = []

    normalized: list[list[dict[str, Any]]] = []
    if isinstance(normalized_hands, list):
        for hand in normalized_hands:
            if isinstance(hand, list):
                normalized.append([point for point in hand if isinstance(point, dict)])

    if not normalized and hands:
        normalized = [
            normalize_landmarks(hand.get("landmarks", []))
            for hand in hands
            if isinstance(hand.get("landmarks"), list)
        ]

    hands = sorted(hands, key=hand_sort_key)[:MAX_HANDS]
    features: list[float] = []

    for index in range(MAX_HANDS):
        hand_landmarks = normalized[index] if index < len(normalized) else []
        hand_metadata = hands[index] if index < len(hands) else {}

        for point_index in range(LANDMARK_COUNT):
            point = hand_landmarks[point_index] if point_index < len(hand_landmarks) else {}
            features.extend(
                [
                    float(point.get("x", 0.0)),
                    float(point.get("y", 0.0)),
                    float(point.get("z", 0.0)),
                ]
            )

        features.extend(handedness_vector(str(hand_metadata.get("handedness", "Unknown"))))

    return np.asarray(features, dtype=np.float32)


def prepare_dataset(payload: dict[str, Any]) -> PreparedDataset:
    samples = extract_samples(payload)
    if not samples:
        raise ValueError("The dataset export does not contain any samples.")

    validate_session_splits(samples)

    labels = sorted({str(sample.get("label", "none")) for sample in samples})
    label_to_index = {label: index for index, label in enumerate(labels)}
    x = np.vstack([sample_to_features(sample) for sample in samples]).astype(np.float32)
    y = np.asarray([label_to_index[str(sample.get("label", "none"))] for sample in samples], dtype=np.int64)
    splits = np.asarray([str(sample.get("split", "train")) for sample in samples])
    participant_ids = np.asarray([str(sample.get("participantId", "unknown")) for sample in samples])
    session_ids = np.asarray([str(sample.get("sessionId", "unknown")) for sample in samples])
    sample_ids = np.asarray([str(sample.get("id", index)) for index, sample in enumerate(samples)])

    if x.shape[1] != FEATURE_COUNT:
        raise ValueError(f"Expected {FEATURE_COUNT} features, received {x.shape[1]}.")

    return PreparedDataset(
        x=x,
        y=y,
        labels=labels,
        splits=splits,
        participant_ids=participant_ids,
        session_ids=session_ids,
        sample_ids=sample_ids,
    )


def save_npz(dataset: PreparedDataset, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(
        output_path,
        x=dataset.x,
        y=dataset.y,
        labels=np.asarray(dataset.labels),
        splits=dataset.splits,
        participant_ids=dataset.participant_ids,
        session_ids=dataset.session_ids,
        sample_ids=dataset.sample_ids,
    )


def load_npz(path: Path) -> PreparedDataset:
    payload = np.load(path, allow_pickle=False)
    return PreparedDataset(
        x=payload["x"],
        y=payload["y"],
        labels=[str(label) for label in payload["labels"].tolist()],
        splits=payload["splits"],
        participant_ids=payload["participant_ids"],
        session_ids=payload["session_ids"],
        sample_ids=payload["sample_ids"],
    )


def split_indices(dataset: PreparedDataset, split: str) -> np.ndarray:
    return np.where(dataset.splits == split)[0]


def add_common_args(parser: argparse.ArgumentParser) -> argparse.ArgumentParser:
    parser.add_argument("--input", required=True, type=Path, help="Path to dataset export JSON.")
    parser.add_argument(
        "--output",
        default=Path("data/processed/static_landmarks.npz"),
        type=Path,
        help="Path for the processed NumPy dataset.",
    )
    parser.add_argument(
        "--labels-out",
        default=Path("data/processed/labels.json"),
        type=Path,
        help="Path for the generated label map.",
    )
    return parser
