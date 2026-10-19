import { Link } from "react-router-dom";
import { useServices } from "../../app/ServicesProvider";
import {
  BackupIcon,
  ChartIcon,
  DecksIcon,
  SettingsIcon,
} from "../../components/icons";
import { LinkButton } from "../../components/ui";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useAsyncData } from "../../lib/useAsyncData";
import {
  daysSinceBackup,
  getBackupInfo,
  isBackupDue,
} from "../dataTransfer/backupService";

const SHORTCUTS = [
  { to: "/groups", key: "myDecks", icon: DecksIcon },
  { to: "/statistics", key: "progress", icon: ChartIcon },
  { to: "/backup", key: "backup", icon: BackupIcon },
  { to: "/settings", key: "settings", icon: SettingsIcon },
] as const;

export function HomePage() {
  const services = useServices();
  const { t } = useLanguage();
  const { data: dueCount = 0 } = useAsyncData(
    () => services.reviews.countDueCards(services.now().toISOString()),
    [services],
  );
  const { data: backupInfo } = useAsyncData(
    () => getBackupInfo(services),
    [services],
  );

  const now = services.now();
  const backupDue = backupInfo ? isBackupDue(backupInfo, now) : false;
  const days = backupInfo
    ? daysSinceBackup(backupInfo.lastBackupAt, now)
    : null;

  return (
    <div>
      <p className="text-sm font-extrabold tracking-[0.2em] text-accent">
        DECKLY
      </p>
      <h1 className="mt-2 text-4xl font-extrabold">{t("home")}</h1>
      <p className="mt-2 max-w-2xl text-lg leading-relaxed text-fg-secondary">
        {t("homeSubtitle")}
      </p>

      {backupDue ? (
        <section
          aria-labelledby="home-backup-due"
          className="mt-6 flex flex-col gap-3 rounded-3xl border border-warning bg-elevated p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h2 className="font-bold" id="home-backup-due">
              {t("backupDueTitle")}
            </h2>
            <p className="mt-1 text-fg-secondary">
              {days === null
                ? t("backupDueNever")
                : t("backupDueOld", { days })}
            </p>
          </div>
          <LinkButton className="sm:shrink-0" to="/backup" variant="ghost">
            {t("backupNow")}
          </LinkButton>
        </section>
      ) : null}

      <section className="mt-8 flex flex-col gap-4 rounded-3xl border border-line bg-elevated p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8">
        <div>
          <p className="text-sm font-bold uppercase text-fg-muted">
            {t("todaySession")}
          </p>
          <p className="mt-1 text-3xl font-extrabold lg:text-4xl">
            {t("pendingCards", { count: dueCount })}
          </p>
        </div>
        <LinkButton className="sm:min-w-56" to="/review">
          {t("startReview")}
        </LinkButton>
      </section>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SHORTCUTS.map((item) => (
          <li key={item.to}>
            <Link
              className="flex h-full items-center gap-3 rounded-2xl border border-line bg-elevated px-5 py-4 font-bold text-primary hover:bg-primary-muted"
              to={item.to}
            >
              <item.icon />
              {t(item.key)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
