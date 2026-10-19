import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useSQLiteContext } from "expo-sqlite";
import type { Flashcard } from "../../../features/cards/domain/flashcard";
import { MoveCardScreen } from "../../../features/cards/MoveCardScreen";
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

const card: Flashcard = {
  id: "card-1",
  deckId: "deck-1",
  front: "Hello",
  back: "Olá",
  dueAt: "2026-02-01T10:00:00.000Z",
  intervalDays: 0,
  easeFactor: 2.5,
  repetitions: 0,
  createdAt: "2026-02-01T10:00:00.000Z",
  updatedAt: "2026-02-01T10:00:00.000Z",
};

function deckRow(id: string, name: string, sortOrder: number) {
  return {
    id,
    name,
    description: "",
    group_id: null,
    sort_order: sortOrder,
    created_at: "2026-02-01T10:00:00.000Z",
    updated_at: "2026-02-01T10:00:00.000Z",
  };
}

describe("MoveCardScreen", () => {
  it("lists the other decks and moves the card to the chosen one", async () => {
    const database = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest
        .fn()
        .mockResolvedValue([
          deckRow("deck-1", "Inglês", 0),
          deckRow("deck-2", "Espanhol", 1),
        ]),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);
    const onMoved = jest.fn();

    const screen = render(
      <ThemeProvider mode="light">
        <MoveCardScreen
          card={card}
          deck={deck}
          onBack={jest.fn()}
          onMoved={onMoved}
        />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText("Espanhol")).toBeTruthy());
    expect(screen.getByText("Mover para outro baralho")).toBeTruthy();
    expect(screen.getByText("Hello")).toBeTruthy();
    expect(screen.queryByText("Inglês")).toBeNull();

    fireEvent.press(screen.getByText("Espanhol"));

    await waitFor(() => expect(onMoved).toHaveBeenCalled());
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("SET deck_id = ?"),
      "deck-2",
      expect.any(String),
      "card-1",
    );
  });

  it("explains when there is no other deck", async () => {
    const database = {
      runAsync: jest.fn(),
      getAllAsync: jest
        .fn()
        .mockResolvedValue([deckRow("deck-1", "Inglês", 0)]),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const screen = render(
      <ThemeProvider mode="light">
        <MoveCardScreen
          card={card}
          deck={deck}
          onBack={jest.fn()}
          onMoved={jest.fn()}
        />
      </ThemeProvider>,
    );

    await waitFor(() =>
      expect(
        screen.getByText("Crie outro baralho para poder mover este cartão."),
      ).toBeTruthy(),
    );
  });

  it("goes back without moving", async () => {
    const database = {
      runAsync: jest.fn(),
      getAllAsync: jest.fn().mockResolvedValue([]),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);
    const onBack = jest.fn();

    const screen = render(
      <ThemeProvider mode="light">
        <MoveCardScreen
          card={card}
          deck={deck}
          onBack={onBack}
          onMoved={jest.fn()}
        />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByText("← Voltar"));
    expect(onBack).toHaveBeenCalled();
    expect(database.runAsync).not.toHaveBeenCalled();
  });
});
