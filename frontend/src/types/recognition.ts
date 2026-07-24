export type RecognitionStatus =
  | "idle"
  | "loading"
  | "detecting"
  | "possible"
  | "confirmed"
  | "uncertain"
  | "error";

export type Handedness = "Left" | "Right" | "Unknown";

export type Landmark = {
  x: number;
  y: number;
  z: number;
  visibility?: number;
};

export type BoundingBox = {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
};

export type HandLandmarkSet = {
  id: string;
  landmarks: Landmark[];
  handedness: Handedness;
  handednessScore: number;
  boundingBox: BoundingBox;
};

export type HolisticLandmarkFrame = {
  landmarks: Landmark[];
  detectedParts: {
    face: boolean;
    pose: boolean;
    leftHand: boolean;
    rightHand: boolean;
  };
};

export type PredictionSource =
  | "prototype"
  | "mediapipe-model"
  | "asl-signs-model"
  | "user-trained";

export type SignPrediction = {
  label: string;
  confidence: number;
  source: PredictionSource;
  reason?: string;
};

export type FrameAnalysis = {
  hands: HandLandmarkSet[];
  holisticLandmarks: HolisticLandmarkFrame | null;
  gesturePrediction: SignPrediction | null;
  timestampMs: number;
  modelWarnings: string[];
};

export type StabilizedPrediction = {
  status: RecognitionStatus;
  label: string | null;
  confidence: number;
  consistency: number;
  message: string;
  justConfirmed: boolean;
};

export type PreferredHand = "either" | "left" | "right";
export type RecognitionMode = "static" | "dynamic";

export type RecognitionSettings = {
  confidenceThreshold: number;
  stabilizationMs: number;
  predictionBufferLength: number;
  repeatCooldownMs: number;
  automaticSpeech: boolean;
  voiceURI: string;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  speechLanguage: string;
  muted: boolean;
  showLandmarks: boolean;
  mirroredCamera: boolean;
  preferredHand: PreferredHand;
  recognitionMode: RecognitionMode;
  darkMode: boolean;
  reducedMotion: boolean;
};

export type ModelComponentStatus = "idle" | "loading" | "ready" | "missing" | "error";

export type ModelLoadState = {
  handLandmarker: ModelComponentStatus;
  holisticLandmarker: ModelComponentStatus;
  gestureRecognizer: ModelComponentStatus;
  aslSignsModel: ModelComponentStatus;
  message: string;
};

export type RecognitionHistoryItem = {
  id: string;
  label: string;
  confidence: number;
  source: PredictionSource;
  createdAt: string;
};

export type SpeechVoiceOption = {
  name: string;
  lang: string;
  voiceURI: string;
  default: boolean;
};
