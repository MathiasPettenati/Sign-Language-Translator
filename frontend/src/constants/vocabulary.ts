import type { RecognitionSettings } from "../types/recognition";

export const APP_NAME = "Handspeak MVP";
export const APP_VERSION = "0.1.0";

export const TARGET_VOCABULARY = [
  "Hello",
  "Goodbye",
  "Yes",
  "No",
  "Please",
  "Thank you",
  "Help",
  "Stop",
  "More",
  "Eat",
  "Drink",
  "Water",
  "Bathroom",
  "Friend",
  "Love",
  "I",
  "You",
] as const;

export const FINGERSPELLING_LABELS = ["A", "B", "C", "L", "V", "W", "Y"] as const;

export const PROTOTYPE_RULE_LABELS = [
  "Yes",
  "Stop",
  "Help",
  "Friend",
  "Love",
  "I",
  "You",
  "Water",
  "A",
  "B",
  "L",
  "V",
  "W",
  "Y",
] as const;

export const NONE_LABEL = "none";

export const DATASET_LABELS = [
  NONE_LABEL,
  ...TARGET_VOCABULARY,
  ...FINGERSPELLING_LABELS,
] as const;

export const DEFAULT_RECOGNITION_SETTINGS: RecognitionSettings = {
  confidenceThreshold: 0.75,
  stabilizationMs: 650,
  predictionBufferLength: 14,
  repeatCooldownMs: 1300,
  automaticSpeech: true,
  voiceURI: "",
  speechRate: 1,
  speechPitch: 1,
  speechVolume: 1,
  speechLanguage: "en-US",
  muted: false,
  showLandmarks: true,
  mirroredCamera: true,
  preferredHand: "either",
  recognitionMode: "static",
  darkMode: false,
  reducedMotion: false,
};

export const LOCAL_STORAGE_KEYS = {
  settings: "handspeak:settings",
  sentence: "handspeak:sentence",
  history: "handspeak:history",
  collectorSession: "handspeak:collector-session",
} as const;
