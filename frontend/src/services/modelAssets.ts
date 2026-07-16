export const LOCAL_GESTURE_MODEL_URL = "/models/gesture_recognizer.task";

const MINIMUM_GESTURE_MODEL_BYTES = 1024;

export function isUsableGestureModelResponse(response: Response): boolean {
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
    if (Number.isFinite(byteLength) && byteLength < MINIMUM_GESTURE_MODEL_BYTES) {
      return false;
    }
  }

  return true;
}

export async function localGestureModelExists(): Promise<boolean> {
  try {
    const response = await fetch(LOCAL_GESTURE_MODEL_URL, {
      method: "HEAD",
      cache: "no-store",
    });

    return isUsableGestureModelResponse(response);
  } catch {
    return false;
  }
}
