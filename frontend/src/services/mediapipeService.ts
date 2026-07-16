import {
  FilesetResolver,
  GestureRecognizer,
  HandLandmarker,
  type GestureRecognizerResult,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";

import type {
  FrameAnalysis,
  Handedness,
  HandLandmarkSet,
  Landmark,
  ModelLoadState,
  SignPrediction,
} from "../types/recognition";
import { getBoundingBox } from "../utils/landmarks";
import { LOCAL_GESTURE_MODEL_URL, localGestureModelExists } from "./modelAssets";

const WASM_BASE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";
const HAND_LANDMARKER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

type CreateServiceOptions = {
  onStateChange?: (state: ModelLoadState) => void;
  numHands?: number;
};

const INITIAL_STATE: ModelLoadState = {
  handLandmarker: "idle",
  gestureRecognizer: "idle",
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
    private readonly gestureRecognizer: GestureRecognizer | null,
    private readonly warnings: string[],
  ) {}

  static async create(options: CreateServiceOptions = {}): Promise<MediaPipeService> {
    const updateState = options.onStateChange ?? (() => undefined);
    updateState({ ...INITIAL_STATE, handLandmarker: "loading", message: "Loading MediaPipe WASM." });

    const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL);

    updateState({
      handLandmarker: "loading",
      gestureRecognizer: "idle",
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
    let gestureRecognizer: GestureRecognizer | null = null;

    updateState({
      handLandmarker: "ready",
      gestureRecognizer: "loading",
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
          gestureRecognizer: "error",
          message: "Hand landmarks are active. The custom gesture model failed to load.",
        });
      }
    } else {
      warnings.push("No custom gesture_recognizer.task found. Using the built-in prototype classifier.");
      updateState({
        handLandmarker: "ready",
        gestureRecognizer: "missing",
        message: "Hand landmarks are active. Prototype static recognition is enabled.",
      });
    }

    if (gestureRecognizer) {
      updateState({
        handLandmarker: "ready",
        gestureRecognizer: "ready",
        message: "Hand landmarks and custom gesture recognition are active.",
      });
    }

    return new MediaPipeService(handLandmarker, gestureRecognizer, warnings);
  }

  detect(video: HTMLVideoElement, timestampMs: number): FrameAnalysis {
    const handResult = this.handLandmarker.detectForVideo(video, timestampMs);
    const gestureResult = this.gestureRecognizer?.recognizeForVideo(video, timestampMs) ?? null;

    return {
      hands: mapHands(handResult),
      gesturePrediction: gestureResult ? getGesturePrediction(gestureResult) : null,
      timestampMs,
      modelWarnings: this.warnings,
    };
  }

  dispose(): void {
    this.handLandmarker.close();
    this.gestureRecognizer?.close();
  }
}
