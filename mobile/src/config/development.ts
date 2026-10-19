export function isDevelopmentModeEnabled(): boolean {
  return __DEV__ && process.env.EXPO_PUBLIC_DEV_MODE === "true";
}
