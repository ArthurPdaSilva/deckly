export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  border: string;
  danger: string;
  success: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface ThemeTypography {
  body: number;
  bodySmall: number;
  heading: number;
  title: number;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
}

const spacing: ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const typography: ThemeTypography = {
  body: 16,
  bodySmall: 14,
  heading: 22,
  title: 28,
};

const lightTheme: Theme = {
  mode: "light",
  colors: {
    background: "#F7F8FA",
    surface: "#FFFFFF",
    text: "#17202A",
    textSecondary: "#5B6573",
    primary: "#315CFF",
    border: "#D9DEE7",
    danger: "#C93636",
    success: "#16845B",
  },
  spacing,
  typography,
};

const darkTheme: Theme = {
  mode: "dark",
  colors: {
    background: "#11151C",
    surface: "#1B222C",
    text: "#F3F5F7",
    textSecondary: "#AAB4C2",
    primary: "#8EA6FF",
    border: "#35404E",
    danger: "#FF8A8A",
    success: "#65D7A8",
  },
  spacing,
  typography,
};

export function getTheme(mode: ThemeMode): Theme {
  return mode === "dark" ? darkTheme : lightTheme;
}
