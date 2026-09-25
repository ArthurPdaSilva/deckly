import { getTheme } from "../../styles/themes";

describe("themes", () => {
  it("provides semantic tokens for the light theme", () => {
    const theme = getTheme("light");

    expect(theme.mode).toBe("light");
    expect(theme.colors.background).toBe("#FBF7F2");
    expect(theme.colors.primary).toBe("#6D4AFF");
    expect(theme.colors.accent).toBe("#F3B562");
    expect(theme.colors).toMatchObject({
      background: expect.any(String),
      surface: expect.any(String),
      surfaceElevated: expect.any(String),
      text: expect.any(String),
      textSecondary: expect.any(String),
      textMuted: expect.any(String),
      primary: expect.any(String),
      primaryMuted: expect.any(String),
      accent: expect.any(String),
      onPrimary: expect.any(String),
      border: expect.any(String),
      danger: expect.any(String),
      success: expect.any(String),
      warning: expect.any(String),
    });
  });

  it("provides a distinct dark theme with the same token contract", () => {
    const lightTheme = getTheme("light");
    const darkTheme = getTheme("dark");

    expect(darkTheme.mode).toBe("dark");
    expect(darkTheme.colors.background).toBe("#17131F");
    expect(darkTheme.colors.primary).toBe("#B7A5FF");
    expect(darkTheme.colors.accent).toBe("#F6C777");
    expect(Object.keys(darkTheme.colors)).toEqual(
      expect.arrayContaining(Object.keys(lightTheme.colors)),
    );
    expect(darkTheme.colors.background).not.toBe(lightTheme.colors.background);
    expect(darkTheme.colors.text).not.toBe(lightTheme.colors.text);
  });
});
