import { fireEvent, render } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";
import { ThemeProvider, useTheme } from "../../styles/ThemeProvider";

function ThemeProbe() {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <Text>{`${theme.mode}:${theme.colors.background}`}</Text>
      <Pressable onPress={toggleTheme}>
        <Text>Alternar tema</Text>
      </Pressable>
    </>
  );
}

describe("ThemeProvider", () => {
  it("provides the selected theme to its children", () => {
    const screen = render(
      <ThemeProvider mode="dark">
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByText("dark:#17131F")).toBeTruthy();
  });

  it("allows switching the active theme", () => {
    const screen = render(
      <ThemeProvider mode="light">
        <ThemeProbe />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByText("Alternar tema"));

    expect(screen.getByText("dark:#17131F")).toBeTruthy();
  });

  it("restores and persists the selected theme", async () => {
    const database = {
      getFirstAsync: jest.fn().mockResolvedValue({ value: "dark" }),
      runAsync: jest.fn().mockResolvedValue(undefined),
    };
    const screen = render(
      <ThemeProvider database={database}>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(await screen.findByText("dark:#17131F")).toBeTruthy();
    fireEvent.press(screen.getByText("Alternar tema"));

    expect(await screen.findByText("light:#FBF7F2")).toBeTruthy();
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO app_state"),
      "theme_mode",
      "light",
    );
  });
});
