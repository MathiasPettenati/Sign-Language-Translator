import type { FrameAnalysis, HolisticLandmarkFrame, SignPrediction } from "../types/recognition";
import {
  ASL_SIGNS_LABELS_URL,
  ASL_SIGNS_MODEL_URL,
  TFLITE_WASM_BASE_URL,
  aslSignsModelExists,
} from "./modelAssets";

const HOLISTIC_LANDMARK_COUNT = 543;
const LANDMARK_VALUE_COUNT = 3;
const MIN_SEQUENCE_FRAMES = 8;
const MAX_SEQUENCE_FRAMES = 64;
const PREDICTION_INTERVAL_MS = 180;
const TFJS_SCRIPT_URLS = [
  "/models/tfjs/tf-core.min.js",
  "/models/tfjs/tf-backend-cpu.min.js",
  "/models/tfjs/tf-tflite.min.js",
];

const DISPLAY_LABEL_OVERRIDES: Record<string, string> = {
  TV: "TV",
  bye: "Goodbye",
  callonphone: "Call on phone",
  dad: "Father",
  fireman: "Firefighter",
  frenchfries: "French fries",
  glasswindow: "Glass window",
  grandma: "Grandmother",
  grandpa: "Grandfather",
  haveto: "Have to",
  hesheit: "He/she/it",
  icecream: "Ice cream",
  minemy: "Mine/my",
  mom: "Mother",
  owie: "Hurt",
  potty: "Bathroom",
  shhh: "Shhh",
  thankyou: "Thank you",
  weus: "We/us",
};

type RawLabelMap = Record<string, number>;
type TensorData = Float32Array | Int32Array | Uint8Array | Uint32Array | Float64Array;
type TfTensor = {
  dataSync: () => TensorData;
  dispose: () => void;
  shape: number[];
};
type TfRuntime = {
  ready: () => Promise<void>;
  tensor: (values: Float32Array, shape: number[], dtype: "float32") => TfTensor;
};
type TfliteOutput = TfTensor | TfTensor[] | Record<string, TfTensor>;
type TfliteModel = {
  inputs: Array<{ shape: number[] }>;
  predict: (input: TfTensor) => TfliteOutput;
};
type TfliteRuntime = {
  setWasmPath: (path: string) => void;
  loadTFLiteModel: (modelUrl: string, options?: { numThreads?: number }) => Promise<TfliteModel>;
};

declare global {
  interface Window {
    tf?: TfRuntime;
    tflite?: TfliteRuntime;
  }
}

let wasmPathConfigured = false;
let runtimeLoadPromise: Promise<void> | null = null;

export function canUseAslSignsClassifier(): boolean {
  const userAgent = globalThis.navigator?.userAgent ?? "";

  return (
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    typeof WebAssembly !== "undefined" &&
    !userAgent.toLowerCase().includes("jsdom")
  );
}

