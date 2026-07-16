import type { RecognitionHistoryItem, RecognitionSettings } from "../types/recognition";
import { isRecord } from "../services/storage";

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isRecognitionSettings(value: unknown): value is RecognitionSettings {
  if (!isRecord(value)) {
    return false;
  }

  const settings = value;

  return (
    isNumber(settings.confidenceThreshold) &&
    isNumber(settings.stabilizationMs) &&
    isNumber(settings.predictionBufferLength) &&
    isNumber(settings.repeatCooldownMs) &&
    isBoolean(settings.automaticSpeech) &&
    isString(settings.voiceURI) &&
    isNumber(settings.speechRate) &&
    isNumber(settings.speechPitch) &&
    isNumber(settings.speechVolume) &&
    isString(settings.speechLanguage) &&
    isBoolean(settings.muted) &&
    isBoolean(settings.showLandmarks) &&
    isBoolean(settings.mirroredCamera) &&
    (settings.preferredHand === "either" ||
      settings.preferredHand === "left" ||
      settings.preferredHand === "right") &&
    (settings.recognitionMode === "static" || settings.recognitionMode === "dynamic") &&
    isBoolean(settings.darkMode) &&
    isBoolean(settings.reducedMotion)
  );
}

export function isRecognitionHistory(value: unknown): value is RecognitionHistoryItem[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every(
    (item) =>
      isRecord(item) &&
      typeof item.id === "string" &&
      typeof item.label === "string" &&
      typeof item.confidence === "number" &&
      (item.source === "prototype" || item.source === "mediapipe-model") &&
      typeof item.createdAt === "string",
  );
}
