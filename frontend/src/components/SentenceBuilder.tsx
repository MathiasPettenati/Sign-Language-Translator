import { CircleStop, RotateCcw, Trash2, Undo2, Volume2 } from "lucide-react";

type SentenceBuilderProps = {
  sentence: string;
  spokenCaption: string;
  onSentenceChange: (value: string) => void;
  onSpeak: () => void;
  onReplay: () => void;
  onStopSpeech: () => void;
  onUndo: () => void;
  onClear: () => void;
};

export function SentenceBuilder({
  sentence,
  spokenCaption,
  onSentenceChange,
  onSpeak,
  onReplay,
  onStopSpeech,
  onUndo,
  onClear,
}: SentenceBuilderProps) {
  return (
    <section className="surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">Translated Sentence</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSpeak}
            disabled={!sentence.trim()}
            className="icon-button"
            aria-label="Speak sentence"
            title="Speak sentence"
          >
            <Volume2 className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onReplay}
            className="icon-button"
            aria-label="Replay last spoken output"
            title="Replay last spoken output"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onStopSpeech}
            className="icon-button"
            aria-label="Stop speaking"
            title="Stop speaking"
          >
            <CircleStop className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onUndo}
            disabled={!sentence.trim()}
            className="icon-button"
            aria-label="Undo last word"
            title="Undo last word"
          >
            <Undo2 className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={!sentence.trim()}
            className="icon-button danger"
            aria-label="Clear sentence"
            title="Clear sentence"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <textarea
        value={sentence}
        onChange={(event) => onSentenceChange(event.target.value)}
        rows={3}
        className="mt-4 min-h-24 w-full resize-y border border-gold-200 bg-paper-light p-3 text-xl font-bold leading-snug text-deep-950 outline-none transition focus:border-gold-700 focus:ring-2 focus:ring-gold-500/20 dark:border-gold-800/50 dark:bg-deep-950 dark:text-white sm:text-2xl"
        aria-label="Editable generated sentence"
        placeholder="Translated signs appear here"
      />
      <div className="surface-muted mt-3 px-3 py-2 text-sm text-deep-800 dark:text-ink-50">
        <span className="font-semibold">Speech:</span>{" "}
        {spokenCaption ? spokenCaption : "No speech output yet"}
      </div>
    </section>
  );
}
