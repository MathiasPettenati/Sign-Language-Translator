import type { FrameAnalysis, HandLandmarkSet, Landmark, SignPrediction } from "../types/recognition";
import { clamp01, distance } from "../utils/landmarks";

type FingerName = "thumb" | "index" | "middle" | "ring" | "pinky";

type FingerState = Record<FingerName, boolean>;

type HandShape = {
  extended: FingerState;
  extendedCount: number;
  curledCount: number;
  openness: number;
  fist: boolean;
  openPalm: boolean;
  pointing: boolean;
  victory: boolean;
  water: boolean;
  lShape: boolean;
  iLoveYou: boolean;
  yShape: boolean;
};

const FINGER_INDICES = {
  thumb: { mcp: 2, pip: 3, tip: 4 },
  index: { mcp: 5, pip: 6, tip: 8 },
  middle: { mcp: 9, pip: 10, tip: 12 },
  ring: { mcp: 13, pip: 14, tip: 16 },
  pinky: { mcp: 17, pip: 18, tip: 20 },
} as const;

function getPoint(landmarks: Landmark[], index: number): Landmark {
  return landmarks[index] ?? { x: 0, y: 0, z: 0 };
}

function fingerExtended(landmarks: Landmark[], finger: Exclude<FingerName, "thumb">): boolean {
  const points = FINGER_INDICES[finger];
  const wrist = getPoint(landmarks, 0);
  const mcp = getPoint(landmarks, points.mcp);
  const pip = getPoint(landmarks, points.pip);
  const tip = getPoint(landmarks, points.tip);
  const extensionFromPalm = distance(tip, wrist) > distance(pip, wrist) * 1.04;
  const liftedInImage = tip.y < pip.y - 0.015;
  const awayFromMcp = distance(tip, mcp) > distance(pip, mcp) * 1.18;

  return extensionFromPalm && (liftedInImage || awayFromMcp);
}

function thumbExtended(landmarks: Landmark[]): boolean {
  const wrist = getPoint(landmarks, 0);
  const thumbMcp = getPoint(landmarks, 2);
  const thumbIp = getPoint(landmarks, 3);
  const thumbTip = getPoint(landmarks, 4);
  const indexMcp = getPoint(landmarks, 5);

  const fartherFromPalm = distance(thumbTip, wrist) > distance(thumbIp, wrist) * 1.04;
  const spreadFromIndex = distance(thumbTip, indexMcp) > distance(thumbMcp, indexMcp) * 1.35;

  return fartherFromPalm && spreadFromIndex;
}

function computeHandShape(hand: HandLandmarkSet): HandShape {
  const landmarks = hand.landmarks;
  const extended: FingerState = {
    thumb: thumbExtended(landmarks),
    index: fingerExtended(landmarks, "index"),
    middle: fingerExtended(landmarks, "middle"),
    ring: fingerExtended(landmarks, "ring"),
    pinky: fingerExtended(landmarks, "pinky"),
  };
  const extendedCount = Object.values(extended).filter(Boolean).length;
  const curledCount = 5 - extendedCount;
  const openness = extendedCount / 5;

  return {
    extended,
    extendedCount,
    curledCount,
    openness,
    fist:
      !extended.index &&
      !extended.middle &&
      !extended.ring &&
      !extended.pinky &&
      !extended.thumb,
    openPalm: extended.index && extended.middle && extended.ring && extended.pinky,
    pointing:
      extended.index &&
      !extended.middle &&
      !extended.ring &&
      !extended.pinky &&
      !extended.thumb,
    victory:
      extended.index &&
      extended.middle &&
      !extended.ring &&
      !extended.pinky &&
      !extended.thumb,
    water:
      extended.index &&
      extended.middle &&
      extended.ring &&
      !extended.pinky &&
      !extended.thumb,
    lShape:
      extended.thumb &&
      extended.index &&
      !extended.middle &&
      !extended.ring &&
      !extended.pinky,
    iLoveYou:
      extended.thumb &&
      extended.index &&
      !extended.middle &&
      !extended.ring &&
      extended.pinky,
    yShape:
      extended.thumb &&
      !extended.index &&
      !extended.middle &&
      !extended.ring &&
      extended.pinky,
  };
}

function confidence(base: number, shape: HandShape): number {
  const opennessPenalty = Math.abs(shape.extendedCount - Math.round(shape.openness * 5)) * 0.02;
  return clamp01(base - opennessPenalty);
}

function classifyTwoHands(hands: HandLandmarkSet[]): SignPrediction | null {
  const [first, second] = hands.map(computeHandShape);

  if ((first.fist && second.openPalm) || (second.fist && first.openPalm)) {
    return {
      label: "Help",
      confidence: 0.82,
      source: "prototype",
      reason: "One closed fist and one open support hand",
    };
  }

  if (first.pointing && second.pointing) {
    return {
      label: "Friend",
      confidence: 0.78,
      source: "prototype",
      reason: "Both hands are using an index-finger shape",
    };
  }

  return null;
}

function classifySingleHand(hand: HandLandmarkSet): SignPrediction | null {
  const shape = computeHandShape(hand);

  if (shape.iLoveYou) {
    return { label: "Love", confidence: confidence(0.91, shape), source: "prototype" };
  }

  if (shape.yShape) {
    return { label: "Y", confidence: confidence(0.86, shape), source: "prototype" };
  }

  if (shape.water) {
    return { label: "Water", confidence: confidence(0.84, shape), source: "prototype" };
  }

  if (shape.victory) {
    return { label: "V", confidence: confidence(0.83, shape), source: "prototype" };
  }

  if (shape.lShape) {
    return { label: "L", confidence: confidence(0.84, shape), source: "prototype" };
  }

  if (
    shape.extended.pinky &&
    !shape.extended.thumb &&
    !shape.extended.index &&
    !shape.extended.middle &&
    !shape.extended.ring
  ) {
    return { label: "I", confidence: confidence(0.82, shape), source: "prototype" };
  }

  if (shape.pointing) {
    return { label: "You", confidence: confidence(0.8, shape), source: "prototype" };
  }

  if (shape.openPalm) {
    return { label: "Stop", confidence: confidence(0.82, shape), source: "prototype" };
  }

  if (shape.fist) {
    return { label: "Yes", confidence: confidence(0.8, shape), source: "prototype" };
  }

  if (
    !shape.extended.index &&
    !shape.extended.middle &&
    !shape.extended.ring &&
    !shape.extended.pinky &&
    shape.extended.thumb
  ) {
    return { label: "A", confidence: confidence(0.76, shape), source: "prototype" };
  }

  if (
    !shape.extended.thumb &&
    shape.extended.index &&
    shape.extended.middle &&
    shape.extended.ring &&
    shape.extended.pinky
  ) {
    return { label: "B", confidence: confidence(0.77, shape), source: "prototype" };
  }

  return null;
}

export function classifyPrototype(frame: FrameAnalysis): SignPrediction | null {
  if (frame.hands.length === 0) {
    return null;
  }

  if (frame.hands.length >= 2) {
    const twoHandPrediction = classifyTwoHands(frame.hands.slice(0, 2));
    if (twoHandPrediction) {
      return twoHandPrediction;
    }
  }

  return classifySingleHand(frame.hands[0]);
}
