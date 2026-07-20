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
        <span className="font-medium text-deep-800 dark:text-blue-50">{label}</span>
        <span className="tabular-nums text-ink-600 dark:text-blue-50/70">{percentage}%</span>
      </div>
      <div
        className="relative h-2 overflow-hidden rounded-full bg-deep-100 dark:bg-white/10"
        aria-label={`${label}: ${percentage} percent confidence`}
      >
        <div
          className="h-full rounded-full bg-teal-500 transition-[width] duration-200"
          style={{ width: `${percentage}%` }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-deep-950/70 dark:bg-white/80"
          style={{ left: `${thresholdPercentage}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="flex justify-between text-xs text-ink-500 dark:text-blue-50/60">
        <span>0</span>
        <span>Threshold {thresholdPercentage}%</span>
        <span>100</span>
      </div>
    </div>
  );
}
