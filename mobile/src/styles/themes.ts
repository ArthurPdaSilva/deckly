export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryMuted: string;
  accent: string;
  onPrimary: string;
  border: string;
  danger: string;
  success: string;
  warning: string;
  ratingAgain: string;
  ratingHard: string;
  ratingGood: string;
  ratingEasy: string;
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
    background: "#FBF7F2",
    surface: "#FFF9F2",
    surfaceElevated: "#FFFFFF",
    text: "#211A2B",
    textSecondary: "#6F6578",
    textMuted: "#A79CAB",
    primary: "#6D4AFF",
    primaryMuted: "#EEE9FF",
    accent: "#F3B562",
    onPrimary: "#FFFDF9",
    border: "#E9DFD4",
    danger: "#C94C5B",
    success: "#3B9B7A",
    warning: "#C88632",
    ratingAgain: "#C96F7A",
    ratingHard: "#C48A52",
    ratingGood: "#6FA681",
    ratingEasy: "#6E9CC2",
  },
  spacing,
  typography,
};

const darkTheme: Theme = {
  mode: "dark",
  colors: {
    background: "#17131F",
    surface: "#241D31",
    surfaceElevated: "#2B2338",
    text: "#F1EAE4",
    textSecondary: "#C2B8C9",
    textMuted: "#93889C",
    primary: "#AA98ED",
    primaryMuted: "#392F54",
    accent: "#D6A861",
    onPrimary: "#211A2B",
    border: "#463A52",
    danger: "#FF8E9A",
    success: "#6BD1A8",
    warning: "#D9B06C",
    ratingAgain: "#B95F72",
    ratingHard: "#C18A4C",
    ratingGood: "#6CA978",
    ratingEasy: "#5C91BC",
  },
  spacing,
  typography,
};

export function getTheme(mode: ThemeMode): Theme {
  return mode === "dark" ? darkTheme : lightTheme;
}
