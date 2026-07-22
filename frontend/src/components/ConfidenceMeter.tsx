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
        <span className="font-medium text-deep-800 dark:text-ink-50">{label}</span>
        <span className="tabular-nums text-ink-600 dark:text-ink-50/70">{percentage}%</span>
      </div>
      <div
        className="relative h-2 overflow-hidden border border-gold-200 bg-paper-light dark:border-gold-800/50 dark:bg-white/10"
        aria-label={`${label}: ${percentage} percent confidence`}
      >
        <div
          className="h-full bg-gold-600 transition-[width] duration-200 dark:bg-gold-300"
          style={{ width: `${percentage}%` }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-sage-700/80 dark:bg-sage-200/80"
          style={{ left: `${thresholdPercentage}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="flex justify-between text-xs text-ink-500 dark:text-ink-50/60">
        <span>0</span>
        <span>Threshold {thresholdPercentage}%</span>
        <span>100</span>
      </div>
    </div>
  );
}
