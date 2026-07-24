import { BookOpen, Languages } from "lucide-react";
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
      <header className="sticky top-0 z-20 border-b border-gold-300/60 bg-paper-light/90 text-ink-950 backdrop-blur dark:border-gold-700/40 dark:bg-deep-950/90 dark:text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-3 sm:px-6 lg:px-8">
          <nav className="nav-tabs" data-active={page} aria-label="Main navigation">
            <span className="nav-swish" aria-hidden="true" />
            <button
              type="button"
              onClick={() => navigate("recognizer")}
              className={`nav-button nav-tab-button ${page === "recognizer" ? "active" : ""}`}
            >
              <Languages className="h-4 w-4" aria-hidden="true" />
              Translate
            </button>
            <button
              type="button"
              onClick={() => navigate("vocabulary")}
              className={`nav-button nav-tab-button ${page === "vocabulary" ? "active" : ""}`}
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
          <VocabularyPage settings={settings} />
        )}
      </div>
    </div>
  );
}
