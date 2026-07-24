import { Camera, GraduationCap, Trash2 } from "lucide-react";

type TrainingPanelProps = {
  labels: readonly string[];
  selectedLabel: string;
  sampleCount: number;
  totalSamples: number;
  trainedLabelCount: number;
  cameraActive: boolean;
  hasFrame: boolean;
  message: string;
  onSelectedLabelChange: (label: string) => void;
  onCapture: () => void;
  onRemoveSelected: () => void;
};

export function TrainingPanel({
  labels,
  selectedLabel,
  sampleCount,
  totalSamples,
  trainedLabelCount,
  cameraActive,
  hasFrame,
  message,
  onSelectedLabelChange,
  onCapture,
  onRemoveSelected,
}: TrainingPanelProps) {
  return (
    <section className="surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-ink-600" aria-hidden="true" />
          <h2 className="section-title">Teach Camera Words</h2>
        </div>
        <span className="chip chip-neutral">
          {trainedLabelCount} labels, {totalSamples} samples
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
        <label className="field-label">
          Word
          <select
            value={selectedLabel}
            onChange={(event) => onSelectedLabelChange(event.target.value)}
          >
            {labels.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="button-primary self-end"
          onClick={onCapture}
          disabled={!cameraActive || !hasFrame}
        >
          <Camera className="h-4 w-4" aria-hidden="true" />
          Capture
        </button>
        <button
          type="button"
          className="button-secondary self-end"
          onClick={onRemoveSelected}
          disabled={sampleCount === 0}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Reset
        </button>
      </div>

      <div className="surface-muted mt-3 px-3 py-2 text-sm text-deep-800 dark:text-ink-50">
        <span className="font-semibold">{selectedLabel}:</span>{" "}
        {sampleCount} local sample{sampleCount === 1 ? "" : "s"}
        {message ? <span className="ml-2 text-ink-600 dark:text-ink-50/70">{message}</span> : null}
      </div>
    </section>
  );
}
