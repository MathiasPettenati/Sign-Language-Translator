import type { RecognitionSettings, SignPrediction, StabilizedPrediction } from "../types/recognition";

type PredictionFrame = {
  label: string;
  confidence: number;
  timestampMs: number;
};

const NONE = "__none__";

export class PredictionStabilizer {
  private readonly frames: PredictionFrame[] = [];
  private candidateLabel: string | null = null;
  private candidateSinceMs = 0;
  private lastAcceptedLabel: string | null = null;
  private lastAcceptedAtMs = -Infinity;
  private neutralSinceMs: number | null = null;

  constructor(private settings: RecognitionSettings) {}

  updateSettings(settings: RecognitionSettings): void {
    this.settings = settings;
    this.frames.splice(0, Math.max(0, this.frames.length - settings.predictionBufferLength));
  }

  reset(): void {
    this.frames.length = 0;
    this.candidateLabel = null;
    this.candidateSinceMs = 0;
    this.lastAcceptedLabel = null;
    this.lastAcceptedAtMs = -Infinity;
    this.neutralSinceMs = null;
  }

  update(prediction: SignPrediction | null, timestampMs: number): StabilizedPrediction {
    const label =
      prediction && prediction.confidence >= this.settings.confidenceThreshold ? prediction.label : NONE;
    const confidence = prediction?.confidence ?? 0;

    this.frames.push({ label, confidence, timestampMs });
    while (this.frames.length > this.settings.predictionBufferLength) {
      this.frames.shift();
    }

    if (label === NONE) {
      if (this.neutralSinceMs === null) {
        this.neutralSinceMs = timestampMs;
      }

      if (timestampMs - this.neutralSinceMs > 450) {
        this.lastAcceptedLabel = null;
        this.candidateLabel = null;
        this.frames.length = 0;
      }

      return {
        status: prediction ? "uncertain" : "detecting",
        label: prediction?.label ?? null,
        confidence,
        consistency: 0,
        message: prediction ? "Not sure" : "No hand detected",
        justConfirmed: false,
      };
    }

    this.neutralSinceMs = null;

    const recentFrames = this.frames.filter((frame) => timestampMs - frame.timestampMs <= 1_200);
    const matchingFrames = recentFrames.filter((frame) => frame.label === label);
    const consistency = recentFrames.length > 0 ? matchingFrames.length / recentFrames.length : 0;
    const averageConfidence =
      matchingFrames.reduce((sum, frame) => sum + frame.confidence, 0) /
      Math.max(1, matchingFrames.length);

    if (this.candidateLabel !== label) {
      this.candidateLabel = label;
      this.candidateSinceMs = timestampMs;
    }

    const stableForMs = timestampMs - this.candidateSinceMs;
    const isConsistent = consistency >= 0.62;
    const isStable = stableForMs >= this.settings.stabilizationMs;
    const cooldownPassed = timestampMs - this.lastAcceptedAtMs >= this.settings.repeatCooldownMs;
    const differsFromLast = this.lastAcceptedLabel !== label;
    const canConfirm = isConsistent && isStable && cooldownPassed && differsFromLast;

    if (canConfirm) {
      this.lastAcceptedLabel = label;
      this.lastAcceptedAtMs = timestampMs;

      return {
        status: "confirmed",
        label,
        confidence: averageConfidence,
        consistency,
        message: "Confirmed sign",
        justConfirmed: true,
      };
    }

    return {
      status: "possible",
      label,
      confidence: averageConfidence,
      consistency,
      message: isStable ? "Possible sign" : "Detecting",
      justConfirmed: false,
    };
  }
}
