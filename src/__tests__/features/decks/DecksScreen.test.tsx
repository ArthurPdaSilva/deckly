import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useSQLiteContext } from "expo-sqlite";
import { DecksScreen } from "../../../features/decks/DecksScreen";
import { ThemeProvider } from "../../../styles/ThemeProvider";

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: jest.fn(),
}));

describe("DecksScreen", () => {
  it("creates a deck and displays it in the list", async () => {
    const database = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn().mockResolvedValue([]),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const screen = render(
      <ThemeProvider mode="light">
        <DecksScreen />
      </ThemeProvider>,
    );

    fireEvent.changeText(
      screen.getByPlaceholderText("Nome do baralho"),
      "Inglês",
    );
    fireEvent.press(screen.getByText("Criar baralho"));

    await waitFor(() => {
      expect(database.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO decks"),
        expect.any(String),
        "Inglês",
        "",
        expect.any(String),
        expect.any(String),
      );
    });
  });
});
