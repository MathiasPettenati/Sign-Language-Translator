import { Clock3 } from "lucide-react";

import type { RecognitionHistoryItem } from "../types/recognition";

type HistoryPanelProps = {
  items: RecognitionHistoryItem[];
};

export function HistoryPanel({ items }: HistoryPanelProps) {
  return (
    <section className="rounded-md border border-ink-200 bg-white p-4 shadow-sm dark:border-ink-800 dark:bg-ink-900">
      <div className="flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-ink-500" aria-hidden="true" />
        <h2 className="text-base font-semibold text-ink-950 dark:text-white">Recognition History</h2>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 rounded-md bg-ink-50 p-3 text-sm text-ink-600 dark:bg-ink-950 dark:text-ink-300">
          No confirmed signs yet.
        </p>
      ) : (
        <ol className="mt-4 max-h-72 space-y-2 overflow-auto pr-1">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-md bg-ink-50 px-3 py-2 text-sm dark:bg-ink-950"
            >
              <div>
                <p className="font-semibold text-ink-950 dark:text-white">{item.label}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">{item.source}</p>
              </div>
              <div className="text-right text-xs text-ink-500 dark:text-ink-400">
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
