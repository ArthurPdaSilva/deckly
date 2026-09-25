import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { ThemeProvider, useTheme } from "../../styles/ThemeProvider";

function ThemeProbe() {
  const { theme } = useTheme();

  return <Text>{`${theme.mode}:${theme.colors.background}`}</Text>;
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
});
