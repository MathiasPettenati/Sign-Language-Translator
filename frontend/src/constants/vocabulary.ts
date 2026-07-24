import type { RecognitionSettings } from "../types/recognition";
import targetVocabulary from "./targetVocabulary.json";

export const APP_NAME = "Handspeak Translator";
export const APP_VERSION = "0.1.0";

export const TARGET_VOCABULARY: readonly string[] = targetVocabulary;

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

const PROTOTYPE_RULE_LABEL_SET = new Set<string>(PROTOTYPE_RULE_LABELS);

export const NONE_LABEL = "none";

export const MODEL_LABELS: readonly string[] = [
  NONE_LABEL,
  ...TARGET_VOCABULARY,
  ...FINGERSPELLING_LABELS,
];

export type VocabularyCategory = "isolated-sign" | "fingerspelling" | "neutral";

export type VocabularyEntry = {
  label: string;
  category: VocabularyCategory;
  prototypeAvailable: boolean;
};

export const VOCABULARY_ENTRIES: VocabularyEntry[] = [
  {
    label: NONE_LABEL,
    category: "neutral",
    prototypeAvailable: false,
  },
  ...TARGET_VOCABULARY.map((label) => ({
    label,
    category: "isolated-sign" as const,
    prototypeAvailable: PROTOTYPE_RULE_LABEL_SET.has(label),
  })),
  ...FINGERSPELLING_LABELS.map((label) => ({
    label,
    category: "fingerspelling" as const,
    prototypeAvailable: PROTOTYPE_RULE_LABEL_SET.has(label),
  })),
];

export const SPEAKABLE_VOCABULARY_ENTRIES: VocabularyEntry[] = VOCABULARY_ENTRIES.filter(
  (entry) => entry.category !== "neutral",
);

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
  trainedProfiles: "handspeak:trained-profiles",
} as const;
