import type { Table } from "dexie";
import type { DecklyDatabase } from "../../db/database";
import {
  arrayBufferToBase64,
  audioExtension,
  audioMimeType,
  base64ToArrayBuffer,
} from "../../lib/base64";
import { readAsArrayBuffer } from "../../lib/files";
import type { Flashcard } from "../cards/domain";
import type { Deck } from "../decks/domain";
import type { ExportCollections } from "./format";

/** Remove os campos que só existem no arquivo de exportação. */
function toStoredCard(card: Flashcard): Flashcard {
  const { frontAudioFile, frontAudioData, ...stored } = card;
  return {
    ...stored,
    frontAudioUri: frontAudioData ? (frontAudioFile ?? "audio.mp3") : null,
    intervalMinutes: card.intervalMinutes ?? card.intervalDays * 1440,
    schedulerAlgorithm: card.schedulerAlgorithm ?? "sm-2",
    fsrsStability: card.fsrsStability ?? 0,
    fsrsDifficulty: card.fsrsDifficulty ?? 0,
    fsrsState: card.fsrsState ?? 0,
    fsrsLapses: card.fsrsLapses ?? 0,
    fsrsLearningSteps: card.fsrsLearningSteps ?? 0,
    fsrsLastReviewAt: card.fsrsLastReviewAt ?? null,
  };
}

async function missingIds<T extends { id: string }>(
  table: Table<T, string>,
  items: T[],
): Promise<T[]> {
  const existing = await table.bulkGet(items.map((item) => item.id));
  return items.filter((_, index) => existing[index] === undefined);
}

const LAST_BACKUP_KEY = "lastBackupAt";

export interface DataTotals {
  groups: number;
  decks: number;
  cards: number;
  reviews: number;
  audios: number;
}

export function createDataTransferRepository(db: DecklyDatabase) {
  async function clearAll(): Promise<void> {
    await Promise.all([
      db.reviews.clear(),
      db.audios.clear(),
      db.cards.clear(),
      db.decks.clear(),
      db.groups.clear(),
    ]);
  }

  async function mergeAll(data: ExportCollections): Promise<void> {
    await db.groups.bulkAdd(await missingIds(db.groups, data.groups ?? []));
    await db.decks.bulkAdd(
      await missingIds(
        db.decks,
        data.decks.map(
          (deck): Deck => ({
            ...deck,
            groupId: deck.groupId ?? null,
            sortOrder: deck.sortOrder ?? 0,
          }),
        ),
      ),
    );

    const newCards = await missingIds(db.cards, data.cards);
    await db.cards.bulkAdd(newCards.map(toStoredCard));
    for (const card of newCards) {
      if (!card.frontAudioData) continue;
      const name = card.frontAudioFile ?? "audio.mp3";
      await db.audios.put({
        cardId: card.id,
        name,
        type: audioMimeType(name),
        data: base64ToArrayBuffer(card.frontAudioData),
      });
    }

    await db.reviews.bulkAdd(
      (await missingIds(db.reviews, data.reviews)).map((review) => ({
        ...review,
        previousIntervalMinutes:
          review.previousIntervalMinutes ?? review.previousIntervalDays * 1440,
        nextIntervalMinutes:
          review.nextIntervalMinutes ?? review.nextIntervalDays * 1440,
      })),
    );
  }

  const dataTables = [db.groups, db.decks, db.cards, db.reviews, db.audios];

  return {
    async exportData(): Promise<ExportCollections> {
      const [groups, decks, cards, reviews, audios] = await Promise.all([
        db.groups.toArray(),
        db.decks.toArray(),
        db.cards.toArray(),
        db.reviews.toArray(),
        db.audios.toArray(),
      ]);
      const audioByCard = new Map(audios.map((audio) => [audio.cardId, audio]));

      const exportedCards = await Promise.all(
        [...cards]
          .sort((first, second) =>
            first.createdAt.localeCompare(second.createdAt),
          )
          .map(async (card) => {
            const audio = audioByCard.get(card.id);
            const { frontAudioUri: _uri, ...rest } = card;
            return {
              ...rest,
              frontAudioFile: audio
                ? `${card.id}${audioExtension(audio.name)}`
                : null,
              frontAudioData: audio ? arrayBufferToBase64(audio.data) : null,
            } satisfies Flashcard;
          }),
      );

      return {
        groups: [...groups].sort(
          (first, second) =>
            first.sortOrder - second.sortOrder ||
            first.name.localeCompare(second.name),
        ),
        decks: [...decks].sort((first, second) =>
          first.createdAt.localeCompare(second.createdAt),
        ),
        cards: exportedCards,
        reviews: [...reviews].sort((first, second) =>
          first.reviewedAt.localeCompare(second.reviewedAt),
        ),
      };
    },

    /** Apaga baralhos, grupos, cartões, áudios e histórico; mantém as configurações. */
    async deleteAllData(): Promise<void> {
      await db.transaction("rw", dataTables, clearAll);
    },

    /** Vincula um áudio a um cartão já importado. */
    async attachCardAudio(
      cardId: string,
      file: { name: string; blob: Blob },
    ): Promise<void> {
      const data = await readAsArrayBuffer(file.blob);
      const type = file.blob.type || audioMimeType(file.name);
      await db.transaction("rw", db.cards, db.audios, async () => {
        await db.audios.put({ cardId, name: file.name, type, data });
        await db.cards.update(cardId, { frontAudioUri: file.name });
      });
    },

    /** Mescla por ID: registros que já existem são mantidos como estão. */
    async importData(data: ExportCollections): Promise<void> {
      await db.transaction("rw", dataTables, () => mergeAll(data));
    },

    /** Troca tudo pelo conteúdo do arquivo, na mesma transação (ou tudo, ou nada). */
    async replaceAllData(data: ExportCollections): Promise<void> {
      await db.transaction("rw", dataTables, async () => {
        await clearAll();
        await mergeAll(data);
      });
    },

    async getTotals(): Promise<DataTotals> {
      const [groups, decks, cards, reviews, audios] = await Promise.all([
        db.groups.count(),
        db.decks.count(),
        db.cards.count(),
        db.reviews.count(),
        db.audios.count(),
      ]);
      return { groups, decks, cards, reviews, audios };
    },

    async getLastBackupAt(): Promise<string | null> {
      const row = await db.settings.get(LAST_BACKUP_KEY);
      return row?.value ?? null;
    },

    async setLastBackupAt(isoDate: string): Promise<void> {
      await db.settings.put({ key: LAST_BACKUP_KEY, value: isoDate });
    },
  };
}
