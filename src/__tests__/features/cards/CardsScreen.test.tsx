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
  it("opens the card creation screen", async () => {
    const database = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn().mockResolvedValue([]),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const onCreateCard = jest.fn();
    const screen = render(
      <ThemeProvider mode="light">
        <CardsScreen
          deck={deck}
          onBack={jest.fn()}
          onCreateCard={onCreateCard}
        />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByText("Novo cartão"));
    expect(onCreateCard).toHaveBeenCalled();
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

    const onEditCard = jest.fn();
    const screen = render(
      <ThemeProvider mode="light">
        <CardsScreen deck={deck} onBack={jest.fn()} onEditCard={onEditCard} />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText("Hello")).toBeTruthy());
    fireEvent.press(screen.getByText("Editar"));
    expect(onEditCard).toHaveBeenCalledWith(
      expect.objectContaining({ id: "card-1" }),
    );
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

  it("opens the move screen for a flashcard", async () => {
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

    const onMoveCard = jest.fn();
    const screen = render(
      <ThemeProvider mode="light">
        <CardsScreen deck={deck} onBack={jest.fn()} onMoveCard={onMoveCard} />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText("Hello")).toBeTruthy());
    fireEvent.press(screen.getByText("Mover"));
    expect(onMoveCard).toHaveBeenCalledWith(
      expect.objectContaining({ id: "card-1" }),
    );
  });

  it("reloads the cards when the reload key changes", async () => {
    const database = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn().mockResolvedValue([]),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const screen = render(
      <ThemeProvider mode="light">
        <CardsScreen deck={deck} onBack={jest.fn()} reloadKey={0} />
      </ThemeProvider>,
    );
    await waitFor(() => expect(database.getAllAsync).toHaveBeenCalledTimes(1));

    screen.rerender(
      <ThemeProvider mode="light">
        <CardsScreen deck={deck} onBack={jest.fn()} reloadKey={1} />
      </ThemeProvider>,
    );
    await waitFor(() => expect(database.getAllAsync).toHaveBeenCalledTimes(2));
  });
});
