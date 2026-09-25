import { createContext, type PropsWithChildren, useContext } from "react";
import { useColorScheme } from "react-native";
import { getTheme, type Theme, type ThemeMode } from "./themes";

interface ThemeContextValue {
  mode: ThemeMode;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps extends PropsWithChildren {
  mode?: ThemeMode;
}

export function ThemeProvider({ mode, children }: ThemeProviderProps) {
  const systemMode = useColorScheme();
  const activeMode = mode ?? (systemMode === "dark" ? "dark" : "light");

  return (
    <ThemeContext.Provider
      value={{ mode: activeMode, theme: getTheme(activeMode) }}
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
