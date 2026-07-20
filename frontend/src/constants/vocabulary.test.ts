import { describe, expect, it } from "vitest";

import modelLabels from "../../public/models/labels.json";
import { MODEL_LABELS, TARGET_VOCABULARY, VOCABULARY_ENTRIES } from "./vocabulary";

describe("vocabulary data", () => {
  it("contains at least 1,000 target words", () => {
    expect(TARGET_VOCABULARY.length).toBeGreaterThanOrEqual(1_000);
    expect(VOCABULARY_ENTRIES.length).toBeGreaterThanOrEqual(1_000);
  });

  it("keeps labels unique and aligned with model metadata", () => {
    const labels = VOCABULARY_ENTRIES.map((entry) => entry.label);

    expect(new Set(labels).size).toBe(labels.length);
    expect(modelLabels.labels).toEqual(MODEL_LABELS);
  });
});