export function formatAslSignsLabel(label: string): string {
  const override = DISPLAY_LABEL_OVERRIDES[label];
  if (override) {
    return override;
  }

  return label
    .replace(/_/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function sampleHolisticFrames(
  frames: HolisticLandmarkFrame[],
  targetFrameCount: number | null,
): HolisticLandmarkFrame[] {
  if (!targetFrameCount || frames.length <= targetFrameCount) {
    return frames;
  }

  if (targetFrameCount <= 1) {
    return [frames[frames.length - 1]];
  }

  return Array.from({ length: targetFrameCount }, (_, index) => {
    const sourceIndex = Math.round((index * (frames.length - 1)) / (targetFrameCount - 1));
    return frames[sourceIndex];
  });
}

function configureWasmPath(tflite: TfliteRuntime): void {
  if (!wasmPathConfigured) {
    tflite.setWasmPath(TFLITE_WASM_BASE_URL);
    wasmPathConfigured = true;
  }
}

function loadScript(src: string): Promise<void> {
  const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
  if (existingScript?.dataset.loaded === "true") {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = existingScript ?? document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}.`));

    if (!existingScript) {
      document.head.appendChild(script);
    }
  });
}

async function loadTensorflowRuntime(): Promise<{ tf: TfRuntime; tflite: TfliteRuntime }> {
  if (!runtimeLoadPromise) {
    runtimeLoadPromise = TFJS_SCRIPT_URLS.reduce(
      (promise, src) => promise.then(() => loadScript(src)),
      Promise.resolve(),
    );
  }

  await runtimeLoadPromise;

  if (!window.tf || !window.tflite) {
    throw new Error("TensorFlow.js TFLite runtime did not initialize.");
  }

  return {
    tf: window.tf,
    tflite: window.tflite,
  };
}

async function loadLabelMap(): Promise<string[]> {
  const response = await fetch(ASL_SIGNS_LABELS_URL, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("The ASL Signs label map could not be loaded.");
  }

  const rawLabels = (await response.json()) as RawLabelMap;
  const idToLabel: string[] = [];

  for (const [label, id] of Object.entries(rawLabels)) {
    if (Number.isInteger(id) && id >= 0) {
      idToLabel[id] = label;
    }
  }

  if (idToLabel.length === 0 || idToLabel.some((label) => !label)) {
    throw new Error("The ASL Signs label map is incomplete.");
  }

  return idToLabel;
}

function getInputFrameCount(model: TfliteModel): number | null {
  const frameDimension = model.inputs[0]?.shape?.[0];
  return typeof frameDimension === "number" && frameDimension > 0 ? frameDimension : null;
}

function hasUsableHolisticHands(frame: FrameAnalysis | undefined): boolean {
  const parts = frame?.holisticLandmarks?.detectedParts;
  return Boolean(parts?.leftHand || parts?.rightHand);
}

function collectHolisticSequence(
  frames: FrameAnalysis[],
  targetFrameCount: number | null,
): HolisticLandmarkFrame[] | null {
  if (!frames.length || !hasUsableHolisticHands(frames[frames.length - 1])) {
    return null;
  }

  const holisticFrames = frames
    .map((frame) => frame.holisticLandmarks)
    .filter((frame): frame is HolisticLandmarkFrame => Boolean(frame))
    .filter((frame) => frame.landmarks.length === HOLISTIC_LANDMARK_COUNT)
    .filter((frame) => frame.detectedParts.leftHand || frame.detectedParts.rightHand)
    .slice(-MAX_SEQUENCE_FRAMES);

  if (holisticFrames.length < MIN_SEQUENCE_FRAMES) {
    return null;
  }

  return sampleHolisticFrames(holisticFrames, targetFrameCount);
}

function buildInputTensor(tfRuntime: TfRuntime, sequence: HolisticLandmarkFrame[]): TfTensor {
  const values = new Float32Array(sequence.length * HOLISTIC_LANDMARK_COUNT * LANDMARK_VALUE_COUNT);
  let offset = 0;

  for (const frame of sequence) {
    for (const landmark of frame.landmarks) {
      values[offset] = Number.isFinite(landmark.x) ? landmark.x : Number.NaN;
      values[offset + 1] = Number.isFinite(landmark.y) ? landmark.y : Number.NaN;
      values[offset + 2] = Number.isFinite(landmark.z) ? landmark.z : Number.NaN;
      offset += LANDMARK_VALUE_COUNT;
    }
  }

  return tfRuntime.tensor(
    values,
    [sequence.length, HOLISTIC_LANDMARK_COUNT, LANDMARK_VALUE_COUNT],
    "float32",
  );
}

function isTensor(value: unknown): value is TfTensor {
  return Boolean(
    value &&
      typeof (value as TfTensor).dataSync === "function" &&
      Array.isArray((value as TfTensor).shape),
  );
}

function getFirstOutputTensor(output: TfliteOutput): TfTensor {
  if (isTensor(output)) {
    return output;
  }

  if (Array.isArray(output)) {
    const tensor = output.find(isTensor);
    if (tensor) {
      return tensor;
    }
  } else {
    const tensor = Object.values(output).find(isTensor);
    if (tensor) {
      return tensor;
    }
  }

  throw new Error("The ASL Signs model did not return a tensor output.");
}

function disposeOutput(output: TfliteOutput): void {
  if (isTensor(output)) {
    output.dispose();
    return;
  }

  if (Array.isArray(output)) {
    output.forEach((tensor) => tensor.dispose());
    return;
  }

  Object.values(output).forEach((tensor) => tensor.dispose());
}

function getTopPrediction(scores: TensorData, idToLabel: string[]): SignPrediction {
  let topIndex = 0;
  let topScore = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < scores.length; index += 1) {
    if (scores[index] > topScore) {
      topIndex = index;
      topScore = scores[index];
    }
  }

  const rawLabel = idToLabel[topIndex] ?? "unknown";

  return {
    label: formatAslSignsLabel(rawLabel),
    confidence: Math.max(0, Math.min(1, topScore)),
    source: "asl-signs-model",
    reason: "MIT-licensed Kaggle ASL Signs 250-sign TFLite model",
  };
}

export class AslSignsClassifier {
  readonly labelCount: number;

  private readonly targetFrameCount: number | null;
  private lastPrediction: SignPrediction | null = null;
  private lastPredictionAt = 0;
  private lastError: string | null = null;

  private constructor(
    private readonly tfRuntime: TfRuntime,
    private readonly model: TfliteModel,
    private readonly idToLabel: string[],
  ) {
    this.labelCount = idToLabel.length;
    this.targetFrameCount = getInputFrameCount(model);
  }

  static async create(): Promise<AslSignsClassifier> {
    if (!canUseAslSignsClassifier()) {
      throw new Error("The ASL Signs model needs a real browser with WebAssembly.");
    }

    if (!(await aslSignsModelExists())) {
      throw new Error("The ASL Signs model file is missing or incomplete.");
    }

    const runtime = await loadTensorflowRuntime();
    configureWasmPath(runtime.tflite);
    await runtime.tf.ready();

    const [idToLabel, model] = await Promise.all([
      loadLabelMap(),
      runtime.tflite.loadTFLiteModel(ASL_SIGNS_MODEL_URL, { numThreads: 1 }),
    ]);

    return new AslSignsClassifier(runtime.tf, model, idToLabel);
  }

  classify(frames: FrameAnalysis[], timestampMs: number): SignPrediction | null {
    if (timestampMs - this.lastPredictionAt < PREDICTION_INTERVAL_MS) {
      return hasUsableHolisticHands(frames[frames.length - 1]) ? this.lastPrediction : null;
    }

    const sequence = collectHolisticSequence(frames, this.targetFrameCount);
    if (!sequence) {
      this.lastPrediction = null;
      return null;
    }

    const input = buildInputTensor(this.tfRuntime, sequence);
    let output: TfliteOutput | null = null;

    try {
      output = this.model.predict(input);
      const outputTensor = getFirstOutputTensor(output);
      const scores = outputTensor.dataSync();
      this.lastPrediction = getTopPrediction(scores, this.idToLabel);
      this.lastPredictionAt = timestampMs;
      this.lastError = null;
      return this.lastPrediction;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : "The ASL Signs model failed.";
      this.lastPrediction = null;
      return null;
    } finally {
      input.dispose();
      if (output) {
        disposeOutput(output);
      }
    }
  }

  getWarnings(): string[] {
    return this.lastError ? [this.lastError] : [];
  }
}
