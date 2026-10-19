import { useRef, useState } from "react";
import { useServices } from "../../app/ServicesProvider";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { notify } from "../../components/notifications";
import {
  BackLink,
  Button,
  ErrorState,
  PageHeader,
  Panel,
} from "../../components/ui";
import { useLanguage } from "../../i18n/LanguageProvider";
import { downloadTextFile } from "../../lib/download";
import { readAsText } from "../../lib/files";
import {
  formatBytes,
  getStorageStatus,
  requestPersistentStorage,
} from "../../lib/storage";
import { useAsyncData } from "../../lib/useAsyncData";
import {
  createBackup,
  daysSinceBackup,
  getBackupInfo,
  isBackupDue,
  type RestoreMode,
  restoreBackup,
} from "../dataTransfer/backupService";
import { type DecklyExport, parseExportData } from "../dataTransfer/format";

interface PendingRestore {
  fileName: string;
  data: DecklyExport;
}

interface PendingAudioCard {
  id: string;
  frontAudioFile?: string | null;
}

export function BackupPage() {
  const services = useServices();
  const { language, t } = useLanguage();
  const locale = language === "en" ? "en-US" : "pt-BR";
  const [pendingRestore, setPendingRestore] = useState<PendingRestore | null>(
    null,
  );
  const [mode, setMode] = useState<RestoreMode>("merge");
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [pendingAudioCards, setPendingAudioCards] = useState<
    PendingAudioCard[] | null
  >(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const info = useAsyncData(() => getBackupInfo(services), [services]);
  const storage = useAsyncData(() => getStorageStatus(), []);

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));

  async function handleDownload() {
    try {
      const backup = await createBackup(services);
      downloadTextFile(backup.fileName, backup.content);
      notify.success(t("backupDownloaded", { file: backup.fileName }));
      info.reload();
    } catch (cause) {
      notify.error(cause instanceof Error ? cause.message : t("backupError"));
    }
  }

  async function handleChooseFile(file: File) {
    try {
      const data = parseExportData(await readAsText(file));
      setMode("merge");
      setPendingRestore({ fileName: file.name, data });
    } catch (cause) {
      setPendingRestore(null);
      notify.error(cause instanceof Error ? cause.message : t("importError"));
    }
  }

  async function runRestore() {
    if (!pendingRestore) return;
    const { data } = pendingRestore;
    setConfirmReplace(false);
    try {
      await restoreBackup(services, data, mode);
      setPendingRestore(null);
      notify.success(t("restoreDone"));
      const withMissingAudio = data.cards.filter(
        (card) => card.frontAudioFile && !card.frontAudioData,
      );
      setPendingAudioCards(
        withMissingAudio.length > 0 ? withMissingAudio : null,
      );
      info.reload();
    } catch (cause) {
      notify.error(cause instanceof Error ? cause.message : t("importError"));
    }
  }

  async function handleAudioFiles(files: File[]) {
    const expected = pendingAudioCards;
    setPendingAudioCards(null);
    if (!expected) return;

    try {
      const byName = new Map(
        files.map((file) => [file.name.toLowerCase(), file]),
      );
      let linked = 0;
      for (const card of expected) {
        const file = byName.get((card.frontAudioFile ?? "").toLowerCase());
        if (!file) continue;
        await services.dataTransfer.attachCardAudio(card.id, {
          name: file.name,
          blob: file,
        });
        linked += 1;
      }
      if (linked > 0) notify.success(t("audiosLinked", { count: linked }));
      if (linked < expected.length) {
        notify.error(t("audiosMissing", { count: expected.length - linked }));
      }
    } catch (cause) {
      notify.error(cause instanceof Error ? cause.message : t("importError"));
    }
  }

  async function handleProtect() {
    const granted = await requestPersistentStorage();
    notify[granted ? "success" : "error"](
      t(granted ? "storageGranted" : "storageDenied"),
    );
    storage.reload();
  }

  const totals = info.data?.totals;
  const lastBackupAt = info.data?.lastBackupAt ?? null;
  const due = info.data ? isBackupDue(info.data, services.now()) : false;
  const days = daysSinceBackup(lastBackupAt, services.now());

  const restoreTotals = pendingRestore
    ? {
        cards: pendingRestore.data.cards.length,
        decks: pendingRestore.data.decks.length,
        groups: pendingRestore.data.groups?.length ?? 0,
        reviews: pendingRestore.data.reviews.length,
      }
    : null;

  const modeOption = (value: RestoreMode, label: string, hint: string) => (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 ${
        mode === value ? "border-primary bg-primary-muted" : "border-line"
      }`}
    >
      <input
        checked={mode === value}
        className="mt-1 accent-primary"
        name="restore-mode"
        onChange={() => setMode(value)}
        type="radio"
        value={value}
      />
      <span>
        <span className="block font-bold">{label}</span>
        <span className="block text-sm text-fg-secondary">{hint}</span>
      </span>
    </label>
  );

  return (
    <div>
      <BackLink to="/">{t("backHome")}</BackLink>
      <PageHeader subtitle={t("backupSubtitle")} title={t("backup")} />

      {info.error ? <ErrorState>{t("loadError")}</ErrorState> : null}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel
          aria-labelledby="backup-status"
          className={due ? "border-warning" : ""}
        >
          <h2 className="text-xl font-bold" id="backup-status">
            {t("backupStatus")}
          </h2>
          <p className="mt-3 font-semibold" data-testid="last-backup">
            {lastBackupAt
              ? t("lastBackupAt", { date: formatDate(lastBackupAt) })
              : t("lastBackupNever")}
          </p>
          {totals ? (
            <p className="mt-1 text-fg-secondary">
              {t("backupContents", {
                cards: totals.cards,
                decks: totals.decks,
                groups: totals.groups,
                reviews: totals.reviews,
              })}
            </p>
          ) : null}
          {due ? (
            <p className="mt-3 text-warning" role="status">
              {days === null
                ? t("backupDueNever")
                : t("backupDueOld", { days })}
            </p>
          ) : null}
          <p className="mt-3 text-sm text-fg-muted">{t("backupTip")}</p>
        </Panel>

        <Panel aria-labelledby="backup-save">
          <h2 className="text-xl font-bold" id="backup-save">
            {t("backupSaveTitle")}
          </h2>
          <p className="mt-2 leading-relaxed text-fg-secondary">
            {t("backupSaveDescription")}
          </p>
          <Button className="mt-4 w-full" onClick={() => void handleDownload()}>
            {t("downloadBackup")}
          </Button>
        </Panel>

        <Panel aria-labelledby="backup-restore" className="lg:col-span-2">
          <h2 className="text-xl font-bold" id="backup-restore">
            {t("restoreTitle")}
          </h2>
          <p className="mt-2 leading-relaxed text-fg-secondary">
            {t("restoreDescription")}
          </p>
          <input
            accept="application/json,.json"
            aria-label={t("importData")}
            className="sr-only"
            data-testid="import-input"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void handleChooseFile(file);
            }}
            ref={importInputRef}
            type="file"
          />
          <input
            accept="audio/*"
            aria-label={t("selectAudios")}
            className="sr-only"
            data-testid="audio-files-input"
            multiple
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              void handleAudioFiles(files);
            }}
            ref={audioInputRef}
            type="file"
          />
          <Button
            className="mt-4 w-full sm:w-auto"
            onClick={() => importInputRef.current?.click()}
            variant="secondary"
          >
            {t("chooseBackupFile")}
          </Button>

          {pendingRestore && restoreTotals ? (
            <div className="mt-4 rounded-2xl border border-accent bg-surface p-4">
              <p className="text-fg-secondary" data-testid="restore-preview">
                {t("restorePreview", {
                  file: pendingRestore.fileName,
                  date: formatDate(pendingRestore.data.exportedAt),
                  ...restoreTotals,
                })}
              </p>
              <fieldset className="mt-3 flex flex-col gap-2">
                <legend className="sr-only">{t("restoreModeLegend")}</legend>
                {modeOption(
                  "merge",
                  t("restoreModeMerge"),
                  t("restoreModeMergeHint"),
                )}
                {modeOption(
                  "replace",
                  t("restoreModeReplace"),
                  t("restoreModeReplaceHint"),
                )}
              </fieldset>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  className="sm:flex-1"
                  onClick={() =>
                    mode === "replace"
                      ? setConfirmReplace(true)
                      : void runRestore()
                  }
                  variant="ghost"
                >
                  {t("restoreNow")}
                </Button>
                <Button
                  className="sm:flex-1"
                  onClick={() => setPendingRestore(null)}
                  variant="secondary"
                >
                  {t("cancel")}
                </Button>
              </div>
            </div>
          ) : null}

          {pendingAudioCards ? (
            <div className="mt-4 rounded-2xl border border-accent bg-surface p-4">
              <p className="text-fg-secondary">
                {t("audiosPick", { count: pendingAudioCards.length })}
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button
                  className="sm:flex-1"
                  onClick={() => audioInputRef.current?.click()}
                  variant="ghost"
                >
                  {t("selectAudios")}
                </Button>
                <Button
                  className="sm:flex-1"
                  onClick={() => setPendingAudioCards(null)}
                  variant="secondary"
                >
                  {t("skipAudios")}
                </Button>
              </div>
            </div>
          ) : null}
        </Panel>

        <Panel aria-labelledby="backup-storage" className="lg:col-span-2">
          <h2 className="text-xl font-bold" id="backup-storage">
            {t("storageTitle")}
          </h2>
          <p className="mt-2 leading-relaxed text-fg-secondary">
            {storage.data?.persisted === true
              ? t("storageProtected")
              : storage.data?.persisted === false
                ? t("storageNotProtected")
                : t("storageUnsupported")}
          </p>
          {storage.data?.usage != null ? (
            <p className="mt-1 text-sm text-fg-muted">
              {t("storageUsage", {
                size: formatBytes(storage.data.usage, locale),
              })}
            </p>
          ) : null}
          {storage.data?.persisted === false ? (
            <Button
              className="mt-4 w-full sm:w-auto"
              onClick={() => void handleProtect()}
              variant="secondary"
            >
              {t("storageProtect")}
            </Button>
          ) : null}
        </Panel>
      </div>

      <ConfirmDialog
        confirmLabel={t("restoreConfirmButton")}
        message={t("restoreConfirmText")}
        onCancel={() => setConfirmReplace(false)}
        onConfirm={() => void runRestore()}
        open={confirmReplace}
        title={t("restoreConfirmTitle")}
      />
    </div>
  );
}
