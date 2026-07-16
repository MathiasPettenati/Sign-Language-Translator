import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";

import { readJson, writeJson } from "../services/storage";

export function useLocalStorage<T>(
  key: string,
  fallback: T,
  guard: (value: unknown) => value is T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readJson(key, fallback, guard));

  useEffect(() => {
    writeJson(key, value);
  }, [key, value]);

  const setStoredValue = useCallback<Dispatch<SetStateAction<T>>>(
    (nextValue) => {
      setValue((current) => {
        const resolvedValue =
          typeof nextValue === "function"
            ? (nextValue as (previous: T) => T)(current)
            : nextValue;
        writeJson(key, resolvedValue);
        return resolvedValue;
      });
    },
    [key],
  );

  return [value, setStoredValue];
}
