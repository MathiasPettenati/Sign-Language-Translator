import { describe, expect, it } from "vitest";

import modelLabels from "../../public/models/labels.json";
import { DATASET_LABELS, TARGET_VOCABULARY, VOCABULARY_DATABASE } from "./vocabulary";

describe("vocabulary data", () => {
  it("contains at least 1,000 target words", () => {
    expect(TARGET_VOCABULARY.length).toBeGreaterThanOrEqual(1_000);
    expect(VOCABULARY_DATABASE.length).toBeGreaterThanOrEqual(1_000);
  });

  it("keeps labels unique and aligned with model metadata", () => {
    const databaseLabels = VOCABULARY_DATABASE.map((entry) => entry.label);

    expect(new Set(databaseLabels).size).toBe(databaseLabels.length);
    expect(modelLabels.labels).toEqual(DATASET_LABELS);
  });
});
