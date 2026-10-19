import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useSQLiteContext } from "expo-sqlite";
import * as audioStorage from "../../../features/cards/audioStorage";
import { CardFormScreen } from "../../../features/cards/CardFormScreen";
import type { Flashcard } from "../../../features/cards/domain/flashcard";
import type { Deck } from "../../../features/decks/domain/deck";
import { ThemeProvider } from "../../../styles/ThemeProvider";

jest.mock("expo-sqlite", () => ({ useSQLiteContext: jest.fn() }));
jest.mock("../../../features/cards/audioStorage", () => ({
  pickAudioFile: jest.fn(),
  persistAudioFile: jest.fn(),
  deleteAudioFile: jest.fn().mockResolvedValue(undefined),
}));

const deck: Deck = {
  id: "deck-1",
  name: "Inglês",
  description: "",
  createdAt: "2026-02-01T10:00:00.000Z",
  updatedAt: "2026-02-01T10:00:00.000Z",
};

function renderForm(card?: Flashcard, onBack = jest.fn()) {
  const database = {
    runAsync: jest.fn().mockResolvedValue(undefined),
    getAllAsync: jest.fn().mockResolvedValue([]),
  };
  jest.mocked(useSQLiteContext).mockReturnValue(database as never);
  const screen = render(
    <ThemeProvider mode="light">
      <CardFormScreen deck={deck} card={card} onBack={onBack} />
    </ThemeProvider>,
  );
  return { screen, database, onBack };
}

describe("CardFormScreen audio", () => {
  beforeEach(() => jest.clearAllMocks());

  it("attaches an audio to the question and stores it with the card", async () => {
    jest.mocked(audioStorage.pickAudioFile).mockResolvedValue({
      uri: "file:///cache/passport.mp3",
      name: "passport.mp3",
    });
    jest
      .mocked(audioStorage.persistAudioFile)
      .mockResolvedValue("file:///docs/card-audio/audio-1.mp3");
    const { screen, database, onBack } = renderForm();

    fireEvent.changeText(
      screen.getByLabelText("Frente do cartão"),
      "Do you have your passport?",
    );
    fireEvent.changeText(
      screen.getByLabelText("Verso do cartão"),
      "Você está com seu passaporte?",
    );
    fireEvent.press(screen.getByText("Anexar áudio à pergunta"));
    await waitFor(() =>
      expect(screen.getByText("Áudio anexado: passport.mp3")).toBeTruthy(),
    );
    expect(screen.getByText("▶ Tocar áudio")).toBeTruthy();
    fireEvent.press(screen.getByText("Criar cartão"));

    await waitFor(() => expect(onBack).toHaveBeenCalled());
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO cards"),
      expect.any(String),
      "deck-1",
      "Do you have your passport?",
      "Você está com seu passaporte?",
      "file:///docs/card-audio/audio-1.mp3",
      expect.any(String),
      0,
      2.5,
      0,
      expect.any(String),
      expect.any(String),
    );
  });

  it("removes the previous audio file when the audio is removed from the card", async () => {
    const card: Flashcard = {
      id: "card-1",
      deckId: "deck-1",
      front: "Question",
      back: "Answer",
      frontAudioUri: "file:///docs/card-audio/audio-1.mp3",
      dueAt: "2026-02-01T10:00:00.000Z",
      intervalDays: 0,
      easeFactor: 2.5,
      repetitions: 0,
      createdAt: "2026-02-01T10:00:00.000Z",
      updatedAt: "2026-02-01T10:00:00.000Z",
    };
    const { screen, database, onBack } = renderForm(card);

    expect(screen.getByText("Áudio anexado à pergunta")).toBeTruthy();
    fireEvent.press(screen.getByText("Remover áudio"));
    fireEvent.press(screen.getByText("Salvar cartão"));

    await waitFor(() => expect(onBack).toHaveBeenCalled());
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE cards"),
      "Question",
      "Answer",
      null,
      expect.any(String),
      "card-1",
    );
    expect(audioStorage.deleteAudioFile).toHaveBeenCalledWith(
      "file:///docs/card-audio/audio-1.mp3",
    );
  });

  it("discards the copied audio when saving fails", async () => {
    jest.mocked(audioStorage.pickAudioFile).mockResolvedValue({
      uri: "file:///cache/a.mp3",
      name: "a.mp3",
    });
    jest
      .mocked(audioStorage.persistAudioFile)
      .mockResolvedValue("file:///docs/card-audio/audio-9.mp3");
    const { screen } = renderForm();

    fireEvent.changeText(screen.getByLabelText("Frente do cartão"), "Q");
    fireEvent.press(screen.getByText("Anexar áudio à pergunta"));
    await waitFor(() => expect(screen.getByText("Remover áudio")).toBeTruthy());
    fireEvent.press(screen.getByText("Criar cartão"));

    await waitFor(() =>
      expect(audioStorage.deleteAudioFile).toHaveBeenCalledWith(
        "file:///docs/card-audio/audio-9.mp3",
      ),
    );
  });
});
