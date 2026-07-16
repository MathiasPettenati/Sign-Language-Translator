import { AlertCircle, CheckCircle2, Loader2, Search, Signal } from "lucide-react";

import type { RecognitionStatus } from "../types/recognition";

type StatusPillProps = {
  status: RecognitionStatus;
  label: string;
};

const STATUS_STYLES: Record<RecognitionStatus, string> = {
  idle: "border-ink-300 bg-white text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100",
  loading:
    "border-signal-blue/30 bg-white text-signal-blue dark:border-signal-blue/50 dark:bg-ink-900 dark:text-blue-200",
  detecting:
    "border-signal-blue/30 bg-white text-signal-blue dark:border-signal-blue/50 dark:bg-ink-900 dark:text-blue-200",
  possible:
    "border-signal-amber/40 bg-white text-amber-800 dark:border-signal-amber/60 dark:bg-ink-900 dark:text-amber-200",
  confirmed:
    "border-signal-green/40 bg-white text-green-800 dark:border-signal-green/60 dark:bg-ink-900 dark:text-green-200",
  uncertain:
    "border-ink-300 bg-white text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100",
  error:
    "border-signal-red/40 bg-white text-red-800 dark:border-signal-red/60 dark:bg-ink-900 dark:text-red-200",
};

function StatusIcon({ status }: { status: RecognitionStatus }) {
  const className = "h-4 w-4";

  if (status === "confirmed") {
    return <CheckCircle2 className={className} aria-hidden="true" />;
  }

  if (status === "possible") {
    return <Signal className={className} aria-hidden="true" />;
  }

  if (status === "loading") {
    return <Loader2 className={`${className} animate-spin`} aria-hidden="true" />;
  }

  if (status === "error") {
    return <AlertCircle className={className} aria-hidden="true" />;
  }

  return <Search className={className} aria-hidden="true" />;
}

export function StatusPill({ status, label }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium ${STATUS_STYLES[status]}`}
    >
      <StatusIcon status={status} />
      {label}
    </span>
  );
}
