import { AlertTriangle } from "lucide-react";

type ErrorBannerProps = {
  message: string;
};

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      className="flex items-start gap-3 border border-ink-950 bg-white p-4 text-sm text-ink-900 dark:border-white/25 dark:bg-deep-900 dark:text-ink-100"
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
