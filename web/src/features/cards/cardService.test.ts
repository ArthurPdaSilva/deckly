import { beforeEach, describe, expect, it } from "vitest";
import type { Services } from "../../app/services";
import { createTestServices, FIXED_NOW } from "../../test/helpers";
import {
  attachCardAudio,
  createFlashcard,
  deleteFlashcard,
  listFlashcards,
  moveFlashcard,
  removeCardAudio,
  updateFlashcard,
} from "./cardService";

let services: Services;
const options = () => ({ now: FIXED_NOW, createId: services.createId });

beforeEach(() => {
  services = createTestServices();
});

describe("cartões", () => {
  it("cria um cartão novo vencendo agora", async () => {
    const card = await createFlashcard(
      services.cards,
      "deck-1",
      { front: " Frente ", back: " Verso " },
      options(),
    );

    expect(card).toMatchObject({
      front: "Frente",
      back: "Verso",
      dueAt: FIXED_NOW.toISOString(),
      easeFactor: 2.5,
      repetitions: 0,
    });
    expect(await listFlashcards(services.cards, "deck-1")).toHaveLength(1);
  });

  it("exige frente e verso", async () => {
    await expect(
      createFlashcard(
        services.cards,
        "deck-1",
        { front: "", back: "x" },
        options(),
      ),
    ).rejects.toThrow("A frente do cartão não pode ficar vazia");
    await expect(
      createFlashcard(
        services.cards,
        "deck-1",
        { front: "x", back: " " },
        options(),
      ),
    ).rejects.toThrow("O verso do cartão não pode ficar vazio");
  });

  it("edita o texto sem perder o agendamento", async () => {
    const card = await createFlashcard(
      services.cards,
      "deck-1",
      { front: "a", back: "b" },
      options(),
    );
    const updated = await updateFlashcard(
      services.cards,
      { ...card, repetitions: 3, intervalDays: 9 },
      { front: "c", back: "d" },
      FIXED_NOW,
    );

    expect(updated).toMatchObject({
      front: "c",
      back: "d",
      repetitions: 3,
      intervalDays: 9,
    });
  });

  it("move o cartão mantendo o progresso e recusa o mesmo baralho", async () => {
    const card = await createFlashcard(
      services.cards,
      "deck-1",
      { front: "a", back: "b" },
      options(),
    );

    const moved = await moveFlashcard(
      services.cards,
      card,
      "deck-2",
      FIXED_NOW,
    );

    expect(moved.deckId).toBe("deck-2");
    expect(await listFlashcards(services.cards, "deck-2")).toHaveLength(1);
    await expect(
      moveFlashcard(services.cards, moved, "deck-2", FIXED_NOW),
    ).rejects.toThrow("O cartão já está neste baralho");
  });

  it("anexa, troca e remove o áudio da pergunta", async () => {
    const card = await createFlashcard(
      services.cards,
      "deck-1",
      { front: "a", back: "b" },
      options(),
    );

    const withAudio = await attachCardAudio(
      services.cards,
      card,
      { name: "aula.mp3", blob: new Blob(["som"]) },
      FIXED_NOW,
    );
    expect(withAudio.frontAudioUri).toBe("aula.mp3");
    const stored = await services.cards.findAudio(card.id);
    expect(stored?.type).toBe("audio/mpeg");
    expect(stored?.data.byteLength).toBe(3);

    const withoutAudio = await removeCardAudio(
      services.cards,
      withAudio,
      FIXED_NOW,
    );
    expect(withoutAudio.frontAudioUri).toBeNull();
    expect(await services.cards.findAudio(card.id)).toBeUndefined();
  });

  it("exclui o cartão com o histórico e o áudio", async () => {
    const card = await createFlashcard(
      services.cards,
      "deck-1",
      { front: "a", back: "b" },
      options(),
    );
    await attachCardAudio(
      services.cards,
      card,
      { name: "a.mp3", blob: new Blob(["x"]) },
      FIXED_NOW,
    );

    await deleteFlashcard(services.cards, card.id);

    expect(await services.db.cards.count()).toBe(0);
    expect(await services.db.audios.count()).toBe(0);
  });
});
