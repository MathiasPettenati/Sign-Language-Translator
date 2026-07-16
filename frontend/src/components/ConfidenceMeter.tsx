import { clamp01 } from "../utils/landmarks";

type ConfidenceMeterProps = {
  value: number;
  threshold: number;
  label: string;
};

export function ConfidenceMeter({ value, threshold, label }: ConfidenceMeterProps) {
  const percentage = Math.round(clamp01(value) * 100);
  const thresholdPercentage = Math.round(clamp01(threshold) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-ink-700 dark:text-ink-200">{label}</span>
        <span className="tabular-nums text-ink-600 dark:text-ink-300">{percentage}%</span>
      </div>
      <div
        className="relative h-3 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800"
        aria-label={`${label}: ${percentage} percent confidence`}
      >
        <div
          className="h-full rounded-full bg-signal-green transition-[width] duration-200"
          style={{ width: `${percentage}%` }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-ink-900/70 dark:bg-white/80"
          style={{ left: `${thresholdPercentage}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="flex justify-between text-xs text-ink-500 dark:text-ink-400">
        <span>0</span>
        <span>Threshold {thresholdPercentage}%</span>
        <span>100</span>
      </div>
    </div>
  );
}
