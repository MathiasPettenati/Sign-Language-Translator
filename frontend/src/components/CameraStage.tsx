import { Camera, CameraOff, Loader2 } from "lucide-react";
import type { RefObject } from "react";

type CameraStageProps = {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  cameraStatus: "idle" | "starting" | "active" | "error";
  mirrored: boolean;
  onStart: () => void;
  onStop: () => void;
};

export function CameraStage({
  videoRef,
  canvasRef,
  cameraStatus,
  mirrored,
  onStart,
  onStop,
}: CameraStageProps) {
  const isActive = cameraStatus === "active";
  const isStarting = cameraStatus === "starting";
  const mirroredClass = mirrored ? "scale-x-[-1]" : "";

  return (
    <section className="overflow-hidden rounded-md border border-ink-200 bg-ink-950 shadow-panel dark:border-ink-800">
      <div className="relative aspect-video min-h-[260px] w-full bg-ink-950">
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover ${mirroredClass}`}
          aria-label="Live webcam feed"
        />
        <canvas
          ref={canvasRef}
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${mirroredClass}`}
          aria-label="Hand landmark overlay"
        />
        {!isActive ? (
          <div className="absolute inset-0 grid place-items-center bg-ink-950/82 p-6 text-center text-white">
            <div className="max-w-sm space-y-4">
              <Camera className="mx-auto h-12 w-12 text-white/85" aria-hidden="true" />
              <div>
                <p className="text-lg font-semibold">
                  {isStarting ? "Starting camera" : "Camera inactive"}
                </p>
                <p className="mt-1 text-sm text-white/72">
                  Webcam frames are processed locally in this browser session.
                </p>
              </div>
              <button
                type="button"
                onClick={onStart}
                disabled={isStarting}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-ink-950 transition hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isStarting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Camera className="h-4 w-4" aria-hidden="true" />
                )}
                Start Camera
              </button>
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-ink-950 p-3 text-white">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-signal-green" : "bg-ink-500"}`}
            aria-hidden="true"
          />
          {isActive ? "Camera active" : "Camera stopped"}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onStart}
            disabled={isActive || isStarting}
            className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            Start
          </button>
          <button
            type="button"
            onClick={onStop}
            disabled={!isActive && !isStarting}
            className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-ink-950 transition hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CameraOff className="h-4 w-4" aria-hidden="true" />
            Stop
          </button>
        </div>
      </div>
    </section>
  );
}
