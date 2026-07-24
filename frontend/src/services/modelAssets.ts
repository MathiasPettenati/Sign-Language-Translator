export const LOCAL_GESTURE_MODEL_URL = "/models/gesture_recognizer.task";
export const ASL_SIGNS_MODEL_URL = "/models/asl_signs_250.tflite";
export const ASL_SIGNS_LABELS_URL = "/models/asl_signs_250_labels.json";
export const TFLITE_WASM_BASE_URL = "/models/tflite-wasm/";

const MINIMUM_GESTURE_MODEL_BYTES = 1024;
const MINIMUM_ASL_SIGNS_MODEL_BYTES = 1_000_000;

export function isUsableBinaryModelResponse(
  response: Response,
  minimumBytes: number,
): boolean {
  if (!response.ok) {
    return false;
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("text/html")) {
    return false;
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength !== null) {
    const byteLength = Number.parseInt(contentLength, 10);
    if (Number.isFinite(byteLength) && byteLength < minimumBytes) {
      return false;
    }
  }

  return true;
}

export function isUsableGestureModelResponse(response: Response): boolean {
  return isUsableBinaryModelResponse(response, MINIMUM_GESTURE_MODEL_BYTES);
}

export function isUsableAslSignsModelResponse(response: Response): boolean {
  return isUsableBinaryModelResponse(response, MINIMUM_ASL_SIGNS_MODEL_BYTES);
}

async function modelAssetExists(
  url: string,
  isUsableResponse: (response: Response) => boolean,
): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
    });

    return isUsableResponse(response);
  } catch {
    return false;
  }
}

export async function localGestureModelExists(): Promise<boolean> {
  return modelAssetExists(LOCAL_GESTURE_MODEL_URL, isUsableGestureModelResponse);
}

export async function aslSignsModelExists(): Promise<boolean> {
  return modelAssetExists(ASL_SIGNS_MODEL_URL, isUsableAslSignsModelResponse);
}
