import { BookOpen, CheckCircle2, ChevronDown, Plus, Search, Volume2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BrandMark } from "../components/BrandMark";
import { SentenceBuilder } from "../components/SentenceBuilder";
import {
  LOCAL_STORAGE_KEYS,
  PROTOTYPE_RULE_LABELS,
  SPEAKABLE_VOCABULARY_ENTRIES,
  TARGET_VOCABULARY,
  type VocabularyCategory,
} from "../constants/vocabulary";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { speechService } from "../services/speechService";
import type { RecognitionSettings } from "../types/recognition";
import { isString } from "../utils/guards";

const CATEGORY_LABELS: Record<VocabularyCategory, string> = {
  "isolated-sign": "Isolated signs",
  fingerspelling: "Fingerspelling",
  neutral: "No-sign baseline",
};

type VocabularyFilter = "all" | "isolated-sign" | "fingerspelling" | "camera-rule";

type VocabularyPageProps = {
  settings: RecognitionSettings;
};

const INITIAL_VISIBLE_ENTRY_COUNT = 120;
const VISIBLE_ENTRY_INCREMENT = 120;

export function VocabularyPage({ settings }: VocabularyPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<VocabularyFilter>("all");
  const [visibleEntryCount, setVisibleEntryCount] = useState(INITIAL_VISIBLE_ENTRY_COUNT);
  const [sentence, setSentence] = useLocalStorage(LOCAL_STORAGE_KEYS.sentence, "", isString);
  const [spokenCaption, setSpokenCaption] = useState("");

  const filteredEntries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return SPEAKABLE_VOCABULARY_ENTRIES.filter((entry) => {
      const matchesQuery =
        normalizedQuery.length === 0 || entry.label.toLowerCase().includes(normalizedQuery);
      const matchesFilter =
        filter === "all" ||
        (filter === "camera-rule" ? entry.prototypeAvailable : entry.category === filter);

      return matchesQuery && matchesFilter;
    });
  }, [filter, searchQuery]);

  const visibleEntries = useMemo(
    () => filteredEntries.slice(0, visibleEntryCount),
    [filteredEntries, visibleEntryCount],
  );
  const canShowMore = visibleEntries.length < filteredEntries.length;

  useEffect(() => {
    setVisibleEntryCount(INITIAL_VISIBLE_ENTRY_COUNT);
  }, [filter, searchQuery]);

  const appendWord = useCallback(
    (word: string) => {
      setSentence((current) => `${current.trim()} ${word}`.trim());

      if (settings.automaticSpeech) {
        setSpokenCaption(speechService.speakWord(word, settings));
      }
    },
    [setSentence, settings],
  );

  const speakWord = useCallback(
    (word: string) => {
      setSpokenCaption(speechService.speakWord(word, settings));
    },
    [settings],
  );

  const speakSentence = useCallback(() => {
    setSpokenCaption(speechService.speakSentence(sentence, settings));
  }, [sentence, settings]);

  const replayLastSpeech = useCallback(() => {
    setSpokenCaption(speechService.replayLast(settings));
  }, [settings]);

  const stopSpeaking = useCallback(() => {
    speechService.stop();
    setSpokenCaption("");
  }, []);

  const undoLastWord = useCallback(() => {
    setSentence((current) => current.split(/\s+/).filter(Boolean).slice(0, -1).join(" "));
  }, [setSentence]);

  const clearSentence = useCallback(() => {
    setSentence("");
    setSpokenCaption("");
  }, [setSentence]);

  return (
    <main className="space-y-6">
      <section className="surface surface-feature p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <BrandMark className="h-14 w-14 shrink-0" />
          <p className="eyebrow">Translation vocabulary</p>
        </div>
        <h1 className="mt-1 text-3xl font-semibold text-deep-950 dark:text-white sm:text-4xl">
          Signs the translator can speak
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-600 dark:text-ink-50/70">
          Browse every model label Handspeak knows. Add any label to the translated sentence or
          speak it directly; camera recognition uses a trained model when one is installed and the
          built-in hand-shape rules when it is not.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="surface stat-panel p-4">
          <p className="text-sm text-ink-500 dark:text-ink-50/60">Known word bank</p>
          <p className="mt-2 text-3xl font-semibold text-deep-950 dark:text-white">
            {SPEAKABLE_VOCABULARY_ENTRIES.length}
          </p>
        </div>
        <div className="surface stat-panel p-4">
          <p className="text-sm text-ink-500 dark:text-ink-50/60">Translation signs</p>
          <p className="mt-2 text-3xl font-semibold text-deep-950 dark:text-white">
            {TARGET_VOCABULARY.length}
          </p>
        </div>
        <div className="surface stat-panel p-4">
          <p className="text-sm text-ink-500 dark:text-ink-50/60">Camera rules</p>
          <p className="mt-2 text-3xl font-semibold text-deep-950 dark:text-white">
            {PROTOTYPE_RULE_LABELS.length}
          </p>
        </div>
      </section>

      <SentenceBuilder
        sentence={sentence}
        spokenCaption={spokenCaption}
        onSentenceChange={setSentence}
        onSpeak={speakSentence}
        onReplay={replayLastSpeech}
        onStopSpeech={stopSpeaking}
        onUndo={undoLastWord}
        onClear={clearSentence}
      />

      <section className="surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-ink-600" aria-hidden="true" />
            <h2 className="section-title">Translation List</h2>
          </div>
          <span className="chip chip-neutral">
            {visibleEntries.length} of {filteredEntries.length} shown
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <label className="field-label">
            <span className="inline-flex items-center gap-2">
              <Search className="h-4 w-4 text-ink-600" aria-hidden="true" />
              Search words
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Find a label"
            />
          </label>
          <label className="field-label">
            Filter
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as VocabularyFilter)}
            >
              <option value="all">All labels</option>
              <option value="isolated-sign">Isolated signs</option>
              <option value="fingerspelling">Fingerspelling</option>
              <option value="camera-rule">Camera rules</option>
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleEntries.map((entry) => (
            <article key={entry.label} className="list-row p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-medium text-deep-950 dark:text-white">{entry.label}</h3>
                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-50/60">
                    {CATEGORY_LABELS[entry.category]}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="chip chip-neutral">
                    {entry.prototypeAvailable ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-ink-600" aria-hidden="true" />
                    ) : (
                      <BookOpen className="h-3.5 w-3.5 text-ink-500" aria-hidden="true" />
                    )}
                    {entry.prototypeAvailable ? "Camera" : "Word bank"}
                  </span>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => appendWord(entry.label)}
                    aria-label={`Add ${entry.label} to sentence`}
                    title={`Add ${entry.label} to sentence`}
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => speakWord(entry.label)}
                    aria-label={`Speak ${entry.label}`}
                    title={`Speak ${entry.label}`}
                  >
                    <Volume2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {canShowMore ? (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              className="button-secondary"
              onClick={() =>
                setVisibleEntryCount((current) => current + VISIBLE_ENTRY_INCREMENT)
              }
            >
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
              Show more words
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
