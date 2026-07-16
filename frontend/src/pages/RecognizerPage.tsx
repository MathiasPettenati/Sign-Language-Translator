import { Info, ShieldCheck } from "lucide-react";

import { CameraStage } from "../components/CameraStage";
import { ConfidenceMeter } from "../components/ConfidenceMeter";
import { ErrorBanner } from "../components/ErrorBanner";
import { HistoryPanel } from "../components/HistoryPanel";
import { ModelStatus } from "../components/ModelStatus";
import { SentenceBuilder } from "../components/SentenceBuilder";
import { SettingsPanel } from "../components/SettingsPanel";
import { StatusPill } from "../components/StatusPill";
import { APP_NAME, PROTOTYPE_RULE_LABELS } from "../constants/vocabulary";
import { useRecognizer } from "../hooks/useRecognizer";
import type { RecognitionSettings } from "../types/recognition";

type RecognizerPageProps = {
  settings: RecognitionSettings;
  onSettingsChange: (settings: RecognitionSettings) => void;
};

export function RecognizerPage({ settings, onSettingsChange }: RecognizerPageProps) {
  const recognizer = useRecognizer(settings);
  const handsDetected = recognizer.latestFrame?.hands.length ?? 0;
  const warnings = recognizer.latestFrame?.modelWarnings ?? [];
  const statusLabel =
    recognizer.recognition.status === "confirmed"
      ? "Confirmed sign"
      : recognizer.recognition.status === "possible"
        ? "Possible sign"
        : recognizer.recognition.status === "uncertain"
          ? "Not sure"
          : recognizer.cameraStatus === "starting"
            ? "Loading"
            : "Detecting";
  const visibleSign = recognizer.recognition.label ?? recognizer.currentPrediction?.label ?? "Not sure";
  const confidence = recognizer.recognition.confidence || recognizer.currentPrediction?.confidence || 0;

  return (
    <main className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Isolated-sign recognition MVP</p>
                <h1 className="mt-1 text-3xl font-semibold text-ink-950 dark:text-white">{APP_NAME}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-600 dark:text-ink-300">
                  This MVP recognizes selected isolated signs and fingerspelling hand shapes. It is
                  not a complete ASL translator and does not interpret ASL grammar, facial
                  expression, or full-body context.
                </p>
              </div>
              <StatusPill status={recognizer.recognition.status} label={statusLabel} />
            </div>
          </div>

          {recognizer.error ? <ErrorBanner message={recognizer.error} /> : null}

          <CameraStage
            videoRef={recognizer.videoRef}
            canvasRef={recognizer.canvasRef}
            cameraStatus={recognizer.cameraStatus}
            mirrored={settings.mirroredCamera}
            onStart={recognizer.start}
            onStop={recognizer.stop}
          />
        </div>

        <aside className="space-y-4">
          <section className="surface p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="section-title">Current Sign</h2>
              <span className="chip">
                {recognizer.currentPrediction?.source ?? "waiting"}
              </span>
            </div>
            <p className="mt-4 text-4xl font-semibold leading-none text-ink-950 dark:text-white sm:text-5xl">
              {visibleSign}
            </p>
            <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
              {recognizer.recognition.message}
            </p>
            <div className="mt-5">
              <ConfidenceMeter
                value={confidence}
                threshold={settings.confidenceThreshold}
                label="Recognition confidence"
              />
            </div>
          </section>

          <section className="surface p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-ink-950 dark:text-white">
              <Info className="h-4 w-4" aria-hidden="true" />
              Prototype Static Labels
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {PROTOTYPE_RULE_LABELS.map((label) => (
                <span
                  key={label}
                  className="chip"
                >
                  {label}
                </span>
              ))}
            </div>
          </section>

          <section className="surface p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-signal-green" aria-hidden="true" />
              <div className="text-sm text-ink-600 dark:text-ink-300">
                <p className="font-semibold text-ink-950 dark:text-white">Privacy</p>
                <p className="mt-1">
                  Webcam frames stay in the browser. The app stores only settings, sentence text,
                  history, and samples you explicitly capture in the dataset tool.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <SentenceBuilder
            sentence={recognizer.sentence}
            spokenCaption={recognizer.spokenCaption}
            onSentenceChange={recognizer.setSentence}
            onSpeak={recognizer.speakSentence}
            onReplay={recognizer.replayLastSpeech}
            onStopSpeech={recognizer.stopSpeaking}
            onUndo={recognizer.undoLastWord}
            onClear={recognizer.clearSentence}
          />
          <ModelStatus
            state={recognizer.modelState}
            handsDetected={handsDetected}
            warnings={warnings}
          />
          <SettingsPanel settings={settings} onChange={onSettingsChange} />
        </div>
        <HistoryPanel items={recognizer.history} />
      </section>
    </main>
  );
}
