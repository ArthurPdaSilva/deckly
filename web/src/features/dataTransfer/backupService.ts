import type { Services } from "../../app/services";
import {
  type DecklyExport,
  type ExportSettings,
  serializeExportData,
} from "./format";
import type { DataTotals } from "./repository";

export const BACKUP_REMINDER_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

type BackupServices = Pick<Services, "dataTransfer" | "algorithm" | "now">;

export type RestoreMode = "merge" | "replace";

export interface BackupInfo {
  totals: DataTotals;
  lastBackupAt: string | null;
}

export interface CreatedBackup {
  fileName: string;
  content: string;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Ex.: deckly-backup-2026-10-19-0912.json (horário local). */
export function backupFileName(date: Date): string {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `deckly-backup-${day}-${pad(date.getHours())}${pad(date.getMinutes())}.json`;
}

/** Dias inteiros desde o último backup; `null` se nunca houve um. */
export function daysSinceBackup(
  lastBackupAt: string | null,
  now: Date,
): number | null {
  if (!lastBackupAt) return null;
  const elapsed = now.getTime() - new Date(lastBackupAt).getTime();
  return Math.max(0, Math.floor(elapsed / DAY_MS));
}

/** Só lembra quem tem cartões a perder e backup ausente ou antigo. */
export function isBackupDue(info: BackupInfo, now: Date): boolean {
  if (info.totals.cards === 0) return false;
  const days = daysSinceBackup(info.lastBackupAt, now);
  return days === null || days >= BACKUP_REMINDER_DAYS;
}

export async function getBackupInfo(
  services: Pick<Services, "dataTransfer">,
): Promise<BackupInfo> {
  const [totals, lastBackupAt] = await Promise.all([
    services.dataTransfer.getTotals(),
    services.dataTransfer.getLastBackupAt(),
  ]);
  return { totals, lastBackupAt };
}

async function readSettings(
  services: Pick<Services, "algorithm">,
): Promise<ExportSettings> {
  const [algorithm, desiredRetention] = await Promise.all([
    services.algorithm.getActiveAlgorithm(),
    services.algorithm.getDesiredRetention(),
  ]);
  return { algorithm, desiredRetention };
}

/** Gera o arquivo de backup e registra a data; quem chama só precisa baixar. */
export async function createBackup(
  services: BackupServices,
): Promise<CreatedBackup> {
  const now = services.now();
  const [data, settings] = await Promise.all([
    services.dataTransfer.exportData(),
    readSettings(services),
  ]);
  const content = serializeExportData(data, now.toISOString(), settings);
  await services.dataTransfer.setLastBackupAt(now.toISOString());
  return { fileName: backupFileName(now), content };
}

/**
 * Restaura um arquivo. Em "replace" tudo é trocado de uma vez; em "merge" só
 * entra o que ainda não existe. As preferências do arquivo valem ao substituir
 * ou quando o navegador ainda estava vazio.
 */
export async function restoreBackup(
  services: Pick<Services, "dataTransfer" | "algorithm">,
  data: DecklyExport,
  mode: RestoreMode,
): Promise<void> {
  const wasEmpty = (await services.dataTransfer.getTotals()).cards === 0;

  if (mode === "replace") {
    await services.dataTransfer.replaceAllData(data);
  } else {
    await services.dataTransfer.importData(data);
  }

  if (data.settings && (mode === "replace" || wasEmpty)) {
    await services.algorithm.setActiveAlgorithm(data.settings.algorithm);
    await services.algorithm.setDesiredRetention(
      data.settings.desiredRetention,
    );
  }
}
