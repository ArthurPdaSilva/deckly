import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useSQLiteContext } from "expo-sqlite";
import { DecksScreen } from "../../../features/decks/DecksScreen";
import { AppRouter } from "../../../routes/AppRouter";
import { ThemeProvider } from "../../../styles/ThemeProvider";

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: jest.fn(),
}));

describe("DecksScreen", () => {
  beforeAll(() => {
    process.env.EXPO_PUBLIC_DEV_MODE = "true";
  });

  afterAll(() => {
    delete process.env.EXPO_PUBLIC_DEV_MODE;
  });

  it("creates a deck and displays it in the list", async () => {
    const database = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn().mockResolvedValue([]),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const onNavigate = jest.fn();
    const screen = render(
      <ThemeProvider mode="light">
        <DecksScreen onNavigate={onNavigate} />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByText("Novo baralho"));
    expect(onNavigate).toHaveBeenCalledWith({ name: "deckForm" });
  });

  it("renders decks under their persisted group", async () => {
    const database = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn().mockImplementation((sql: string) => {
        if (sql.includes("deck_groups")) {
          return Promise.resolve([
            {
              id: "group-1",
              name: "Idiomas",
              created_at: "2026-01-01T10:00:00.000Z",
              updated_at: "2026-01-01T10:00:00.000Z",
              sort_order: 0,
            },
          ]);
        }
        if (sql.includes("FROM cards")) return Promise.resolve([]);
        return Promise.resolve([
          {
            id: "deck-1",
            name: "Inglês",
            description: "Vocabulário",
            group_id: "group-1",
            sort_order: 0,
            created_at: "2026-01-01T10:00:00.000Z",
            updated_at: "2026-01-01T10:00:00.000Z",
          },
        ]);
      }),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const onNavigate = jest.fn();
    const screen = render(
      <ThemeProvider mode="light">
        <DecksScreen onNavigate={onNavigate} groupId="group-1" />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText("Revisar grupo")).toBeTruthy());
    expect(screen.getByText("Inglês")).toBeTruthy();
  });

  it("opens the progress dashboard", async () => {
    const database = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      getFirstAsync: jest.fn().mockResolvedValue({ count: 0, average: null }),
      getAllAsync: jest.fn().mockResolvedValue([]),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const screen = render(
      <ThemeProvider mode="light">
        <AppRouter />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText("Ver progresso")).toBeTruthy());
    fireEvent.press(screen.getByText("Ver progresso"));

    await waitFor(() =>
      expect(screen.getByText("0 revisões hoje")).toBeTruthy(),
    );
  });

  it("edits a deck from the list", async () => {
    const database = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn().mockResolvedValue([
        {
          id: "deck-1",
          name: "Inglês",
          description: "",
          created_at: "2026-01-01T10:00:00.000Z",
          updated_at: "2026-01-01T10:00:00.000Z",
        },
      ]),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const onNavigate = jest.fn();
    const screen = render(
      <ThemeProvider mode="light">
        <DecksScreen onNavigate={onNavigate} />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText("Inglês")).toBeTruthy());
    fireEvent.press(screen.getByText("Editar"));
    expect(onNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "deckForm",
        deck: expect.objectContaining({ id: "deck-1" }),
      }),
    );
  });

  it("opens the cards when any part of the deck is pressed", async () => {
    const database = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn().mockResolvedValue([
        {
          id: "deck-1",
          name: "Inglês",
          description: "Vocabulário",
          created_at: "2026-01-01T10:00:00.000Z",
          updated_at: "2026-01-01T10:00:00.000Z",
        },
      ]),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const screen = render(
      <ThemeProvider mode="light">
        <AppRouter />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByText("Meus baralhos"));
    await waitFor(() => expect(screen.getByText("Sem grupo")).toBeTruthy());
    const openButtons = screen.getAllByText("Abrir baralhos");
    fireEvent.press(openButtons[openButtons.length - 1]);
    await waitFor(() => expect(screen.getByText("Vocabulário")).toBeTruthy());
    fireEvent.press(screen.getByTestId("deck-deck-1"));

    await waitFor(() => expect(screen.getByText("Novo cartão")).toBeTruthy());
  });

  it("asks for confirmation before deleting a deck", async () => {
    const database = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn().mockResolvedValue([
        {
          id: "deck-1",
          name: "Inglês",
          description: "",
          created_at: "2026-01-01T10:00:00.000Z",
          updated_at: "2026-01-01T10:00:00.000Z",
        },
      ]),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const screen = render(
      <ThemeProvider mode="light">
        <DecksScreen />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText("Inglês")).toBeTruthy());
    fireEvent.press(screen.getByText("Excluir"));

    expect(screen.getByText("Excluir este baralho?")).toBeTruthy();
    fireEvent.press(screen.getByText("Confirmar exclusão"));

    await waitFor(() => {
      expect(database.runAsync).toHaveBeenCalledWith(
        "DELETE FROM decks WHERE id = ?",
        "deck-1",
      );
    });
  });
});
