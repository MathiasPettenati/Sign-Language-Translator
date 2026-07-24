import {
  FilesetResolver,
  GestureRecognizer,
  HandLandmarker,
  HolisticLandmarker,
  type GestureRecognizerResult,
  type HandLandmarkerResult,
  type HolisticLandmarkerResult,
} from "@mediapipe/tasks-vision";

import type {
  FrameAnalysis,
  Handedness,
  HandLandmarkSet,
  HolisticLandmarkFrame,
  Landmark,
  ModelLoadState,
  SignPrediction,
} from "../types/recognition";
import { getBoundingBox } from "../utils/landmarks";
import { LOCAL_GESTURE_MODEL_URL, localGestureModelExists } from "./modelAssets";

const WASM_BASE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";
const HAND_LANDMARKER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const HOLISTIC_LANDMARKER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/latest/holistic_landmarker.task";

const FACE_LANDMARK_COUNT = 468;
const HAND_LANDMARK_COUNT = 21;
const POSE_LANDMARK_COUNT = 33;

type CreateServiceOptions = {
  onStateChange?: (state: ModelLoadState) => void;
  numHands?: number;
};

const INITIAL_STATE: ModelLoadState = {
  handLandmarker: "idle",
  holisticLandmarker: "idle",
  gestureRecognizer: "idle",
  aslSignsModel: "idle",
  message: "MediaPipe is not loaded yet.",
};

function toLandmark(landmark: { x: number; y: number; z?: number; visibility?: number }): Landmark {
  return {
    x: landmark.x,
    y: landmark.y,
    z: landmark.z ?? 0,
    visibility: landmark.visibility,
  };
}

function getHandednessName(value: string | undefined): Handedness {
  if (value === "Left" || value === "Right") {
    return value;
  }

  return "Unknown";
}

function mapHands(result: HandLandmarkerResult): HandLandmarkSet[] {
  return result.landmarks.map((landmarks, index) => {
    const convertedLandmarks = landmarks.map(toLandmark);
    const handedness = result.handednesses[index]?.[0];

    return {
      id: `hand-${index}`,
      landmarks: convertedLandmarks,
      handedness: getHandednessName(handedness?.categoryName),
      handednessScore: handedness?.score ?? 0,
      boundingBox: getBoundingBox(convertedLandmarks),
    };
  });
}

function appendLandmarkPart(
  target: Landmark[],
  landmarks: Array<{ x: number; y: number; z?: number; visibility?: number }> | undefined,
  expectedCount: number,
): void {
  for (let index = 0; index < expectedCount; index += 1) {
    const landmark = landmarks?.[index];
    target.push(
      landmark
        ? toLandmark(landmark)
        : {
            x: Number.NaN,
            y: Number.NaN,
            z: Number.NaN,
          },
    );
  }
}

function mapHolisticLandmarks(result: HolisticLandmarkerResult): HolisticLandmarkFrame {
  const face = result.faceLandmarks[0];
  const leftHand = result.leftHandLandmarks[0];
  const pose = result.poseLandmarks[0];
  const rightHand = result.rightHandLandmarks[0];
  const landmarks: Landmark[] = [];

  appendLandmarkPart(landmarks, face, FACE_LANDMARK_COUNT);
  appendLandmarkPart(landmarks, leftHand, HAND_LANDMARK_COUNT);
  appendLandmarkPart(landmarks, pose, POSE_LANDMARK_COUNT);
  appendLandmarkPart(landmarks, rightHand, HAND_LANDMARK_COUNT);

  return {
    landmarks,
    detectedParts: {
      face: Boolean(face?.length),
      leftHand: Boolean(leftHand?.length),
      pose: Boolean(pose?.length),
      rightHand: Boolean(rightHand?.length),
    },
  };
}

function getGesturePrediction(result: GestureRecognizerResult): SignPrediction | null {
  const topGesture = result.gestures[0]?.[0];

  if (!topGesture?.categoryName) {
    return null;
  }

  return {
    label: topGesture.categoryName.replace(/_/g, " "),
    confidence: topGesture.score ?? 0,
    source: "mediapipe-model",
  };
}

export class MediaPipeService {
  private constructor(
    private readonly handLandmarker: HandLandmarker,
    private readonly holisticLandmarker: HolisticLandmarker | null,
    private readonly gestureRecognizer: GestureRecognizer | null,
    private readonly warnings: string[],
  ) {}

