import type { FrameAnalysis, HandLandmarkSet, SignPrediction } from "../types/recognition";
import { clamp01, distance } from "../utils/landmarks";
import { isRecord } from "./storage";

export type UserTrainedSignProfile = {
  label: string;
  vector: number[];
  samples: number;
  updatedAt: string;
};

const KEYFRAME_COUNT = 4;
const MAX_PROFILE_DISTANCE = 1.2;

function handednessValue(hand: HandLandmarkSet): number {
  if (hand.handedness === "Left") {
    return -1;
  }

  if (hand.handedness === "Right") {
    return 1;
  }

  return 0;
}

function handSortValue(hand: HandLandmarkSet): number {
  if (hand.handedness === "Left") {
    return -2;
  }

  if (hand.handedness === "Right") {
    return 2;
  }

  return hand.boundingBox.xMin;
}

function encodeHand(hand: HandLandmarkSet | undefined): number[] {
  if (!hand) {
    return Array.from({ length: 65 }, () => 0);
  }

  const wrist = hand.landmarks[0];
  const middleMcp = hand.landmarks[9] ?? wrist;
  const palmScale = Math.max(
    distance(wrist, middleMcp),
    hand.boundingBox.xMax - hand.boundingBox.xMin,
    hand.boundingBox.yMax - hand.boundingBox.yMin,
    0.05,
  );
  const features = hand.landmarks.slice(0, 21).flatMap((landmark) => [
    (landmark.x - wrist.x) / palmScale,
    (landmark.y - wrist.y) / palmScale,
    (landmark.z - wrist.z) / palmScale,
  ]);

  while (features.length < 63) {
    features.push(0);
  }

  return [...features, 1, handednessValue(hand)];
}

function encodeFrame(frame: FrameAnalysis): number[] {
  const hands = [...frame.hands].sort((first, second) => handSortValue(first) - handSortValue(second));
  return [encodeHand(hands[0]), encodeHand(hands[1])].flat();
}

function quantizeVector(vector: number[]): number[] {
  return vector.map((value) => Math.round(value * 1_000) / 1_000);
}

export function encodeFrameSequence(frames: FrameAnalysis[]): number[] | null {
  const usableFrames = frames.filter((frame) => frame.hands.length > 0);

  if (usableFrames.length === 0) {
    return null;
  }

  return quantizeVector(
    Array.from({ length: KEYFRAME_COUNT }).flatMap((_, index) => {
      const frameIndex =
        usableFrames.length === 1
          ? 0
          : Math.round((index * (usableFrames.length - 1)) / (KEYFRAME_COUNT - 1));

      return encodeFrame(usableFrames[frameIndex]);
    }),
  );
}

function meanSquaredDistance(first: number[], second: number[]): number {
  if (first.length !== second.length) {
    return Infinity;
  }

  const total = first.reduce((sum, value, index) => {
    const delta = value - second[index];
    return sum + delta * delta;
  }, 0);

  return Math.sqrt(total / Math.max(1, first.length));
}

function confidenceFromDistance(bestDistance: number, secondDistance: number | null): number {
  const absoluteConfidence = 1 - bestDistance / MAX_PROFILE_DISTANCE;

  if (secondDistance === null || !Number.isFinite(secondDistance)) {
    return clamp01(absoluteConfidence);
  }

  const relativeMargin = (secondDistance - bestDistance) / Math.max(secondDistance, 0.001);
  return clamp01(absoluteConfidence * 0.72 + relativeMargin * 0.28);
}

export function classifyUserTrainedSign(
  profiles: UserTrainedSignProfile[],
  frames: FrameAnalysis[],
): SignPrediction | null {
  const vector = encodeFrameSequence(frames);

  if (!vector || profiles.length === 0) {
    return null;
  }

  const matches = profiles
    .map((profile) => ({
      profile,
      distance: meanSquaredDistance(vector, profile.vector),
    }))
    .filter((match) => Number.isFinite(match.distance))
    .sort((first, second) => first.distance - second.distance);

  const best = matches[0];

  if (!best || best.distance > MAX_PROFILE_DISTANCE) {
    return null;
  }

  const confidence = confidenceFromDistance(best.distance, matches[1]?.distance ?? null);

  return {
    label: best.profile.label,
    confidence,
    source: "user-trained",
    reason: `Matched ${best.profile.samples} local sample${best.profile.samples === 1 ? "" : "s"}`,
  };
}

export function trainUserSignProfile(
  profiles: UserTrainedSignProfile[],
  label: string,
  vector: number[],
): UserTrainedSignProfile[] {
  const now = new Date().toISOString();
  const existing = profiles.find((profile) => profile.label === label);

  if (!existing || existing.vector.length !== vector.length) {
    return [
      ...profiles.filter((profile) => profile.label !== label),
      {
        label,
        vector: quantizeVector(vector),
        samples: 1,
        updatedAt: now,
      },
    ];
  }

  const samples = existing.samples + 1;
  const averagedVector = existing.vector.map((value, index) => {
    const nextValue = (value * existing.samples + vector[index]) / samples;
    return Math.round(nextValue * 1_000) / 1_000;
  });

  return profiles.map((profile) =>
    profile.label === label
      ? {
          ...profile,
          vector: averagedVector,
          samples,
          updatedAt: now,
        }
      : profile,
  );
}

export function removeUserTrainedProfile(
  profiles: UserTrainedSignProfile[],
  label: string,
): UserTrainedSignProfile[] {
  return profiles.filter((profile) => profile.label !== label);
}

export function isUserTrainedSignProfiles(value: unknown): value is UserTrainedSignProfile[] {
  return (
    Array.isArray(value) &&
    value.every(
      (profile) =>
        isRecord(profile) &&
        typeof profile.label === "string" &&
        typeof profile.samples === "number" &&
        Number.isFinite(profile.samples) &&
        typeof profile.updatedAt === "string" &&
        Array.isArray(profile.vector) &&
        profile.vector.every((entry) => typeof entry === "number" && Number.isFinite(entry)),
    )
  );
}
