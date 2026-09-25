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

  it("edits a flashcard", async () => {
    const database = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn().mockResolvedValue([
        {
          id: "card-1",
          deck_id: "deck-1",
          front: "Hello",
          back: "Olá",
          due_at: "2026-02-01T10:00:00.000Z",
          interval_days: 0,
          ease_factor: 2.5,
          repetitions: 0,
          created_at: "2026-02-01T10:00:00.000Z",
          updated_at: "2026-02-01T10:00:00.000Z",
        },
      ]),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const screen = render(
      <ThemeProvider mode="light">
        <CardsScreen deck={deck} onBack={jest.fn()} />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText("Hello")).toBeTruthy());
    fireEvent.press(screen.getByText("Editar"));
    expect(screen.getByText("Editar cartão")).toBeTruthy();
    expect(screen.getByTestId("card-editor").props.style).toEqual(
      expect.objectContaining({ backgroundColor: "#FFFFFF" }),
    );
    fireEvent.changeText(
      screen.getByPlaceholderText("Frente para edição"),
      "Hi",
    );
    fireEvent.changeText(
      screen.getByPlaceholderText("Verso para edição"),
      "Oi",
    );
    fireEvent.press(screen.getByText("Salvar edição"));

    await waitFor(() => {
      expect(database.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE cards"),
        "Hi",
        "Oi",
        expect.any(String),
        "card-1",
      );
    });
  });

  it("asks for confirmation before deleting a flashcard", async () => {
    const database = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn().mockResolvedValue([
        {
          id: "card-1",
          deck_id: "deck-1",
          front: "Hello",
          back: "Olá",
          due_at: "2026-02-01T10:00:00.000Z",
          interval_days: 0,
          ease_factor: 2.5,
          repetitions: 0,
          created_at: "2026-02-01T10:00:00.000Z",
          updated_at: "2026-02-01T10:00:00.000Z",
        },
      ]),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const screen = render(
      <ThemeProvider mode="light">
        <CardsScreen deck={deck} onBack={jest.fn()} />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText("Hello")).toBeTruthy());
    fireEvent.press(screen.getByText("Excluir"));

    expect(screen.getByText("Excluir este cartão?")).toBeTruthy();
    fireEvent.press(screen.getByText("Confirmar exclusão"));

    await waitFor(() => {
      expect(database.runAsync).toHaveBeenCalledWith(
        "DELETE FROM cards WHERE id = ?",
        "card-1",
      );
    });
  });
});
