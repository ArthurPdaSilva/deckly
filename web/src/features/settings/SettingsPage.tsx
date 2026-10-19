import { useEffect, useState } from "react";
import { useServices } from "../../app/ServicesProvider";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { notify } from "../../components/notifications";
import {
  BackLink,
  Button,
  LinkButton,
  PageHeader,
  Panel,
} from "../../components/ui";
import { isDevelopmentModeEnabled } from "../../config/development";
import { resetAndSeedDatabase } from "../../db/seed";
import { useLanguage } from "../../i18n/LanguageProvider";
import { LANGUAGES, type Language } from "../../i18n/translations";
import { useTheme } from "../../theme/ThemeProvider";
import type { SchedulerAlgorithm } from "../review/domain";
import { clampRetention, DEFAULT_RETENTION } from "../review/retention";

const LANGUAGE_LABELS: Record<Language, string> = {
  "pt-BR": "Português (Brasil)",
  en: "English",
};

type Confirmation = "algorithm" | "reset" | "deleteAll" | "seed" | null;

export function SettingsPage() {
  const services = useServices();
  const { mode, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [algorithm, setAlgorithm] = useState<SchedulerAlgorithm>("sm-2");
  const [pendingAlgorithm, setPendingAlgorithm] =
    useState<SchedulerAlgorithm | null>(null);
  const [retention, setRetention] = useState(DEFAULT_RETENTION);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);

  useEffect(() => {
    void services.algorithm.getActiveAlgorithm().then(setAlgorithm);
    void services.algorithm.getDesiredRetention().then(setRetention);
  }, [services]);

  async function changeRetention(delta: number) {
    const next = clampRetention(Math.round((retention + delta) * 100) / 100);
    setRetention(next);
    await services.algorithm.setDesiredRetention(next);
    notify.success(t("retentionUpdated"));
  }

  async function confirmAlgorithmChange() {
    if (!pendingAlgorithm) return;
    await services.algorithm.setActiveAlgorithm(pendingAlgorithm);
    setAlgorithm(pendingAlgorithm);
    setPendingAlgorithm(null);
    notify.success(t("algorithmUpdated"));
  }

  async function confirmReset() {
    setConfirmation(null);
    await services.algorithm.resetSchedule(
      algorithm,
      services.now().toISOString(),
    );
    notify.success(t("scheduleReset"));
  }

  async function handleDeleteAll() {
    setConfirmation(null);
    try {
      await services.dataTransfer.deleteAllData();
      notify.success(t("allDataDeleted"));
    } catch (cause) {
      notify.error(
        cause instanceof Error ? cause.message : t("deleteAllError"),
      );
    }
  }

  async function handleSeed() {
    setConfirmation(null);
    try {
      await resetAndSeedDatabase(services.db, services.now());
      notify.success(t("dataImported"));
    } catch (cause) {
      notify.error(cause instanceof Error ? cause.message : t("seedLoadError"));
    }
  }

  const optionButton = (active: boolean) =>
    `flex-1 rounded-xl border px-3 py-2 font-bold ${
      active
        ? "border-primary bg-primary-muted text-fg"
        : "border-line text-fg-secondary hover:bg-primary-muted"
    }`;

  return (
    <div>
      <BackLink to="/">{t("backHome")}</BackLink>
      <PageHeader subtitle={t("preferences")} title={t("settings")} />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel aria-labelledby="settings-appearance">
          <h2 className="text-xl font-bold" id="settings-appearance">
            {t("appearance")}
          </h2>
          <Button className="mt-4 w-full" onClick={toggleTheme} variant="ghost">
            {mode === "dark" ? t("useLight") : t("useDark")}
          </Button>
        </Panel>

        <Panel aria-labelledby="settings-language">
          <h2 className="text-xl font-bold" id="settings-language">
            {t("language")}
          </h2>
          <div className="mt-4 flex gap-2">
            {LANGUAGES.map((option) => (
              <button
                aria-pressed={language === option}
                className={optionButton(language === option)}
                key={option}
                onClick={() => setLanguage(option)}
                type="button"
              >
                {LANGUAGE_LABELS[option]}
              </button>
            ))}
          </div>
        </Panel>

        <Panel aria-labelledby="settings-algorithm" className="lg:row-span-2">
          <h2 className="text-xl font-bold" id="settings-algorithm">
            {t("algorithm")}
          </h2>
          <p className="mt-2 leading-relaxed text-fg-secondary">
            {t("algorithmDescription")}
          </p>
          <div className="mt-4 flex gap-2">
            {(["sm-2", "fsrs"] as const).map((option) => (
              <button
                aria-pressed={algorithm === option}
                className={optionButton(algorithm === option)}
                key={option}
                onClick={() => setPendingAlgorithm(option)}
                type="button"
              >
                {option === "sm-2" ? "SM-2" : "FSRS"}
              </button>
            ))}
          </div>

          {pendingAlgorithm && pendingAlgorithm !== algorithm ? (
            <div className="mt-4 rounded-2xl border border-accent bg-surface p-4">
              <p className="text-fg-secondary">
                {t("algorithmConfirm", {
                  algorithm: pendingAlgorithm.toUpperCase(),
                })}
              </p>
              <Button
                className="mt-3 w-full"
                onClick={() => void confirmAlgorithmChange()}
                variant="ghost"
              >
                {t("confirmChange")}
              </Button>
              <Button
                className="mt-2 w-full"
                onClick={() => setPendingAlgorithm(null)}
                variant="secondary"
              >
                {t("cancel")}
              </Button>
            </div>
          ) : null}

          {algorithm === "fsrs" ? (
            <div className="mt-4 rounded-2xl border border-accent bg-surface p-4">
              <h3 className="text-lg font-bold">{t("retention")}</h3>
              <p className="mt-1 text-fg-secondary">
                {t("retentionDescription")}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  aria-label={t("decreaseRetention")}
                  className={optionButton(false)}
                  onClick={() => void changeRetention(-0.01)}
                  type="button"
                >
                  −
                </button>
                <output
                  className={`${optionButton(false)} text-center`}
                  data-testid="retention-value"
                >{`${Math.round(retention * 100)}%`}</output>
                <button
                  aria-label={t("increaseRetention")}
                  className={optionButton(false)}
                  onClick={() => void changeRetention(0.01)}
                  type="button"
                >
                  +
                </button>
              </div>
            </div>
          ) : null}

          <Button
            className="mt-4 w-full"
            onClick={() => setConfirmation("reset")}
            variant="secondary"
          >
            {t("resetSchedule")}
          </Button>
        </Panel>

        <Panel aria-labelledby="settings-data">
          <h2 className="text-xl font-bold" id="settings-data">
            {t("localData")}
          </h2>
          <p className="mt-1 text-sm text-fg-muted">{t("localOnly")}</p>
          <p className="mt-2 text-fg-secondary">{t("backupSettingsHint")}</p>
          <LinkButton className="mt-4 w-full" to="/backup" variant="secondary">
            {t("openBackup")}
          </LinkButton>
          <Button
            className="mt-2 w-full"
            onClick={() => setConfirmation("deleteAll")}
            variant="secondary"
          >
            {t("deleteAll")}
          </Button>
        </Panel>

        {isDevelopmentModeEnabled() ? (
          <Panel aria-labelledby="settings-test-data">
            <h2 className="text-xl font-bold" id="settings-test-data">
              {t("testData")}
            </h2>
            <p className="mt-2 text-fg-secondary">{t("testDataDescription")}</p>
            <Button
              className="mt-4 w-full"
              onClick={() => setConfirmation("seed")}
              variant="secondary"
            >
              {t("loadTestData")}
            </Button>
          </Panel>
        ) : null}
      </div>

      <ConfirmDialog
        confirmLabel={t("confirmReset")}
        destructive={false}
        message={t("resetDescription")}
        onCancel={() => setConfirmation(null)}
        onConfirm={() => void confirmReset()}
        open={confirmation === "reset"}
        title={t("resetSchedule")}
      />
      <ConfirmDialog
        confirmLabel={t("confirmDeleteAll")}
        message={t("deleteAllDescription")}
        onCancel={() => setConfirmation(null)}
        onConfirm={() => void handleDeleteAll()}
        open={confirmation === "deleteAll"}
        title={t("deleteAll")}
      />
      <ConfirmDialog
        confirmLabel={t("confirm")}
        message={t("seedDescription")}
        onCancel={() => setConfirmation(null)}
        onConfirm={() => void handleSeed()}
        open={confirmation === "seed"}
        title={t("testData")}
      />
    </div>
  );
}
