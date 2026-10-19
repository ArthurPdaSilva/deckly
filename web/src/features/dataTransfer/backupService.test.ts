import { describe, expect, it } from "vitest";
import { createTestServices, seedBasicData } from "../../test/helpers";
import {
  backupFileName,
  createBackup,
  daysSinceBackup,
  getBackupInfo,
  isBackupDue,
  restoreBackup,
} from "./backupService";
import { parseExportData } from "./format";

describe("backupService", () => {
  it("monta o nome do arquivo com data e hora locais", () => {
    expect(backupFileName(new Date(2026, 9, 19, 9, 5))).toBe(
      "deckly-backup-2026-10-19-0905.json",
    );
  });

  it("calcula os dias desde o último backup", () => {
    const now = new Date("2026-10-19T12:00:00.000Z");
    expect(daysSinceBackup(null, now)).toBeNull();
    expect(daysSinceBackup("2026-10-12T11:00:00.000Z", now)).toBe(7);
    expect(daysSinceBackup("2026-10-19T11:00:00.000Z", now)).toBe(0);
  });

  it("só lembra com cartões e backup ausente ou de 7 dias ou mais", () => {
    const now = new Date("2026-10-19T12:00:00.000Z");
    const totals = { groups: 0, decks: 0, cards: 1, reviews: 0, audios: 0 };
    expect(isBackupDue({ totals, lastBackupAt: null }, now)).toBe(true);
    expect(
      isBackupDue({ totals, lastBackupAt: "2026-10-13T12:00:00.000Z" }, now),
    ).toBe(false);
    expect(
      isBackupDue({ totals, lastBackupAt: "2026-10-12T12:00:00.000Z" }, now),
    ).toBe(true);
    expect(
      isBackupDue({ totals: { ...totals, cards: 0 }, lastBackupAt: null }, now),
    ).toBe(false);
  });

  it("faz o ciclo completo: backup, apagar tudo e restaurar sem perder o progresso", async () => {
    const source = createTestServices();
    await seedBasicData(source);
    await source.db.cards.update("card-1", {
      repetitions: 4,
      intervalDays: 12,
    });
    await source.algorithm.setActiveAlgorithm("fsrs");
    const backup = await createBackup(source);

    const target = createTestServices();
    await restoreBackup(target, parseExportData(backup.content), "merge");

    expect((await target.db.cards.get("card-1"))?.repetitions).toBe(4);
    expect(await target.algorithm.getActiveAlgorithm()).toBe("fsrs");
    expect((await getBackupInfo(source)).lastBackupAt).not.toBeNull();
    expect((await getBackupInfo(target)).totals.cards).toBe(2);
  });
});
