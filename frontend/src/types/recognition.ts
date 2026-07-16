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

export type PredictionSource = "prototype" | "mediapipe-model";

export type SignPrediction = {
  label: string;
  confidence: number;
  source: PredictionSource;
  reason?: string;
};

export type FrameAnalysis = {
  hands: HandLandmarkSet[];
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

export type ModelLoadState = {
  handLandmarker: "idle" | "loading" | "ready" | "error";
  gestureRecognizer: "idle" | "loading" | "ready" | "missing" | "error";
  message: string;
};

export type RecognitionHistoryItem = {
  id: string;
  label: string;
  confidence: number;
  source: PredictionSource;
  createdAt: string;
};

export type DatasetSplit = "train" | "validation" | "test";

export type DatasetSample = {
  id: string;
  label: string;
  participantId: string;
  sessionId: string;
  split: DatasetSplit;
  createdAt: string;
  hands: HandLandmarkSet[];
  normalizedHands: Landmark[][];
  mirroredCamera: boolean;
  notes: string;
};

export type DatasetExport = {
  schemaVersion: 1;
  exportedAt: string;
  appVersion: string;
  samples: DatasetSample[];
};

export type SampleCount = {
  label: string;
  total: number;
  train: number;
  validation: number;
  test: number;
};

export type SpeechVoiceOption = {
  name: string;
  lang: string;
  voiceURI: string;
  default: boolean;
};