  static async create(options: CreateServiceOptions = {}): Promise<MediaPipeService> {
    const updateState = options.onStateChange ?? (() => undefined);
    updateState({ ...INITIAL_STATE, handLandmarker: "loading", message: "Loading MediaPipe WASM." });

    const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL);

    updateState({
      handLandmarker: "loading",
      holisticLandmarker: "idle",
      gestureRecognizer: "idle",
      aslSignsModel: "idle",
      message: "Loading hand landmark model.",
    });

    const handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: HAND_LANDMARKER_MODEL_URL,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: options.numHands ?? 2,
      minHandDetectionConfidence: 0.55,
      minHandPresenceConfidence: 0.55,
      minTrackingConfidence: 0.55,
    });

    const warnings: string[] = [];
    let holisticLandmarker: HolisticLandmarker | null = null;
    let gestureRecognizer: GestureRecognizer | null = null;

    updateState({
      handLandmarker: "ready",
      holisticLandmarker: "loading",
      gestureRecognizer: "idle",
      aslSignsModel: "idle",
      message: "Loading holistic landmarks for the ASL Signs model.",
    });

    try {
      holisticLandmarker = await HolisticLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: HOLISTIC_LANDMARKER_MODEL_URL,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        minFaceDetectionConfidence: 0.55,
        minFacePresenceConfidence: 0.55,
        minPoseDetectionConfidence: 0.55,
        minPosePresenceConfidence: 0.55,
        minHandLandmarksConfidence: 0.55,
      });
    } catch (error) {
      warnings.push(
        error instanceof Error
          ? error.message
          : "The holistic landmark model could not be loaded.",
      );
      updateState({
        handLandmarker: "ready",
        holisticLandmarker: "error",
        gestureRecognizer: "idle",
        aslSignsModel: "idle",
        message: "Hand landmarks are active. Holistic ASL model input failed to load.",
      });
    }

    updateState({
      handLandmarker: "ready",
      holisticLandmarker: holisticLandmarker ? "ready" : "error",
      gestureRecognizer: "loading",
      aslSignsModel: "idle",
      message: "Checking for a custom gesture model.",
    });

    if (await localGestureModelExists()) {
      try {
        gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: LOCAL_GESTURE_MODEL_URL,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: options.numHands ?? 2,
        });
      } catch (error) {
        warnings.push(error instanceof Error ? error.message : "The gesture model could not be loaded.");
        updateState({
          handLandmarker: "ready",
          holisticLandmarker: holisticLandmarker ? "ready" : "error",
          gestureRecognizer: "error",
          aslSignsModel: "idle",
          message: "Hand landmarks are active. The custom gesture model failed to load.",
        });
      }
    } else {
      warnings.push(
        "No custom gesture_recognizer.task found. Camera auto-recognition is using local trained profiles and built-in hand-shape rules.",
      );
      updateState({
        handLandmarker: "ready",
        holisticLandmarker: holisticLandmarker ? "ready" : "error",
        gestureRecognizer: "missing",
        aslSignsModel: "idle",
        message: "Hand landmarks are active. Local training and rule-based recognition are enabled.",
      });
    }

    if (gestureRecognizer) {
      updateState({
        handLandmarker: "ready",
        holisticLandmarker: holisticLandmarker ? "ready" : "error",
        gestureRecognizer: "ready",
        aslSignsModel: "idle",
        message: "Hand landmarks and custom gesture recognition are active.",
      });
    }

    return new MediaPipeService(handLandmarker, holisticLandmarker, gestureRecognizer, warnings);
  }

  detect(video: HTMLVideoElement, timestampMs: number): FrameAnalysis {
    const handResult = this.handLandmarker.detectForVideo(video, timestampMs);
    const holisticResult = this.holisticLandmarker?.detectForVideo(video, timestampMs) ?? null;
    const gestureResult = this.gestureRecognizer?.recognizeForVideo(video, timestampMs) ?? null;

    return {
      hands: mapHands(handResult),
      holisticLandmarks: holisticResult ? mapHolisticLandmarks(holisticResult) : null,
      gesturePrediction: gestureResult ? getGesturePrediction(gestureResult) : null,
      timestampMs,
      modelWarnings: this.warnings,
    };
  }

  dispose(): void {
    this.handLandmarker.close();
    this.holisticLandmarker?.close();
    this.gestureRecognizer?.close();
  }
}
