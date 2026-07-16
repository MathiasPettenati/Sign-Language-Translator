import { RotateCcw, Square, Trash2, Undo2, Volume2 } from "lucide-react";

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
        <h2 className="section-title">Generated Sentence</h2>
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
            <Square className="h-4 w-4" aria-hidden="true" />
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
        className="mt-4 min-h-24 w-full resize-y rounded-md border border-ink-300 bg-white p-3 text-xl font-medium leading-snug text-ink-950 outline-none transition focus:border-signal-blue focus:ring-2 focus:ring-signal-blue/15 dark:border-ink-700 dark:bg-ink-950 dark:text-white sm:text-2xl"
        aria-label="Editable generated sentence"
        placeholder="Confirmed signs appear here"
      />
      <div className="surface-muted mt-3 px-3 py-2 text-sm text-ink-700 dark:text-ink-200">
        <span className="font-semibold">Captions:</span>{" "}
        {spokenCaption ? spokenCaption : "No speech output yet"}
      </div>
    </section>
  );
}
