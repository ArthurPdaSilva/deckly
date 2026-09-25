import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useSQLiteContext } from "expo-sqlite";
import { CardsScreen } from "../../../features/cards/CardsScreen";
import type { Deck } from "../../../features/decks/domain/deck";
import { ThemeProvider } from "../../../styles/ThemeProvider";

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: jest.fn(),
}));

const deck: Deck = {
  id: "deck-1",
  name: "Inglês",
  description: "",
  createdAt: "2026-02-01T10:00:00.000Z",
  updatedAt: "2026-02-01T10:00:00.000Z",
};

describe("CardsScreen", () => {
  it("creates a flashcard and displays its front", async () => {
    const database = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn().mockResolvedValue([]),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const screen = render(
      <ThemeProvider mode="light">
        <CardsScreen deck={deck} onBack={jest.fn()} />
      </ThemeProvider>,
    );

    fireEvent.changeText(
      screen.getByPlaceholderText("Frente do cartão"),
      "Hello",
    );
    fireEvent.changeText(screen.getByPlaceholderText("Verso do cartão"), "Olá");
    fireEvent.press(screen.getByText("Adicionar cartão"));

    await waitFor(() => {
      expect(database.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO cards"),
        expect.any(String),
        "deck-1",
        "Hello",
        "Olá",
        expect.any(String),
        0,
        2.5,
        0,
        expect.any(String),
        expect.any(String),
      );
    });
  });
});
