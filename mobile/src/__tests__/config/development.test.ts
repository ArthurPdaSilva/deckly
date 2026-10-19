import { isDevelopmentModeEnabled } from "../../config/development";

describe("development mode", () => {
  const originalValue = process.env.EXPO_PUBLIC_DEV_MODE;

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env.EXPO_PUBLIC_DEV_MODE;
    } else {
      process.env.EXPO_PUBLIC_DEV_MODE = originalValue;
    }
  });

  it("is disabled unless the explicit environment flag is true", () => {
    delete process.env.EXPO_PUBLIC_DEV_MODE;
    expect(isDevelopmentModeEnabled()).toBe(false);

    process.env.EXPO_PUBLIC_DEV_MODE = "false";
    expect(isDevelopmentModeEnabled()).toBe(false);
  });

  it("is enabled with EXPO_PUBLIC_DEV_MODE=true", () => {
    process.env.EXPO_PUBLIC_DEV_MODE = "true";

    expect(isDevelopmentModeEnabled()).toBe(true);
  });
});
