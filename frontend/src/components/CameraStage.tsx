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
    <section className="overflow-hidden rounded-lg border border-white/10 bg-deep-950 shadow-panel">
      <div className="relative aspect-video min-h-[260px] w-full bg-deep-950">
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
          <div className="absolute inset-0 grid place-items-center bg-deep-950/88 p-6 text-center text-white">
            <div className="max-w-sm space-y-4">
              <Camera className="mx-auto h-10 w-10 text-teal-200" aria-hidden="true" />
              <div>
                <p className="text-lg font-semibold">
                  {isStarting ? "Starting camera" : "Camera inactive"}
                </p>
                <p className="mt-1 text-sm text-blue-50/70">
                  Live frames become translation signals in this browser session.
                </p>
              </div>
              <button
                type="button"
                onClick={onStart}
                disabled={isStarting}
                className="button-primary"
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-deep-950 p-3 text-white">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-teal-300" : "bg-blue-50/35"}`}
            aria-hidden="true"
          />
          {isActive ? "Camera active" : "Camera stopped"}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onStart}
            disabled={isActive || isStarting}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 px-3 py-2 text-sm font-medium text-blue-50 transition-colors hover:border-teal-300/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            Start
          </button>
          <button
            type="button"
            onClick={onStop}
            disabled={!isActive && !isStarting}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-white bg-white px-3 py-2 text-sm font-medium text-deep-950 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CameraOff className="h-4 w-4" aria-hidden="true" />
            Stop
          </button>
        </div>
      </div>
    </section>
  );
}
