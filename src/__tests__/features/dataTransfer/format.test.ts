import {
  parseExportData,
  serializeExportData,
} from "../../../features/dataTransfer/format";

const data = {
  decks: [
    {
      id: "deck-1",
      name: "Inglês",
      description: "",
      createdAt: "2026-01-01T10:00:00.000Z",
      updatedAt: "2026-01-01T10:00:00.000Z",
    },
  ],
  cards: [
    {
      id: "card-1",
      deckId: "deck-1",
      front: "Hello",
      back: "Olá",
      dueAt: "2026-01-02T10:00:00.000Z",
      intervalDays: 0,
      easeFactor: 2.5,
      repetitions: 0,
      createdAt: "2026-01-01T10:00:00.000Z",
      updatedAt: "2026-01-01T10:00:00.000Z",
    },
  ],
  reviews: [],
};

describe("data transfer format", () => {
  it("serializes and parses a valid export", () => {
    const parsed = parseExportData(
      serializeExportData(data, "2026-03-15T00:00:00.000Z"),
    );

    expect(parsed.format).toBe("deckly");
    expect(parsed.version).toBe(1);
    expect(parsed.decks).toEqual(data.decks);
    expect(parsed.cards).toEqual(data.cards);
  });

  it("rejects malformed or unrelated JSON", () => {
    expect(() => parseExportData("{}")).toThrow("Arquivo Deckly inválido");
    expect(() => parseExportData('{"format":"other","version":1}')).toThrow(
      "Arquivo Deckly inválido",
    );
  });

  it("rejects cards that reference an unknown deck", () => {
    expect(() =>
      parseExportData(
        serializeExportData(
          { ...data, cards: [{ ...data.cards[0], deckId: "missing" }] },
          "2026-03-15T00:00:00.000Z",
        ),
      ),
    ).toThrow("baralho inexistente");
  });
});
