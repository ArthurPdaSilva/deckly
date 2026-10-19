export interface StorageStatus {
  /** `null` quando o navegador não informa. */
  persisted: boolean | null;
  usage: number | null;
}

export async function getStorageStatus(): Promise<StorageStatus> {
  try {
    const storage = navigator.storage;
    if (!storage) return { persisted: null, usage: null };
    const persisted = storage.persisted ? await storage.persisted() : null;
    const estimate = storage.estimate ? await storage.estimate() : null;
    return { persisted, usage: estimate?.usage ?? null };
  } catch {
    return { persisted: null, usage: null };
  }
}

/** Pede ao navegador para não apagar os dados do Deckly sozinho. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

export function formatBytes(bytes: number, locale: string): string {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = unit === 0 ? 0 : 1;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value)} ${units[unit]}`;
}
