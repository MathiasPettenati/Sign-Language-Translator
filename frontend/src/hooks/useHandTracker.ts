import { useCallback, useEffect, useRef, useState } from "react";

import { MediaPipeService } from "../services/mediapipeService";
import { clearCanvas, drawHandOverlay } from "../utils/drawLandmarks";
import type { FrameAnalysis, ModelLoadState, RecognitionSettings } from "../types/recognition";

type CameraStatus = "idle" | "starting" | "active" | "error";

type UseHandTrackerOptions = {
  settings: RecognitionSettings;
  onFrame?: (frame: FrameAnalysis) => void;
  overlayLabel: string;
  overlayConfidence: number;
};

const INITIAL_MODEL_STATE: ModelLoadState = {
  handLandmarker: "idle",
  gestureRecognizer: "idle",
  message: "MediaPipe is not loaded yet.",
};

export function useHandTracker(options: UseHandTrackerOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const serviceRef = useRef<MediaPipeService | null>(null);
  const animationRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const onFrameRef = useRef(options.onFrame);
  const settingsRef = useRef(options.settings);
  const overlayLabelRef = useRef(options.overlayLabel);
  const overlayConfidenceRef = useRef(options.overlayConfidence);
  const latestFrameRef = useRef<FrameAnalysis | null>(null);
  const lastPublishRef = useRef(0);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [modelState, setModelState] = useState<ModelLoadState>(INITIAL_MODEL_STATE);
  const [latestFrame, setLatestFrame] = useState<FrameAnalysis | null>(null);

  useEffect(() => {
    onFrameRef.current = options.onFrame;
    settingsRef.current = options.settings;
    overlayLabelRef.current = options.overlayLabel;
    overlayConfidenceRef.current = options.overlayConfidence;
  }, [options.onFrame, options.overlayConfidence, options.overlayLabel, options.settings]);

  const stop = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      clearCanvas(canvas);
    }

    latestFrameRef.current = null;
    setLatestFrame(null);
    setCameraStatus("idle");
  }, []);

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const service = serviceRef.current;

    if (!mountedRef.current || !video || !canvas || !service) {
      return;
    }

    try {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
        const frame = service.detect(video, performance.now());
        latestFrameRef.current = frame;

        drawHandOverlay(canvas, video, frame.hands, {
          showLandmarks: settingsRef.current.showLandmarks,
          statusLabel: overlayLabelRef.current,
          confidence: overlayConfidenceRef.current,
        });

        onFrameRef.current?.(frame);

        if (performance.now() - lastPublishRef.current > 90) {
          setLatestFrame(frame);
          lastPublishRef.current = performance.now();
        }
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Frame processing failed.");
      setCameraStatus("error");
      stop();
      return;
    }

    animationRef.current = requestAnimationFrame(processFrame);
  }, [stop]);

  const start = useCallback(async () => {
    if (cameraStatus === "active" || cameraStatus === "starting") {
      return;
    }

    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser does not expose camera access. Try a current desktop browser.");
      setCameraStatus("error");
      return;
    }

    setCameraStatus("starting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      const video = videoRef.current;
      if (!video) {
        throw new Error("The video element is not ready.");
      }

      streamRef.current = stream;
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      if (!serviceRef.current) {
        serviceRef.current = await MediaPipeService.create({
          onStateChange: (state) => {
            if (mountedRef.current) {
              setModelState(state);
            }
          },
          numHands: 2,
        });
      }

      setCameraStatus("active");
      animationRef.current = requestAnimationFrame(processFrame);
    } catch (caughtError) {
      const message =
        caughtError instanceof DOMException && caughtError.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access in your browser settings and try again."
          : caughtError instanceof Error
            ? caughtError.message
            : "Unable to start the camera.";

      setError(message);
      setCameraStatus("error");
      stop();
    }
  }, [cameraStatus, processFrame, stop]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      stop();
      serviceRef.current?.dispose();
      serviceRef.current = null;
    };
  }, [stop]);

  return {
    videoRef,
    canvasRef,
    cameraStatus,
    error,
    modelState,
    latestFrame,
    latestFrameRef,
    start,
    stop,
  };
}
