import { AlertTriangle } from "lucide-react";

type ErrorBannerProps = {
  message: string;
};

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      className="flex items-start gap-3 border border-gold-300 bg-gold-50 p-4 text-sm text-ink-900 shadow-panel dark:border-gold-700/70 dark:bg-deep-900 dark:text-ink-100"
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
