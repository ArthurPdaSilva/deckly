import { beforeEach, describe, expect, it } from "vitest";
import type { Services } from "../../app/services";
import { createTestServices, FIXED_NOW, makeCard } from "../../test/helpers";
import {
  createDeck,
  createDeckGroup,
  deleteDeck,
  moveDeck,
  renameDeckGroup,
  reorderDeckGroups,
  reorderDecks,
  updateDeck,
} from "./deckService";

let services: Services;
const options = () => ({ now: FIXED_NOW, createId: services.createId });

beforeEach(() => {
  services = createTestServices();
});

describe("baralhos", () => {
  it("cria um baralho com nome aparado e sem grupo por padrão", async () => {
    const deck = await createDeck(
      services.decks,
      { name: "  Informática  ", description: " Redes " },
      options(),
    );

    expect(deck).toMatchObject({ name: "Informática", description: "Redes" });
    expect(await services.decks.findAll()).toHaveLength(1);
  });

  it("recusa baralho sem nome", async () => {
    await expect(
      createDeck(services.decks, { name: "   " }, options()),
    ).rejects.toThrow("O nome do baralho não pode ficar vazio");
    await expect(
      updateDeck(
        services.decks,
        await createDeck(services.decks, { name: "A" }, options()),
        { name: "" },
        FIXED_NOW,
      ),
    ).rejects.toThrow("O nome do baralho não pode ficar vazio");
  });

  it("atualiza nome e descrição preservando o grupo", async () => {
    const deck = await createDeck(
      services.decks,
      { name: "A", groupId: "g" },
      options(),
    );
    const updated = await updateDeck(
      services.decks,
      deck,
      { name: "B", description: "nova" },
      FIXED_NOW,
    );

    expect(updated).toMatchObject({
      name: "B",
      description: "nova",
      groupId: "g",
    });
  });

  it("move o baralho de grupo e reordena a lista", async () => {
    const first = await createDeck(
      services.decks,
      { name: "A", sortOrder: 0 },
      options(),
    );
    const second = await createDeck(
      services.decks,
      { name: "B", sortOrder: 1 },
      options(),
    );

    const moved = await moveDeck(services.decks, first, "g2", 4, FIXED_NOW);
    await reorderDecks(services.decks, [second, moved], FIXED_NOW);

    const decks = await services.decks.findAll();
    expect(decks.map((deck) => deck.name)).toEqual(["B", "A"]);
    expect(decks[1]).toMatchObject({ groupId: "g2", sortOrder: 1 });
  });

  it("exclui o baralho junto com cartões, áudio e histórico", async () => {
    const deck = await createDeck(services.decks, { name: "A" }, options());
    await services.cards.save(makeCard({ id: "c1", deckId: deck.id }));
    await services.cards.saveAudio({
      cardId: "c1",
      name: "a.mp3",
      type: "audio/mpeg",
      data: new ArrayBuffer(1),
    });
    await services.db.reviews.add({
      id: "r1",
      cardId: "c1",
      reviewedAt: FIXED_NOW.toISOString(),
      rating: 4,
      previousIntervalDays: 0,
      nextIntervalDays: 1,
      algorithm: "sm-2",
      algorithmVersion: "1",
    });

    await deleteDeck(services.decks, deck.id);

    expect(await services.db.cards.count()).toBe(0);
    expect(await services.db.audios.count()).toBe(0);
    expect(await services.db.reviews.count()).toBe(0);
  });
});

describe("grupos", () => {
  it("cria, renomeia e reordena grupos", async () => {
    const first = await createDeckGroup(services.groups, " Direito ", {
      ...options(),
      sortOrder: 0,
    });
    const second = await createDeckGroup(services.groups, "Informática", {
      ...options(),
      sortOrder: 1,
    });

    const renamed = await renameDeckGroup(
      services.groups,
      first,
      "Constitucional",
      FIXED_NOW,
    );
    await reorderDeckGroups(services.groups, [second, renamed], FIXED_NOW);

    const groups = await services.groups.findAll();
    expect(groups.map((group) => group.name)).toEqual([
      "Informática",
      "Constitucional",
    ]);
  });

  it("recusa grupo sem nome", async () => {
    await expect(
      createDeckGroup(services.groups, " ", { ...options(), sortOrder: 0 }),
    ).rejects.toThrow("O nome do grupo não pode ficar vazio");
  });

  it("ao excluir o grupo, os baralhos ficam sem grupo", async () => {
    const group = await createDeckGroup(services.groups, "G", {
      ...options(),
      sortOrder: 0,
    });
    await createDeck(
      services.decks,
      { name: "A", groupId: group.id },
      options(),
    );

    await services.groups.remove(group.id);

    const [deck] = await services.decks.findAll();
    expect(deck?.groupId).toBeNull();
    expect(await services.groups.findAll()).toEqual([]);
  });
});
