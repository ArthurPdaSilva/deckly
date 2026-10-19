import { fireEvent, render, waitFor } from "@testing-library/react-native";
import * as DocumentPicker from "expo-document-picker";
import { useSQLiteContext } from "expo-sqlite";
import { SettingsScreen } from "../../../features/settings/SettingsScreen";
import { LanguageProvider } from "../../../styles/LanguageProvider";
import { ThemeProvider } from "../../../styles/ThemeProvider";

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: jest.fn(),
}));
jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));

describe("SettingsScreen", () => {
  beforeAll(() => {
    process.env.EXPO_PUBLIC_DEV_MODE = "true";
  });

  afterAll(() => {
    delete process.env.EXPO_PUBLIC_DEV_MODE;
  });

  it("loads development seed data from settings", async () => {
    const database = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue(undefined),
      getFirstAsync: jest.fn().mockResolvedValue(null),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const screen = render(
      <LanguageProvider database={database}>
        <ThemeProvider mode="light">
          <SettingsScreen onBack={jest.fn()} />
        </ThemeProvider>
      </LanguageProvider>,
    );

    fireEvent.press(screen.getByText("Carregar dados de teste"));
    expect(
      screen.getByText(
        "Todos os dados locais atuais serão apagados e substituídos pela seed.",
      ),
    ).toBeTruthy();
    fireEvent.press(screen.getByText("Confirmar"));

    await waitFor(() => {
      expect(database.execAsync).toHaveBeenCalledWith("BEGIN");
    });
  });

  it("selects and persists English", async () => {
    const database = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue(undefined),
      getFirstAsync: jest.fn().mockResolvedValue(null),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const screen = render(
      <LanguageProvider database={database}>
        <ThemeProvider mode="light">
          <SettingsScreen onBack={jest.fn()} />
        </ThemeProvider>
      </LanguageProvider>,
    );

    fireEvent.press(screen.getByText("English"));

    expect(screen.getByText("Settings")).toBeTruthy();
    expect(screen.getByText("Appearance")).toBeTruthy();
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO app_state"),
      "language",
      "en",
    );
  });

  it("imports a JSON file read from the picker cache", async () => {
    const database = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue(undefined),
      getFirstAsync: jest.fn().mockResolvedValue(null),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///cache/DocumentPicker/deckly.json" }],
    } as never);
    const payload = {
      format: "deckly",
      version: 1,
      exportedAt: "2026-10-13T18:50:00.000Z",
      groups: [],
      decks: [
        {
          id: "deck-1",
          name: "Inglês",
          description: "",
          createdAt: "2026-10-13T18:50:00.000Z",
          updatedAt: "2026-10-13T18:50:00.000Z",
        },
      ],
      cards: [],
      reviews: [],
    };
    globalThis.fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve(JSON.stringify(payload)),
    }) as never;

    const screen = render(
      <LanguageProvider database={database}>
        <ThemeProvider mode="light">
          <SettingsScreen onBack={jest.fn()} />
        </ThemeProvider>
      </LanguageProvider>,
    );

    fireEvent.press(screen.getByText("Importar dados"));

    await waitFor(() =>
      expect(database.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT OR IGNORE INTO decks"),
        "deck-1",
        "Inglês",
        "",
        null,
        0,
        expect.any(String),
        expect.any(String),
      ),
    );
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "file:///cache/DocumentPicker/deckly.json",
    );
  });

  it("deletes all data only after confirmation", async () => {
    const database = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue(undefined),
      getFirstAsync: jest.fn().mockResolvedValue(null),
      getAllAsync: jest.fn().mockResolvedValue([]),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const screen = render(
      <LanguageProvider database={database}>
        <ThemeProvider mode="light">
          <SettingsScreen onBack={jest.fn()} />
        </ThemeProvider>
      </LanguageProvider>,
    );

    fireEvent.press(screen.getByText("Apagar tudo"));
    expect(database.execAsync).not.toHaveBeenCalledWith("DELETE FROM cards");
    fireEvent.press(screen.getByText("Sim, apagar tudo"));

    await waitFor(() => {
      expect(database.execAsync).toHaveBeenCalledWith("DELETE FROM cards");
    });
    expect(database.execAsync).toHaveBeenCalledWith("DELETE FROM decks");
    expect(database.execAsync).toHaveBeenCalledWith("COMMIT");
  });

  it("asks before opening the audio picker after importing cards with audio", async () => {
    const database = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue(undefined),
      getFirstAsync: jest.fn().mockResolvedValue(null),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);
    jest.mocked(DocumentPicker.getDocumentAsync).mockReset();
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///cache/deckly.json" }],
    } as never);
    const now = "2026-10-13T18:50:00.000Z";
    const payload = {
      format: "deckly",
      version: 1,
      exportedAt: now,
      groups: [],
      decks: [
        {
          id: "deck-1",
          name: "Inglês",
          description: "",
          createdAt: now,
          updatedAt: now,
        },
      ],
      cards: [
        {
          id: "card-1",
          deckId: "deck-1",
          front: "Hi",
          back: "Oi",
          frontAudioFile: "a.mp3",
          dueAt: now,
          intervalDays: 0,
          easeFactor: 2.5,
          repetitions: 0,
          createdAt: now,
          updatedAt: now,
        },
      ],
      reviews: [],
    };
    globalThis.fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve(JSON.stringify(payload)),
    }) as never;

    const screen = render(
      <LanguageProvider database={database}>
        <ThemeProvider mode="light">
          <SettingsScreen onBack={jest.fn()} />
        </ThemeProvider>
      </LanguageProvider>,
    );

    fireEvent.press(screen.getByText("Importar dados"));

    await waitFor(() =>
      expect(screen.getByText("Selecionar áudios")).toBeTruthy(),
    );
    expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByText("Pular por enquanto"));
    expect(screen.queryByText("Selecionar áudios")).toBeNull();
    expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledTimes(1);
  });
});
