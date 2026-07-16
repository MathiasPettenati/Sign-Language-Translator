import type { BoundingBox, HandLandmarkSet, Landmark } from "../types/recognition";

export const LANDMARK_COUNT = 21;

export const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
];

export function getBoundingBox(landmarks: Landmark[]): BoundingBox {
  const xs = landmarks.map((landmark) => landmark.x);
  const ys = landmarks.map((landmark) => landmark.y);

  return {
    xMin: Math.min(...xs),
    yMin: Math.min(...ys),
    xMax: Math.max(...xs),
    yMax: Math.max(...ys),
  };
}

export function distance(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.hypot(dx, dy, dz);
}

export function normalizeLandmarks(landmarks: Landmark[]): Landmark[] {
  if (landmarks.length !== LANDMARK_COUNT) {
    return [];
  }

  const wrist = landmarks[0];
  const palmScale = Math.max(
    distance(wrist, landmarks[9]),
    distance(landmarks[5], landmarks[17]),
    0.0001,
  );

  return landmarks.map((landmark) => ({
    x: (landmark.x - wrist.x) / palmScale,
    y: (landmark.y - wrist.y) / palmScale,
    z: (landmark.z - wrist.z) / palmScale,
    visibility: landmark.visibility,
  }));
}

export function normalizeHands(hands: HandLandmarkSet[]): Landmark[][] {
  return hands.map((hand) => normalizeLandmarks(hand.landmarks));
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
