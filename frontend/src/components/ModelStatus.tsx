import { BrainCircuit, Cpu, Hand } from "lucide-react";

import type { ModelLoadState } from "../types/recognition";

type ModelStatusProps = {
  state: ModelLoadState;
  handsDetected: number;
  warnings: string[];
};

function stateText(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function ModelStatus({ state, handsDetected, warnings }: ModelStatusProps) {
  return (
    <section className="surface grid gap-3 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-deep-950 dark:text-white">
        <Cpu className="h-4 w-4 text-ink-600" aria-hidden="true" />
        Translation Engine
      </div>
      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-ink-500 dark:text-ink-50/60">
            <Hand className="h-4 w-4" aria-hidden="true" />
            Hand landmarks
          </div>
          <p className="mt-1 font-semibold text-deep-950 dark:text-white">
            {stateText(state.handLandmarker)}
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-ink-500 dark:text-ink-50/60">
            <BrainCircuit className="h-4 w-4" aria-hidden="true" />
            Sign model
          </div>
          <p className="mt-1 font-semibold text-deep-950 dark:text-white">
            {stateText(state.gestureRecognizer)}
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-ink-500 dark:text-ink-50/60">
            <Hand className="h-4 w-4" aria-hidden="true" />
            Hands detected
          </div>
          <p className="mt-1 font-semibold text-deep-950 dark:text-white">{handsDetected}</p>
        </div>
      </div>
      <p className="text-sm text-ink-600 dark:text-ink-50/70">{state.message}</p>
      {warnings.length > 0 ? (
        <ul className="space-y-1 text-sm text-ink-600 dark:text-ink-50/70">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
