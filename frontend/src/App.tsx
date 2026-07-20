import { BookOpen, HandHeart, Languages } from "lucide-react";
import { useEffect, useState } from "react";

import { DEFAULT_RECOGNITION_SETTINGS, LOCAL_STORAGE_KEYS } from "./constants/vocabulary";
import { EntryExperience } from "./components/EntryExperience";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { RecognizerPage } from "./pages/RecognizerPage";
import { VocabularyPage } from "./pages/VocabularyPage";
import { isRecognitionSettings } from "./utils/guards";

type Page = "recognizer" | "vocabulary";

function getPageFromHash(): Page {
  if (window.location.hash === "#vocabulary") {
    return "vocabulary";
  }

  return "recognizer";
}

export function App() {
  const [settings, setSettings] = useLocalStorage(
    LOCAL_STORAGE_KEYS.settings,
    DEFAULT_RECOGNITION_SETTINGS,
    isRecognitionSettings,
  );
  const [page, setPage] = useState<Page>(() => getPageFromHash());
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const onHashChange = () => setPage(getPageFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.darkMode);
    document.documentElement.setAttribute("data-motion", settings.reducedMotion ? "reduced" : "full");
  }, [settings.darkMode, settings.reducedMotion]);

  const navigate = (nextPage: Page) => {
    window.location.hash = nextPage === "vocabulary" ? "vocabulary" : "";
    setPage(nextPage);
  };

  if (!hasEntered) {
    return (
      <EntryExperience
        reducedMotion={settings.reducedMotion}
        onEnter={() => setHasEntered(true)}
      />
    );
  }

  return (
    <div className="app-shell min-h-screen bg-app text-ink-900 dark:bg-deep-950 dark:text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-deep-950 text-white shadow-[0_14px_40px_rgba(5,22,44,0.18)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md border border-white/25 bg-white/10 text-ink-100 shadow-[0_0_24px_rgba(255,255,255,0.08)]">
              <HandHeart className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-ink-100/75">Handspeak</p>
              <p className="text-sm font-semibold text-white">Live Sign Translator</p>
            </div>
          </div>
          <nav className="flex items-center gap-2" aria-label="Main navigation">
            <button
              type="button"
              onClick={() => navigate("recognizer")}
              className={`nav-button ${page === "recognizer" ? "active" : ""}`}
            >
              <Languages className="h-4 w-4" aria-hidden="true" />
              Translate
            </button>
            <button
              type="button"
              onClick={() => navigate("vocabulary")}
              className={`nav-button ${page === "vocabulary" ? "active" : ""}`}
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Words
            </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {page === "recognizer" ? (
          <RecognizerPage settings={settings} onSettingsChange={setSettings} />
        ) : (
          <VocabularyPage />
        )}
      </div>
    </div>
  );
}
