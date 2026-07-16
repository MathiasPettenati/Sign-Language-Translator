import { Database, HandHeart, Radio } from "lucide-react";
import { useEffect, useState } from "react";

import { DEFAULT_RECOGNITION_SETTINGS, LOCAL_STORAGE_KEYS } from "./constants/vocabulary";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { DatasetCollectorPage } from "./pages/DatasetCollectorPage";
import { RecognizerPage } from "./pages/RecognizerPage";
import { isRecognitionSettings } from "./utils/guards";

type Page = "recognizer" | "collector";

function getPageFromHash(): Page {
  return window.location.hash === "#collector" ? "collector" : "recognizer";
}

export function App() {
  const [settings, setSettings] = useLocalStorage(
    LOCAL_STORAGE_KEYS.settings,
    DEFAULT_RECOGNITION_SETTINGS,
    isRecognitionSettings,
  );
  const [page, setPage] = useState<Page>(() => getPageFromHash());

  useEffect(() => {
    const onHashChange = () => setPage(getPageFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.darkMode);
    document.documentElement.dataset.motion = settings.reducedMotion ? "reduced" : "full";
  }, [settings.darkMode, settings.reducedMotion]);

  const navigate = (nextPage: Page) => {
    window.location.hash = nextPage === "collector" ? "collector" : "";
    setPage(nextPage);
  };

  return (
    <div className="min-h-screen bg-ink-50 text-ink-900 dark:bg-ink-950 dark:text-ink-100">
      <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/92 backdrop-blur dark:border-ink-800 dark:bg-ink-950/92">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-ink-950 text-white dark:bg-white dark:text-ink-950">
              <HandHeart className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                Handspeak
              </p>
              <p className="font-bold text-ink-950 dark:text-white">Sign to Speech MVP</p>
            </div>
          </div>
          <nav className="flex items-center gap-2" aria-label="Main navigation">
            <button
              type="button"
              onClick={() => navigate("recognizer")}
              className={`nav-button ${page === "recognizer" ? "active" : ""}`}
            >
              <Radio className="h-4 w-4" aria-hidden="true" />
              Recognizer
            </button>
            <button
              type="button"
              onClick={() => navigate("collector")}
              className={`nav-button ${page === "collector" ? "active" : ""}`}
            >
              <Database className="h-4 w-4" aria-hidden="true" />
              Dataset
            </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {page === "recognizer" ? (
          <RecognizerPage settings={settings} onSettingsChange={setSettings} />
        ) : (
          <DatasetCollectorPage settings={settings} />
        )}
      </div>
    </div>
  );
}
