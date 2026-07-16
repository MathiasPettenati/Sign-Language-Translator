import { APP_VERSION } from "../constants/vocabulary";
import type { DatasetExport, DatasetSample, SampleCount } from "../types/recognition";

const DB_NAME = "handspeak-dataset";
const DB_VERSION = 1;
const STORE_NAME = "samples";

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
  });
}

export function openDatasetDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("label", "label", { unique: false });
        store.createIndex("participantId", "participantId", { unique: false });
        store.createIndex("sessionId", "sessionId", { unique: false });
        store.createIndex("split", "split", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open IndexedDB."));
  });
}

export async function saveDatasetSample(sample: DatasetSample): Promise<void> {
  const db = await openDatasetDb();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).put(sample);
  await transactionDone(transaction);
  db.close();
}

export async function listDatasetSamples(): Promise<DatasetSample[]> {
  const db = await openDatasetDb();
  const transaction = db.transaction(STORE_NAME, "readonly");
  const request = transaction.objectStore(STORE_NAME).getAll() as IDBRequest<DatasetSample[]>;
  const samples = await requestToPromise(request);
  db.close();
  return samples.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteDatasetSample(id: string): Promise<void> {
  const db = await openDatasetDb();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).delete(id);
  await transactionDone(transaction);
  db.close();
}

export async function clearDatasetSamples(): Promise<void> {
  const db = await openDatasetDb();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).clear();
  await transactionDone(transaction);
  db.close();
}

export function createDatasetExport(samples: DatasetSample[]): DatasetExport {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    samples,
  };
}

export function countSamples(samples: DatasetSample[]): SampleCount[] {
  const counts = new Map<string, SampleCount>();

  samples.forEach((sample) => {
    const existing =
      counts.get(sample.label) ??
      ({
        label: sample.label,
        total: 0,
        train: 0,
        validation: 0,
        test: 0,
      } satisfies SampleCount);

    existing.total += 1;
    existing[sample.split] += 1;
    counts.set(sample.label, existing);
  });

  return Array.from(counts.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export function downloadDataset(samples: DatasetSample[]): void {
  const exportPayload = createDatasetExport(samples);
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `handspeak-dataset-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
