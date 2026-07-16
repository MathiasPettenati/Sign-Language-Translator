import { AlertTriangle } from "lucide-react";

type ErrorBannerProps = {
  message: string;
};

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      className="flex items-start gap-3 rounded-md border border-signal-red/40 bg-signal-red/10 p-4 text-sm text-red-900 dark:border-signal-red/60 dark:bg-signal-red/20 dark:text-red-100"
      role="alert"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">Camera or model issue</p>
        <p>{message}</p>
      </div>
    </div>
  );
}
