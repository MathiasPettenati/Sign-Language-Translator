import { describe, expect, it } from "vitest";

import modelLabels from "../../public/models/labels.json";
import {
  MODEL_LABELS,
  NONE_LABEL,
  SPEAKABLE_VOCABULARY_ENTRIES,
  TARGET_VOCABULARY,
  VOCABULARY_ENTRIES,
} from "./vocabulary";

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

  it("exposes every non-neutral label as a speakable word bank entry", () => {
    const speakableLabels = SPEAKABLE_VOCABULARY_ENTRIES.map((entry) => entry.label);

    expect(speakableLabels).toEqual(MODEL_LABELS.filter((label) => label !== NONE_LABEL));
  });
});
