import { useState } from "react";
import { useServices } from "../../app/ServicesProvider";
import { BackLink, ErrorState, PageHeader, Panel } from "../../components/ui";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useAsyncData } from "../../lib/useAsyncData";

export function StatisticsPage() {
  const services = useServices();
  const { t } = useLanguage();
  const [sessionNow] = useState(() => services.now());
  const {
    data: stats,
    error,
    loading,
  } = useAsyncData(
    () => services.statistics.getDashboardStats(sessionNow),
    [services, sessionNow],
  );

  const totalRatings = stats
    ? Object.values(stats.ratingDistribution).reduce(
        (sum, count) => sum + count,
        0,
      )
    : 0;

  return (
    <div>
      <BackLink to="/groups">{t("backToDecks")}</BackLink>
      <PageHeader
        eyebrow={t("overview")}
        subtitle={t("progressSubtitle")}
        title={t("statistics")}
      />

      {loading ? (
        <p className="text-fg-secondary" role="status">
          {t("calculating")}
        </p>
      ) : error || !stats ? (
        <ErrorState>{t("loadProgressError")}</ErrorState>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { value: stats.totalCards, label: t("cardsCreated") },
              { value: stats.dueCards, label: t("dueCards") },
              {
                value: stats.averageRating.toFixed(1),
                label: t("averageRating"),
              },
              { value: stats.totalDecks, label: t("decksCount") },
            ].map((metric) => (
              <div
                className="flex flex-col-reverse rounded-2xl border border-line bg-elevated p-4"
                key={metric.label}
              >
                <dt className="mt-1 text-sm text-fg-secondary">
                  {metric.label}
                </dt>
                <dd className="text-3xl font-extrabold">{metric.value}</dd>
              </div>
            ))}
          </dl>

          <Panel className="mt-4">
            <h2 className="text-xl font-bold">
              {t("reviewsToday", { count: stats.reviewsToday })}
            </h2>
            <p className="mt-1 text-fg-secondary">{t("ratingQuestion")}</p>
            <ul className="mt-4 flex flex-col gap-3">
              {(
                [
                  [2, t("difficult")],
                  [4, t("good")],
                  [5, t("easy")],
                ] as const
              ).map(([rating, label]) => {
                const count = stats.ratingDistribution[rating];
                const width =
                  totalRatings === 0 ? 0 : (count / totalRatings) * 100;
                return (
                  <li className="flex items-center gap-3" key={rating}>
                    <span className="w-16 text-fg-secondary">{label}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-primary-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        data-testid={`rating-fill-${rating}`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-bold">{count}</span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </>
      )}
    </div>
  );
}
