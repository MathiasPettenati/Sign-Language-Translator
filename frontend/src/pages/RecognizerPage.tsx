import { Languages, MessageSquareText, ShieldCheck, Sparkles } from "lucide-react";

import { CameraStage } from "../components/CameraStage";
import { ConfidenceMeter } from "../components/ConfidenceMeter";
import { ErrorBanner } from "../components/ErrorBanner";
import { HistoryPanel } from "../components/HistoryPanel";
import { ModelStatus } from "../components/ModelStatus";
import { SentenceBuilder } from "../components/SentenceBuilder";
import { SettingsPanel } from "../components/SettingsPanel";
import { StatusPill } from "../components/StatusPill";
import { APP_NAME } from "../constants/vocabulary";
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
      ? "Translation confirmed"
      : recognizer.recognition.status === "possible"
        ? "Possible translation"
        : recognizer.recognition.status === "uncertain"
          ? "Not sure"
          : recognizer.cameraStatus === "starting"
            ? "Loading"
            : "Detecting";
  const visibleSign = recognizer.recognition.label ?? recognizer.currentPrediction?.label ?? "Not sure";
  const confidence = recognizer.recognition.confidence || recognizer.currentPrediction?.confidence || 0;

  return (
    <main className="space-y-5">
      <section className="translation-hero grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="space-y-4">
          <div className="hero-copy">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="eyebrow text-teal-100/75">Live sign translation</p>
                <h1 className="mt-2 max-w-2xl text-4xl font-semibold leading-[0.96] text-white sm:text-6xl">
                  Translate signs into spoken words.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-50/75 sm:text-base">
                  {APP_NAME} turns selected isolated signs and fingerspelling hand shapes into
                  editable text and speech. Keep the camera centered, confirm the translation, then
                  speak the sentence when it is ready.
                </p>
              </div>
              <StatusPill status={recognizer.recognition.status} label={statusLabel} />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="hero-stat">
                <Languages className="h-4 w-4" aria-hidden="true" />
                <span>Sign to text</span>
              </div>
              <div className="hero-stat">
                <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                <span>Text to speech</span>
              </div>
              <div className="hero-stat">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>Live confidence</span>
              </div>
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
          <section className="translation-panel p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="section-title">Current Translation</h2>
              <span className="chip chip-teal">
                {recognizer.currentPrediction?.source ?? "waiting"}
              </span>
            </div>
            <p className="mt-4 text-5xl font-semibold leading-none text-deep-950 dark:text-white sm:text-6xl">
              {visibleSign}
            </p>
            <p className="mt-3 text-sm leading-6 text-ink-600 dark:text-blue-50/70">
              {recognizer.recognition.message}
            </p>
            <div className="mt-5">
              <ConfidenceMeter
                value={confidence}
                threshold={settings.confidenceThreshold}
                label="Translation confidence"
              />
            </div>
          </section>

          <section className="translation-panel p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-500" aria-hidden="true" />
              <div className="text-sm leading-6 text-ink-600 dark:text-blue-50/70">
                <p className="font-semibold text-deep-950 dark:text-white">Private by design</p>
                <p className="mt-1">
                  Webcam frames stay in the browser. The app stores only settings, sentence text,
                  and recent translation history.
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
