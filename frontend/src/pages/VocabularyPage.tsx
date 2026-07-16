import { BookOpen, CheckCircle2, Clock3 } from "lucide-react";

import {
  FINGERSPELLING_LABELS,
  TARGET_VOCABULARY,
  VOCABULARY_DATABASE,
  type VocabularyCategory,
} from "../constants/vocabulary";

const CATEGORY_LABELS: Record<VocabularyCategory, string> = {
  "isolated-sign": "Isolated signs",
  fingerspelling: "Fingerspelling",
  neutral: "Training control",
};

export function VocabularyPage() {
  const prototypeCount = VOCABULARY_DATABASE.filter((entry) => entry.prototypeAvailable).length;

  return (
    <main className="space-y-6">
      <section className="surface p-4">
        <p className="eyebrow">Vocabulary database</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink-950 dark:text-white">Words</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-600 dark:text-ink-300">
          These labels are the app vocabulary used by the dataset collector and model metadata. The
          prototype recognizer currently supports a smaller subset until a trained custom model is
          added.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="surface p-4">
          <p className="text-sm text-ink-500 dark:text-ink-400">Isolated signs</p>
          <p className="mt-2 text-3xl font-semibold text-ink-950 dark:text-white">
            {TARGET_VOCABULARY.length}
          </p>
        </div>
        <div className="surface p-4">
          <p className="text-sm text-ink-500 dark:text-ink-400">Fingerspelling labels</p>
          <p className="mt-2 text-3xl font-semibold text-ink-950 dark:text-white">
            {FINGERSPELLING_LABELS.length}
          </p>
        </div>
        <div className="surface p-4">
          <p className="text-sm text-ink-500 dark:text-ink-400">Prototype-supported</p>
          <p className="mt-2 text-3xl font-semibold text-ink-950 dark:text-white">
            {prototypeCount}
          </p>
        </div>
      </section>

      <section className="surface p-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-ink-500" aria-hidden="true" />
          <h2 className="section-title">Vocabulary List</h2>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {VOCABULARY_DATABASE.map((entry) => (
            <article key={entry.label} className="list-row p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-ink-950 dark:text-white">{entry.label}</h3>
                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                    {CATEGORY_LABELS[entry.category]}
                  </p>
                </div>
                <span className="chip shrink-0">
                  {entry.prototypeAvailable ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-signal-green" aria-hidden="true" />
                  ) : (
                    <Clock3 className="h-3.5 w-3.5 text-ink-500" aria-hidden="true" />
                  )}
                  {entry.prototypeAvailable ? "Prototype" : "Train"}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
