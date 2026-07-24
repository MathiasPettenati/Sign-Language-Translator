import { describe, expect, it } from "vitest";

import { formatAslSignsLabel, sampleHolisticFrames } from "./aslSignsClassifier";
import type { HolisticLandmarkFrame } from "../types/recognition";

function makeFrame(index: number): HolisticLandmarkFrame {
  return {
    landmarks: [
      {
        x: index,
        y: index,
        z: index,
      },
    ],
    detectedParts: {
      face: false,
      pose: false,
      leftHand: true,
      rightHand: false,
    },
  };
}

describe("ASL Signs classifier helpers", () => {
  it("formats compressed ASL Signs labels for display", () => {
    expect(formatAslSignsLabel("thankyou")).toBe("Thank you");
    expect(formatAslSignsLabel("frenchfries")).toBe("French fries");
    expect(formatAslSignsLabel("apple")).toBe("Apple");
  });

  it("samples a sequence evenly when a fixed frame count is required", () => {
    const frames = [0, 1, 2, 3, 4].map(makeFrame);

    expect(sampleHolisticFrames(frames, 3).map((frame) => frame.landmarks[0].x)).toEqual([
      0, 2, 4,
    ]);
  });
});
