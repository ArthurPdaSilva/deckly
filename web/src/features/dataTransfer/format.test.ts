import { describe, expect, it } from "vitest";
import { makeCard } from "../../test/helpers";
import { parseExportData, serializeExportData } from "./format";

const exportedAt = "2026-10-19T12:00:00.000Z";
const group = {
  id: "group-1",
  name: "Concursos",
  createdAt: exportedAt,
  updatedAt: exportedAt,
  sortOrder: 0,
};
const deck = {
  id: "deck-1",
  name: "Português",
  description: "",
  groupId: "group-1",
  sortOrder: 0,
  createdAt: exportedAt,
  updatedAt: exportedAt,
};
const review = {
  id: "review-1",
  cardId: "card-1",
  reviewedAt: exportedAt,
  rating: 4,
  previousIntervalDays: 0,
  nextIntervalDays: 1,
  algorithm: "sm-2",
  algorithmVersion: "1",
};

function build(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    format: "deckly",
    version: 1,
    exportedAt,
    groups: [group],
    decks: [deck],
    cards: [makeCard()],
    reviews: [review],
    ...overrides,
  });
}

describe("formato de exportação", () => {
  it("serializa e lê de volta os mesmos dados", () => {
    const text = serializeExportData(
      {
        groups: [group],
        decks: [deck],
        cards: [makeCard()],
        reviews: [review],
      },
      exportedAt,
    );
    const parsed = parseExportData(text);

    expect(parsed).toMatchObject({ format: "deckly", version: 1, exportedAt });
    expect(parsed.cards).toHaveLength(1);
    expect(parsed.reviews[0]?.id).toBe("review-1");
  });

  it("aceita arquivos antigos sem grupos", () => {
    const parsed = parseExportData(
      build({ groups: undefined, decks: [{ ...deck, groupId: undefined }] }),
    );

    expect(parsed.groups).toBeUndefined();
  });

  it.each([
    ["JSON quebrado", "{ não é json"],
    ["formato diferente", build({ format: "outro" })],
    ["versão desconhecida", build({ version: 2 })],
    ["cartão incompleto", build({ cards: [{ id: "x" }] })],
    ["baralho sem nome", build({ decks: [{ ...deck, name: undefined }] })],
  ])("rejeita %s", (_name, input) => {
    expect(() => parseExportData(input)).toThrow("Arquivo Deckly inválido");
  });

  it("rejeita referências quebradas entre as coleções", () => {
    expect(() => parseExportData(build({ groups: [] }))).toThrow(
      "grupo inexistente",
    );
    expect(() =>
      parseExportData(build({ cards: [makeCard({ deckId: "nenhum" })] })),
    ).toThrow("baralho inexistente");
    expect(() =>
      parseExportData(build({ reviews: [{ ...review, cardId: "nenhum" }] })),
    ).toThrow("cartão inexistente");
  });
});
