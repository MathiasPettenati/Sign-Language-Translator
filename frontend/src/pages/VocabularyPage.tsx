import { BookOpen, CheckCircle2, Clock3 } from "lucide-react";

import {
  FINGERSPELLING_LABELS,
  TARGET_VOCABULARY,
  VOCABULARY_ENTRIES,
  type VocabularyCategory,
} from "../constants/vocabulary";

const CATEGORY_LABELS: Record<VocabularyCategory, string> = {
  "isolated-sign": "Isolated signs",
  fingerspelling: "Fingerspelling",
  neutral: "No-sign baseline",
};

export function VocabularyPage() {
  const prototypeCount = VOCABULARY_ENTRIES.filter((entry) => entry.prototypeAvailable).length;

  return (
    <main className="space-y-6">
      <section className="surface surface-feature p-4 sm:p-5">
        <p className="eyebrow">Translation vocabulary</p>
        <h1 className="mt-1 text-3xl font-semibold text-deep-950 dark:text-white sm:text-4xl">
          Signs the translator can speak
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-600 dark:text-ink-50/70">
          Browse the signs and fingerspelling labels Handspeak can turn into text and speech.
          Prototype labels are available in the live translator today; the rest are ready for model
          expansion.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="surface stat-panel p-4">
          <p className="text-sm text-ink-500 dark:text-ink-50/60">Translation signs</p>
          <p className="mt-2 text-3xl font-semibold text-deep-950 dark:text-white">
            {TARGET_VOCABULARY.length}
          </p>
        </div>
        <div className="surface stat-panel p-4">
          <p className="text-sm text-ink-500 dark:text-ink-50/60">Fingerspelling labels</p>
          <p className="mt-2 text-3xl font-semibold text-deep-950 dark:text-white">
            {FINGERSPELLING_LABELS.length}
          </p>
        </div>
        <div className="surface stat-panel p-4">
          <p className="text-sm text-ink-500 dark:text-ink-50/60">Live prototype</p>
          <p className="mt-2 text-3xl font-semibold text-deep-950 dark:text-white">
            {prototypeCount}
          </p>
        </div>
      </section>

      <section className="surface p-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-ink-600" aria-hidden="true" />
          <h2 className="section-title">Translation List</h2>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {VOCABULARY_ENTRIES.map((entry) => (
            <article key={entry.label} className="list-row p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-deep-950 dark:text-white">{entry.label}</h3>
                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-50/60">
                    {CATEGORY_LABELS[entry.category]}
                  </p>
                </div>
                <span className="chip chip-neutral shrink-0">
                  {entry.prototypeAvailable ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-ink-600" aria-hidden="true" />
                  ) : (
                    <Clock3 className="h-3.5 w-3.5 text-ink-500" aria-hidden="true" />
                  )}
                  {entry.prototypeAvailable ? "Live" : "Soon"}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
