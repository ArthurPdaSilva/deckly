import type { SQLiteBindValue } from "expo-sqlite";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { translate } from "./translations";

export type Language = "pt-BR" | "en";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export interface LanguageDatabase {
  getFirstAsync<T>(sql: string, params: SQLiteBindValue[]): Promise<T | null>;
  runAsync(sql: string, ...params: SQLiteBindValue[]): Promise<unknown>;
}

interface LanguageProviderProps extends PropsWithChildren {
  database?: LanguageDatabase;
  language?: Language;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "pt-BR",
  setLanguage: () => undefined,
  t: (key, values) => translate("pt-BR", key, values),
});

export function LanguageProvider({
  database,
  language: initialLanguage,
  children,
}: LanguageProviderProps) {
  const [language, setActiveLanguage] = useState<Language>(
    initialLanguage ?? "pt-BR",
  );

  useEffect(() => {
    if (initialLanguage || !database?.getFirstAsync) return;

    let mounted = true;
    void database
      .getFirstAsync<{ value: string }>(
        "SELECT value FROM app_state WHERE key = ?",
        ["language"],
      )
      .then((row) => {
        if (
          mounted &&
          row?.value &&
          (row.value === "pt-BR" || row.value === "en")
        ) {
          setActiveLanguage(row.value);
        }
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [database, initialLanguage]);

  function setLanguage(nextLanguage: Language) {
    setActiveLanguage(nextLanguage);
    void database?.runAsync(
      `INSERT INTO app_state (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      "language",
      nextLanguage,
    );
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: (key, values) => translate(language, key, values),
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
