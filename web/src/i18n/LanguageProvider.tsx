import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  LANGUAGES,
  type Language,
  translate,
  translateError,
} from "./translations";

const STORAGE_KEY = "deckly-language";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  tError: (message: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (LANGUAGES as readonly string[]).includes(stored)) {
      return stored as Language;
    }
    if (navigator.language.toLowerCase().startsWith("en")) return "en";
  } catch {
    // localStorage indisponível: usa o idioma padrão.
  }
  return "pt-BR";
}

export function LanguageProvider({
  children,
  initialLanguage,
}: PropsWithChildren<{ initialLanguage?: Language }>) {
  const [language, setLanguageState] = useState<Language>(
    () => initialLanguage ?? readStoredLanguage(),
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // A preferência só não será lembrada na próxima visita.
    }
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, values) => translate(language, key, values),
      tError: (message) => translateError(language, message),
    }),
    [language, setLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage deve ser usado dentro de LanguageProvider");
  }
  return context;
}
