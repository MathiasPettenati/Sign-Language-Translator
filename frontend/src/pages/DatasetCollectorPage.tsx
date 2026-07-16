import { Download, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CameraStage } from "../components/CameraStage";
import { ErrorBanner } from "../components/ErrorBanner";
import { DATASET_LABELS, LOCAL_STORAGE_KEYS } from "../constants/vocabulary";
import { useHandTracker } from "../hooks/useHandTracker";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  countSamples,
  deleteDatasetSample,
  downloadDataset,
  listDatasetSamples,
  saveDatasetSample,
} from "../services/datasetStore";
import { isString } from "../utils/guards";
import { createId } from "../utils/ids";
import { normalizeHands } from "../utils/landmarks";
import type { DatasetSample, DatasetSplit, RecognitionSettings } from "../types/recognition";

type DatasetCollectorPageProps = {
  settings: RecognitionSettings;
};

export function DatasetCollectorPage({ settings }: DatasetCollectorPageProps) {
  const [samples, setSamples] = useState<DatasetSample[]>([]);
  const [label, setLabel] = useState<string>("Hello");
  const [participantId, setParticipantId] = useState("participant-001");
  const [sessionId, setSessionId] = useLocalStorage(
    LOCAL_STORAGE_KEYS.collectorSession,
    createId("session"),
    isString,
  );
  const [split, setSplit] = useState<DatasetSplit>("train");
  const [notes, setNotes] = useState("");
  const [statusMessage, setStatusMessage] = useState("No samples captured yet.");
  const [collectorError, setCollectorError] = useState<string | null>(null);

  const tracker = useHandTracker({
    settings,
    overlayLabel: "Dataset capture",
    overlayConfidence: trackerConfidence(samples.length),
  });

  const refreshSamples = useCallback(async () => {
    const storedSamples = await listDatasetSamples();
    setSamples(storedSamples);
  }, []);

  useEffect(() => {
    refreshSamples().catch((error) => {
      setCollectorError(error instanceof Error ? error.message : "Unable to load samples.");
    });
  }, [refreshSamples]);

  const sampleCounts = useMemo(() => countSamples(samples), [samples]);
  const currentSessionSplits = useMemo(
    () => new Set(samples.filter((sample) => sample.sessionId === sessionId).map((sample) => sample.split)),
    [samples, sessionId],
  );
  const splitConflict = currentSessionSplits.size > 0 && !currentSessionSplits.has(split);

  const captureSample = useCallback(async () => {
    setCollectorError(null);
    const frame = tracker.latestFrameRef.current;

    if (!frame) {
      setCollectorError("Start the camera and wait for MediaPipe to process a frame.");
      return;
    }

    if (label !== "none" && frame.hands.length === 0) {
      setCollectorError("No hand landmarks are visible. Move your signing hand into the frame.");
      return;
    }

    const sample: DatasetSample = {
      id: createId("sample"),
      label,
      participantId: participantId.trim() || "unknown-participant",
      sessionId,
      split,
      createdAt: new Date().toISOString(),
      hands: frame.hands,
      normalizedHands: normalizeHands(frame.hands),
      mirroredCamera: settings.mirroredCamera,
      notes: notes.trim(),
    };

    await saveDatasetSample(sample);
    await refreshSamples();
    setStatusMessage(`Captured ${label} sample with ${frame.hands.length} hand(s).`);
  }, [label, notes, participantId, refreshSamples, sessionId, settings.mirroredCamera, split, tracker.latestFrameRef]);

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteDatasetSample(id);
      await refreshSamples();
      setStatusMessage("Deleted sample.");
    },
    [refreshSamples],
  );

  const startNewSession = () => {
    setSessionId(createId("session"));
    setStatusMessage("Started a new recording session.");
  };

  return (
    <main className="space-y-6">
      <section className="rounded-md border border-ink-200 bg-white p-4 shadow-sm dark:border-ink-800 dark:bg-ink-900">
        <p className="text-sm font-semibold uppercase tracking-wide text-signal-blue">
          Training data collection
        </p>
        <h1 className="mt-1 text-3xl font-bold text-ink-950 dark:text-white">Dataset Collector</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-600 dark:text-ink-300">
          Capture labeled landmark samples for isolated signs. Keep every recording session in a
          single split so validation and test results are not inflated by near-duplicate frames.
        </p>
      </section>

      {(tracker.error || collectorError) ? (
        <ErrorBanner message={tracker.error ?? collectorError ?? "Unknown collector error."} />
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <CameraStage
          videoRef={tracker.videoRef}
          canvasRef={tracker.canvasRef}
          cameraStatus={tracker.cameraStatus}
          mirrored={settings.mirroredCamera}
          onStart={tracker.start}
          onStop={tracker.stop}
        />

        <aside className="rounded-md border border-ink-200 bg-white p-4 shadow-sm dark:border-ink-800 dark:bg-ink-900">
          <h2 className="text-base font-semibold text-ink-950 dark:text-white">Capture Controls</h2>
          <div className="mt-4 space-y-4">
            <label className="field-label">
              <span>Sign label</span>
              <select value={label} onChange={(event) => setLabel(event.target.value)}>
                {DATASET_LABELS.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              <span>Participant</span>
              <input
                value={participantId}
                onChange={(event) => setParticipantId(event.target.value)}
                placeholder="participant-001"
              />
            </label>
            <label className="field-label">
              <span>Session</span>
              <input value={sessionId} onChange={(event) => setSessionId(event.target.value)} />
            </label>
            <label className="field-label">
              <span>Dataset split</span>
              <select value={split} onChange={(event) => setSplit(event.target.value as DatasetSplit)}>
                <option value="train">Training</option>
                <option value="validation">Validation</option>
                <option value="test">Testing</option>
              </select>
            </label>
            {splitConflict ? (
              <p className="rounded-md border border-signal-amber/40 bg-signal-amber/10 p-3 text-sm text-amber-800 dark:text-amber-100">
                This session already has samples in another split. Start a new session before
                switching splits.
              </p>
            ) : null}
            <label className="field-label">
              <span>Notes</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="angle, distance, lighting, handedness"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={captureSample}
                disabled={splitConflict}
                className="button-primary"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                Capture
              </button>
              <button type="button" onClick={startNewSession} className="button-secondary">
                New Session
              </button>
              <button
                type="button"
                onClick={() => downloadDataset(samples)}
                disabled={samples.length === 0}
                className="button-secondary col-span-2"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Export Dataset
              </button>
            </div>
            <p className="rounded-md bg-ink-50 p-3 text-sm text-ink-700 dark:bg-ink-950 dark:text-ink-200">
              {statusMessage}
            </p>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <div className="rounded-md border border-ink-200 bg-white p-4 shadow-sm dark:border-ink-800 dark:bg-ink-900">
          <h2 className="text-base font-semibold text-ink-950 dark:text-white">Sample Counts</h2>
          {sampleCounts.length === 0 ? (
            <p className="mt-4 rounded-md bg-ink-50 p-3 text-sm text-ink-600 dark:bg-ink-950 dark:text-ink-300">
              No stored samples.
            </p>
          ) : (
            <div className="mt-4 overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase text-ink-500 dark:text-ink-400">
                  <tr>
                    <th className="py-2 pr-3">Label</th>
                    <th className="py-2 pr-3">Train</th>
                    <th className="py-2 pr-3">Val</th>
                    <th className="py-2 pr-3">Test</th>
                    <th className="py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleCounts.map((count) => (
                    <tr key={count.label} className="border-t border-ink-100 dark:border-ink-800">
                      <td className="py-2 pr-3 font-semibold text-ink-950 dark:text-white">
                        {count.label}
                      </td>
                      <td className="py-2 pr-3">{count.train}</td>
                      <td className="py-2 pr-3">{count.validation}</td>
                      <td className="py-2 pr-3">{count.test}</td>
                      <td className="py-2">{count.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-md border border-ink-200 bg-white p-4 shadow-sm dark:border-ink-800 dark:bg-ink-900">
          <h2 className="text-base font-semibold text-ink-950 dark:text-white">Recent Samples</h2>
          {samples.length === 0 ? (
            <p className="mt-4 rounded-md bg-ink-50 p-3 text-sm text-ink-600 dark:bg-ink-950 dark:text-ink-300">
              Captured samples will appear here.
            </p>
          ) : (
            <ol className="mt-4 max-h-[520px] space-y-2 overflow-auto pr-1">
              {samples.slice(0, 80).map((sample) => (
                <li
                  key={sample.id}
                  className="grid gap-3 rounded-md bg-ink-50 p-3 text-sm dark:bg-ink-950 sm:grid-cols-[1fr_auto]"
                >
                  <div>
                    <p className="font-semibold text-ink-950 dark:text-white">
                      {sample.label} · {sample.split}
                    </p>
                    <p className="text-ink-600 dark:text-ink-300">
                      {sample.participantId} · {sample.sessionId} · {sample.hands.length} hand(s)
                    </p>
                    <time className="text-xs text-ink-500 dark:text-ink-400" dateTime={sample.createdAt}>
                      {new Date(sample.createdAt).toLocaleString()}
                    </time>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(sample.id)}
                    className="icon-button danger self-center"
                    aria-label={`Delete ${sample.label} sample`}
                    title="Delete sample"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </main>
  );
}

function trackerConfidence(sampleCount: number): number {
  return sampleCount === 0 ? 0 : Math.min(1, sampleCount / 100);
}
