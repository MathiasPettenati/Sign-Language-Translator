import { Clock3 } from "lucide-react";

import type { RecognitionHistoryItem } from "../types/recognition";

type HistoryPanelProps = {
  items: RecognitionHistoryItem[];
};

export function HistoryPanel({ items }: HistoryPanelProps) {
  return (
    <section className="surface p-4">
      <div className="flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-ink-600" aria-hidden="true" />
        <h2 className="section-title">Translation History</h2>
      </div>
      {items.length === 0 ? (
        <p className="surface-muted mt-4 p-3 text-sm text-ink-600 dark:text-ink-50/70">
          No translated signs yet.
        </p>
      ) : (
        <ol className="mt-4 max-h-72 space-y-2 overflow-auto pr-1">
          {items.map((item) => (
            <li
              key={item.id}
              className="list-row flex items-center justify-between gap-3 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-semibold text-deep-950 dark:text-white">{item.label}</p>
                <p className="text-xs text-ink-500 dark:text-ink-50/60">{item.source}</p>
              </div>
              <div className="text-right text-xs text-ink-500 dark:text-ink-50/60">
                <p>{Math.round(item.confidence * 100)}%</p>
                <time dateTime={item.createdAt}>
                  {new Date(item.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
