import { AlertCircle, CheckCircle2, Loader2, Search, Signal } from "lucide-react";

import type { RecognitionStatus } from "../types/recognition";

type StatusPillProps = {
  status: RecognitionStatus;
  label: string;
};

const STATUS_STYLES: Record<RecognitionStatus, string> = {
  idle: "border-white/15 bg-white/10 text-blue-50",
  loading:
    "border-teal-300/40 bg-teal-300/12 text-teal-100",
  detecting:
    "border-teal-300/40 bg-teal-300/12 text-teal-100",
  possible:
    "border-signal-amber/50 bg-signal-amber/10 text-amber-100",
  confirmed:
    "border-teal-300/60 bg-teal-300 text-deep-950",
  uncertain:
    "border-white/15 bg-white/10 text-blue-50",
  error:
    "border-signal-red/60 bg-signal-red/10 text-red-100",
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
