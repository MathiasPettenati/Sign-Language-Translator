import { HAND_CONNECTIONS } from "./landmarks";
import type { HandLandmarkSet } from "../types/recognition";

type DrawOptions = {
  showLandmarks: boolean;
  statusLabel: string;
  confidence: number;
};

export function clearCanvas(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawHandOverlay(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  hands: HandLandmarkSet[],
  options: DrawOptions,
): void {
  const context = canvas.getContext("2d");
  if (!context || video.videoWidth === 0 || video.videoHeight === 0) {
    return;
  }

  if (canvas.width !== video.videoWidth) {
    canvas.width = video.videoWidth;
  }

  if (canvas.height !== video.videoHeight) {
    canvas.height = video.videoHeight;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);

  if (!options.showLandmarks) {
    return;
  }

  hands.forEach((hand) => {
    const color = hand.handedness === "Left" ? "#2673c9" : "#1f9d6a";
    const width = canvas.width;
    const height = canvas.height;

    context.lineWidth = 3;
    context.strokeStyle = color;
    context.fillStyle = color;

    HAND_CONNECTIONS.forEach(([start, end]) => {
      const startPoint = hand.landmarks[start];
      const endPoint = hand.landmarks[end];

      if (!startPoint || !endPoint) {
        return;
      }

      context.beginPath();
      context.moveTo(startPoint.x * width, startPoint.y * height);
      context.lineTo(endPoint.x * width, endPoint.y * height);
      context.stroke();
    });

    hand.landmarks.forEach((landmark) => {
      context.beginPath();
      context.arc(landmark.x * width, landmark.y * height, 4, 0, Math.PI * 2);
      context.fill();
    });

    const padding = 14;
    const boxX = hand.boundingBox.xMin * width;
    const boxY = hand.boundingBox.yMin * height;
    const boxWidth = (hand.boundingBox.xMax - hand.boundingBox.xMin) * width;
    const boxHeight = (hand.boundingBox.yMax - hand.boundingBox.yMin) * height;

    context.strokeStyle = color;
    context.lineWidth = 2;
    context.strokeRect(
      boxX - padding,
      boxY - padding,
      boxWidth + padding * 2,
      boxHeight + padding * 2,
    );

    const handednessText = `${hand.handedness} ${Math.round(hand.handednessScore * 100)}%`;
    context.font = "16px Inter, system-ui, sans-serif";
    context.fillStyle = "rgba(17, 21, 24, 0.85)";
    context.fillRect(boxX - padding, Math.max(0, boxY - 42), context.measureText(handednessText).width + 18, 28);
    context.fillStyle = "#ffffff";
    context.fillText(handednessText, boxX - padding + 9, Math.max(18, boxY - 22));
  });

  const confidenceText = `${options.statusLabel} ${Math.round(options.confidence * 100)}%`;
  context.font = "18px Inter, system-ui, sans-serif";
  context.fillStyle = "rgba(17, 21, 24, 0.82)";
  context.fillRect(16, 16, context.measureText(confidenceText).width + 24, 36);
  context.fillStyle = "#ffffff";
  context.fillText(confidenceText, 28, 40);
}
