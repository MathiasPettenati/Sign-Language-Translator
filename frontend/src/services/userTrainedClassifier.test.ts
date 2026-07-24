import { describe, expect, it } from "vitest";

import type { FrameAnalysis, HandLandmarkSet, Landmark } from "../types/recognition";
import {
  classifyUserTrainedSign,
  encodeFrameSequence,
  trainUserSignProfile,
} from "./userTrainedClassifier";

function createHand(spread: number): HandLandmarkSet {
  const landmarks: Landmark[] = Array.from({ length: 21 }, (_, index) => ({
    x: 0.45 + index * 0.012 * spread,
    y: 0.35 + index * 0.006 * (2 - spread),
    z: index * 0.001 * spread,
  }));
  const xs = landmarks.map((landmark) => landmark.x);
  const ys = landmarks.map((landmark) => landmark.y);

  return {
    id: "hand-0",
    landmarks,
    handedness: "Right",
    handednessScore: 0.98,
    boundingBox: {
      xMin: Math.min(...xs),
      yMin: Math.min(...ys),
      xMax: Math.max(...xs),
      yMax: Math.max(...ys),
    },
  };
}

function createFrame(spread: number): FrameAnalysis {
  return {
    hands: [createHand(spread)],
    holisticLandmarks: null,
    gesturePrediction: null,
    timestampMs: 1_000,
    modelWarnings: [],
  };
}

describe("user trained classifier", () => {
  it("matches a locally trained word profile from landmark motion", () => {
    const helloVector = encodeFrameSequence([createFrame(0.8)]);
    const waterVector = encodeFrameSequence([createFrame(1.7)]);

    expect(helloVector).not.toBeNull();
    expect(waterVector).not.toBeNull();

    let profiles = trainUserSignProfile([], "Hello", helloVector ?? []);
    profiles = trainUserSignProfile(profiles, "Water", waterVector ?? []);

    const prediction = classifyUserTrainedSign(profiles, [createFrame(0.8)]);

    expect(prediction?.label).toBe("Hello");
    expect(prediction?.source).toBe("user-trained");
    expect(prediction?.confidence).toBeGreaterThan(0.75);
  });
});
