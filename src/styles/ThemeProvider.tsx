import type { SQLiteBindValue } from "expo-sqlite";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import { getTheme, type Theme, type ThemeMode } from "./themes";

interface ThemeContextValue {
  mode: ThemeMode;
  theme: Theme;
  toggleTheme: () => void;
}

export interface ThemeDatabase {
  getFirstAsync<T>(sql: string, params: SQLiteBindValue[]): Promise<T | null>;
  runAsync(sql: string, ...params: SQLiteBindValue[]): Promise<unknown>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps extends PropsWithChildren {
  database?: ThemeDatabase;
  mode?: ThemeMode;
}

export function ThemeProvider({
  database,
  mode,
  children,
}: ThemeProviderProps) {
  const systemMode = useColorScheme();
  const [overrideMode, setOverrideMode] = useState<ThemeMode | undefined>(mode);
  const activeMode = overrideMode ?? (systemMode === "dark" ? "dark" : "light");

  useEffect(() => {
    if (mode || !database?.getFirstAsync) {
      return;
    }

    let mounted = true;
    void database
      .getFirstAsync<{ value: string }>(
        "SELECT value FROM app_state WHERE key = ?",
        ["theme_mode"],
      )
      .then((row) => {
        if (
          mounted &&
          row?.value &&
          (row.value === "light" || row.value === "dark")
        ) {
          setOverrideMode(row.value);
        }
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [database, mode]);

  function toggleTheme() {
    const nextMode = activeMode === "dark" ? "light" : "dark";
    setOverrideMode(nextMode);
    void database?.runAsync(
      `INSERT INTO app_state (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      "theme_mode",
      nextMode,
    );
  }

  return (
    <ThemeContext.Provider
      value={{
        mode: activeMode,
        theme: getTheme(activeMode),
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
