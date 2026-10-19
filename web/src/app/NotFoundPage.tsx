import { LinkButton } from "../components/ui";
import { useLanguage } from "../i18n/LanguageProvider";

export function NotFoundPage() {
  const { t } = useLanguage();
  return (
    <div className="py-12 text-center">
      <p className="text-5xl font-extrabold text-accent">404</p>
      <p className="mt-4 text-fg-secondary">{t("notFound")}</p>
      <LinkButton className="mt-6" to="/">
        {t("goHome")}
      </LinkButton>
    </div>
  );
}
