import { Languages, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";

import { BrandMark } from "../components/BrandMark";
import { CameraStage } from "../components/CameraStage";
import { ConfidenceMeter } from "../components/ConfidenceMeter";
import { ErrorBanner } from "../components/ErrorBanner";
import { HistoryPanel } from "../components/HistoryPanel";
import { ModelStatus } from "../components/ModelStatus";
import { SentenceBuilder } from "../components/SentenceBuilder";
import { SettingsPanel } from "../components/SettingsPanel";
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
  const visibleSign = recognizer.recognition.label ?? recognizer.currentPrediction?.label ?? "Not sure";
  const confidence = recognizer.recognition.confidence || recognizer.currentPrediction?.confidence || 0;

  return (
    <main className="newspaper-page space-y-5">
      <section className="translation-hero p-4 sm:p-5 lg:p-6">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.35fr)_360px]">
          <div className="min-w-0 space-y-4">
            <div className="hero-copy">
              <div className="flex items-center gap-3">
                <BrandMark className="h-16 w-16 shrink-0" />
                <p className="eyebrow">Translation desk</p>
              </div>
              <h1 className="news-headline mt-2 max-w-3xl">
                Signs In. Speech Out.
              </h1>
              <p className="news-deck mt-4 max-w-2xl">
                A warm signal-first workspace for live signing, editable copy, and spoken delivery.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="hero-stat">
                  <Languages className="h-4 w-4" aria-hidden="true" />
                  <span>Sign desk</span>
                </div>
                <div className="hero-stat">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  <span>Voice column</span>
                </div>
                <div className="hero-stat">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  <span>Confidence line</span>
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

          <aside className="min-w-0 space-y-4">
            <section className="translation-panel current-translation p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="section-title">Current Translation</h2>
                <span className="chip chip-neutral">
                  {recognizer.currentPrediction?.source ?? "waiting"}
                </span>
              </div>
              <p className="news-signline mt-4">
                {visibleSign}
              </p>
              <p className="mt-3 text-sm leading-6 text-ink-700 dark:text-ink-50/75">
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
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ink-700" aria-hidden="true" />
                <div className="text-sm leading-6 text-ink-700 dark:text-ink-50/75">
                  <p className="font-bold text-deep-950 dark:text-white">Private copy desk</p>
                  <p className="mt-1">
                    Webcam frames stay in this browser. Saved text is limited to settings,
                    sentences, and recent translation history.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>

      <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
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
        <div className="min-w-0">
          <HistoryPanel items={recognizer.history} />
        </div>
      </section>
    </main>
  );
}
