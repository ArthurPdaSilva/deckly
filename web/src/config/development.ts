export function isDevelopmentModeEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_DEV_MODE === "true";
}
