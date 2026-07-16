from __future__ import annotations

import argparse
from collections import Counter

from common import add_common_args, prepare_dataset, read_json, save_npz, write_json


def main() -> None:
    parser = add_common_args(argparse.ArgumentParser(description="Preprocess Handspeak landmark data."))
    args = parser.parse_args()

    payload = read_json(args.input)
    dataset = prepare_dataset(payload)
    save_npz(dataset, args.output)

    write_json(
        args.labels_out,
        {
            "labels": dataset.labels,
            "labelToIndex": {label: index for index, label in enumerate(dataset.labels)},
            "featureCount": int(dataset.x.shape[1]),
            "sampleCount": int(dataset.x.shape[0]),
            "splitCounts": dict(Counter(dataset.splits.tolist())),
            "participantCount": int(len(set(dataset.participant_ids.tolist()))),
        },
    )

    print(f"Saved processed dataset to {args.output}")
    print(f"Saved label map to {args.labels_out}")


if __name__ == "__main__":
    main()
