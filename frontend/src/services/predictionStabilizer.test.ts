import { describe, expect, it } from "vitest";

import { DEFAULT_RECOGNITION_SETTINGS } from "../constants/vocabulary";
import { PredictionStabilizer } from "./predictionStabilizer";
import type { SignPrediction } from "../types/recognition";

const stopPrediction: SignPrediction = {
  label: "Stop",
  confidence: 0.9,
  source: "prototype",
};

describe("PredictionStabilizer", () => {
  it("confirms a sign only after confidence and stability requirements are met", () => {
    const stabilizer = new PredictionStabilizer({
      ...DEFAULT_RECOGNITION_SETTINGS,
      stabilizationMs: 500,
      predictionBufferLength: 10,
      repeatCooldownMs: 900,
    });

    const first = stabilizer.update(stopPrediction, 0);
    const second = stabilizer.update(stopPrediction, 300);
    const confirmed = stabilizer.update(stopPrediction, 650);

    expect(first.status).toBe("possible");
    expect(second.justConfirmed).toBe(false);
    expect(confirmed.status).toBe("confirmed");
    expect(confirmed.justConfirmed).toBe(true);
    expect(confirmed.label).toBe("Stop");
  });

  it("does not repeat a stationary sign until neutral frames reset the last accepted sign", () => {
    const stabilizer = new PredictionStabilizer({
      ...DEFAULT_RECOGNITION_SETTINGS,
      stabilizationMs: 100,
      repeatCooldownMs: 200,
    });

    expect(stabilizer.update(stopPrediction, 0).justConfirmed).toBe(false);
    expect(stabilizer.update(stopPrediction, 150).justConfirmed).toBe(true);
    expect(stabilizer.update(stopPrediction, 500).justConfirmed).toBe(false);

    stabilizer.update(null, 700);
    stabilizer.update(null, 1_200);

    expect(stabilizer.update(stopPrediction, 1_300).justConfirmed).toBe(false);
    expect(stabilizer.update(stopPrediction, 1_500).justConfirmed).toBe(true);
  });
});
