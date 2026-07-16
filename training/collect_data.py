from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import cv2
import mediapipe as mp

from common import normalize_landmarks


def make_sample(label: str, participant: str, session: str, split: str, results: object) -> dict[str, object]:
    hands: list[dict[str, object]] = []
    multi_hand_landmarks = getattr(results, "multi_hand_landmarks", None) or []
    multi_handedness = getattr(results, "multi_handedness", None) or []

    for index, hand_landmarks in enumerate(multi_hand_landmarks):
        landmarks = [
            {"x": point.x, "y": point.y, "z": point.z}
            for point in hand_landmarks.landmark
        ]
        handedness = "Unknown"
        score = 0.0

        if index < len(multi_handedness):
            category = multi_handedness[index].classification[0]
            handedness = category.label
            score = float(category.score)

        xs = [point["x"] for point in landmarks]
        ys = [point["y"] for point in landmarks]
        hands.append(
            {
                "id": f"hand-{index}",
                "landmarks": landmarks,
                "handedness": handedness,
                "handednessScore": score,
                "boundingBox": {
                    "xMin": min(xs),
                    "yMin": min(ys),
                    "xMax": max(xs),
                    "yMax": max(ys),
                },
            }
        )

    return {
        "id": f"sample_{uuid4()}",
        "label": label,
        "participantId": participant,
        "sessionId": session,
        "split": split,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "hands": hands,
        "normalizedHands": [normalize_landmarks(hand["landmarks"]) for hand in hands],
        "mirroredCamera": True,
        "notes": "Captured with training/collect_data.py",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Capture landmark samples with OpenCV and MediaPipe.")
    parser.add_argument("--label", required=True)
    parser.add_argument("--participant", required=True)
    parser.add_argument("--split", default="train", choices=["train", "validation", "test"])
    parser.add_argument("--output", default=Path("data/raw/collector_export.json"), type=Path)
    parser.add_argument("--camera", default=0, type=int)
    args = parser.parse_args()

    args.output.parent.mkdir(parents=True, exist_ok=True)
    samples: list[dict[str, object]] = []
    if args.output.exists():
        with args.output.open("r", encoding="utf-8") as file:
            existing_payload = json.load(file)
        samples = existing_payload.get("samples", [])

    session = f"session_{uuid4()}"
    cap = cv2.VideoCapture(args.camera)
    mp_hands = mp.solutions.hands

    with mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.55,
        min_tracking_confidence=0.55,
    ) as hands_detector:
        while cap.isOpened():
            ok, frame = cap.read()
            if not ok:
                break

            frame = cv2.flip(frame, 1)
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands_detector.process(rgb_frame)
            cv2.putText(
                frame,
                "Space: capture   N: new session   Q: quit",
                (16, 32),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.75,
                (255, 255, 255),
                2,
            )
            cv2.imshow("Handspeak Collector", frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord("q"):
                break
            if key == ord("n"):
                session = f"session_{uuid4()}"
            if key == 32:
                sample = make_sample(args.label, args.participant, session, args.split, results)
                samples.append(sample)
                print(f"Captured sample {sample['id']} with {len(sample['hands'])} hand(s).")

    cap.release()
    cv2.destroyAllWindows()

    payload = {
        "schemaVersion": 1,
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "appVersion": "python-collector",
        "samples": samples,
    }
    with args.output.open("w", encoding="utf-8") as file:
        json.dump(payload, file, indent=2)

    print(f"Saved {len(samples)} sample(s) to {args.output}")


if __name__ == "__main__":
    main()
