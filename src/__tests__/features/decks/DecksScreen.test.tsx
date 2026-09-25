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

  it("loads the development seed after confirmation", async () => {
    const database = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn().mockResolvedValue([]),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const screen = render(
      <ThemeProvider mode="light">
        <DecksScreen />
      </ThemeProvider>,
    );

    expect(screen.getByText("Carregar dados de teste")).toBeTruthy();
    fireEvent.press(screen.getByText("Carregar dados de teste"));
    expect(screen.getByText("Substituir dados locais?")).toBeTruthy();
    fireEvent.press(screen.getByText("Confirmar reset"));

    await waitFor(() => {
      expect(database.execAsync).toHaveBeenCalledWith("BEGIN");
    });
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

    const screen = render(
      <ThemeProvider mode="light">
        <DecksScreen />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText("Inglês")).toBeTruthy());
    fireEvent.press(screen.getByText("Editar"));
    expect(screen.getByText("Editar baralho")).toBeTruthy();
    expect(screen.getByTestId("deck-editor").props.style).toEqual(
      expect.objectContaining({ backgroundColor: "#FFFFFF" }),
    );
    fireEvent.changeText(
      screen.getByPlaceholderText("Nome para edição"),
      "Espanhol",
    );
    fireEvent.press(screen.getByText("Salvar alterações"));

    await waitFor(() => {
      expect(database.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE decks"),
        "Espanhol",
        "",
        expect.any(String),
        "deck-1",
      );
    });
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
        <DecksScreen />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText("Vocabulário")).toBeTruthy());
    fireEvent.press(screen.getByTestId("deck-deck-1"));

    await waitFor(() =>
      expect(screen.getByText("Adicionar cartão")).toBeTruthy(),
    );
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
