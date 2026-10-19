import { beforeEach, describe, expect, it } from "vitest";
import type { Services } from "../../app/services";
import { createTestServices, FIXED_NOW, makeCard } from "../../test/helpers";
import { parseExportData, serializeExportData } from "./format";

let services: Services;
const now = FIXED_NOW.toISOString();
const AUDIO_BYTES = new Uint8Array([1, 2, 3, 250, 255]);

async function populate(target: Services) {
  await target.groups.save({
    id: "g1",
    name: "Informática",
    createdAt: now,
    updatedAt: now,
    sortOrder: 0,
  });
  await target.decks.save({
    id: "d1",
    name: "Redes",
    description: "",
    groupId: "g1",
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  });
  await target.cards.save(
    makeCard({ id: "c1", deckId: "d1", frontAudioUri: "aula.mp3" }),
  );
  await target.cards.save(
    makeCard({ id: "c2", deckId: "d1", front: "Sem áudio" }),
  );
  await target.cards.saveAudio({
    cardId: "c1",
    name: "aula.mp3",
    type: "audio/mpeg",
    data: AUDIO_BYTES.buffer.slice(0),
  });
  await target.db.reviews.add({
    id: "r1",
    cardId: "c1",
    reviewedAt: now,
    rating: 4,
    previousIntervalDays: 0,
    nextIntervalDays: 1,
    algorithm: "sm-2",
    algorithmVersion: "1",
  });
}

beforeEach(() => {
  services = createTestServices();
});

describe("exportação e importação", () => {
  it("exporta com o áudio embutido em base64 e o nome esperado", async () => {
    await populate(services);

    const data = await services.dataTransfer.exportData();
    const withAudio = data.cards.find((card) => card.id === "c1");
    const withoutAudio = data.cards.find((card) => card.id === "c2");

    expect(withAudio?.frontAudioFile).toBe("c1.mp3");
    expect(withAudio?.frontAudioData).toBe(
      btoa(String.fromCharCode(...AUDIO_BYTES)),
    );
    expect(withAudio).not.toHaveProperty("frontAudioUri");
    expect(withoutAudio?.frontAudioData).toBeNull();
    expect(data.groups).toHaveLength(1);
    expect(data.reviews).toHaveLength(1);
  });

  it("importa o que foi exportado em outro navegador, com áudio e histórico", async () => {
    await populate(services);
    const text = serializeExportData(
      await services.dataTransfer.exportData(),
      now,
    );

    const other = createTestServices();
    await other.dataTransfer.importData(parseExportData(text));

    expect(await other.db.groups.count()).toBe(1);
    expect(await other.db.decks.count()).toBe(1);
    expect(await other.db.cards.count()).toBe(2);
    expect(await other.db.reviews.get("r1")).toMatchObject({
      previousIntervalMinutes: 0,
      nextIntervalMinutes: 1440,
    });
    const audio = await other.cards.findAudio("c1");
    expect(
      Array.from(new Uint8Array(audio?.data ?? new ArrayBuffer(0))),
    ).toEqual(Array.from(AUDIO_BYTES));
    expect((await other.cards.findById("c1"))?.frontAudioUri).toBe("c1.mp3");
    expect(await other.cards.findById("c1")).not.toHaveProperty(
      "frontAudioData",
    );
  });

  it("mescla por ID sem sobrescrever registros existentes", async () => {
    await populate(services);
    await services.db.cards.update("c2", { repetitions: 7 });
    const data = await services.dataTransfer.exportData();
    data.cards = data.cards.map((card) => ({
      ...card,
      front: "alterado",
      repetitions: 0,
    }));

    await services.dataTransfer.importData(data);
    await services.dataTransfer.importData(data);

    expect(await services.db.cards.count()).toBe(2);
    expect(await services.db.cards.get("c2")).toMatchObject({
      front: "Sem áudio",
      repetitions: 7,
    });
  });

  it("aceita o arquivo do app mobile, em que o áudio vem só pelo nome do arquivo", async () => {
    const text = JSON.stringify({
      format: "deckly",
      version: 1,
      exportedAt: now,
      decks: [
        {
          id: "d1",
          name: "Aula 1",
          description: "",
          createdAt: now,
          updatedAt: now,
        },
      ],
      cards: [
        {
          ...makeCard({ id: "c1", deckId: "d1" }),
          frontAudioFile: "lesson-1.mp3",
          frontAudioData: null,
        },
      ],
      reviews: [],
    });

    await services.dataTransfer.importData(parseExportData(text));
    const imported = await services.cards.findById("c1");

    expect(imported?.frontAudioUri).toBeNull();
    expect(imported?.schedulerAlgorithm).toBe("sm-2");

    await services.dataTransfer.attachCardAudio("c1", {
      name: "lesson-1.mp3",
      blob: new Blob(["som"]),
    });
    expect((await services.cards.findById("c1"))?.frontAudioUri).toBe(
      "lesson-1.mp3",
    );
    expect((await services.cards.findAudio("c1"))?.type).toBe("audio/mpeg");
  });

  it("apaga tudo, mas mantém as configurações", async () => {
    await populate(services);
    await services.algorithm.setActiveAlgorithm("fsrs");

    await services.dataTransfer.deleteAllData();

    expect(await services.db.groups.count()).toBe(0);
    expect(await services.db.decks.count()).toBe(0);
    expect(await services.db.cards.count()).toBe(0);
    expect(await services.db.reviews.count()).toBe(0);
    expect(await services.db.audios.count()).toBe(0);
    expect(await services.algorithm.getActiveAlgorithm()).toBe("fsrs");
  });
});
