export function readJson<T>(key: string, fallback: T, guard: (value: unknown) => value is T): T {
  if (typeof localStorage === "undefined") {
    return fallback;
  }

  const rawValue = localStorage.getItem(key);

  if (!rawValue) {
    return fallback;
  }

  try {
    const parsed: unknown = JSON.parse(rawValue);
    return guard(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}
