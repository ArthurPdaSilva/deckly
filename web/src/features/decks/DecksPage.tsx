import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useServices } from "../../app/ServicesProvider";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { ItemActionsMenu } from "../../components/ItemActionsMenu";
import { notify } from "../../components/notifications";
import { SortableList } from "../../components/SortableList";
import {
  BackLink,
  EmptyState,
  ErrorState,
  LinkButton,
  PageHeader,
} from "../../components/ui";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useAsyncData } from "../../lib/useAsyncData";
import { formatTimeUntil } from "../review/time";
import { deleteDeck, reorderDecks } from "./deckService";
import type { Deck } from "./domain";

export const UNGROUPED_ROUTE_ID = "none";

export function DecksPage() {
  const { groupId: groupParam = UNGROUPED_ROUTE_ID } = useParams();
  const groupId = groupParam === UNGROUPED_ROUTE_ID ? null : groupParam;
  const services = useServices();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [pendingDelete, setPendingDelete] = useState<Deck | null>(null);

  const { data, error, loading, setData } = useAsyncData(async () => {
    const now = services.now();
    const [groups, allDecks, summaries] = await Promise.all([
      services.groups.findAll(),
      services.decks.findAll(),
      services.reviews.findDeckSummaries(now.toISOString()),
    ]);
    return {
      now,
      group: groupId ? groups.find((item) => item.id === groupId) : undefined,
      decks: allDecks.filter((deck) => (deck.groupId ?? null) === groupId),
      summaries,
    };
  }, [services, groupId]);

  const decks = data?.decks ?? [];

  async function handleReorder(next: Deck[]) {
    setData((current) => (current ? { ...current, decks: next } : current));
    try {
      await reorderDecks(services.decks, next, services.now());
    } catch (cause) {
      notify.error(cause instanceof Error ? cause.message : t("saveError"));
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    const deck = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteDeck(services.decks, deck.id);
      setData((current) =>
        current
          ? {
              ...current,
              decks: current.decks.filter((item) => item.id !== deck.id),
            }
          : current,
      );
      notify.success(t("deleted"));
    } catch (cause) {
      notify.error(cause instanceof Error ? cause.message : t("saveError"));
    }
  }

  function describeReview(deckId: string): string {
    const summary = data?.summaries.find((item) => item.deckId === deckId);
    if (!summary || summary.nextDueAt === null) return t("noCards");
    return t("nextReview", {
      count: summary.dueCount,
      time: formatTimeUntil(
        summary.nextDueAt,
        data?.now ?? new Date(),
        language,
      ),
    });
  }

  const title = groupId ? (data?.group?.name ?? t("decks")) : t("ungrouped");
  const newDeckPath = groupId ? `/decks/new?group=${groupId}` : "/decks/new";

  if (!loading && groupId && !data?.group && !error) {
    return <ErrorState>{t("notFound")}</ErrorState>;
  }

  return (
    <div>
      <BackLink to="/groups">{t("backToGroups")}</BackLink>
      <PageHeader subtitle={t("decksSubtitle")} title={title} />

      <div className="flex flex-col gap-2 sm:flex-row">
        <LinkButton className="sm:flex-1" to={newDeckPath}>
          {t("newDeck")}
        </LinkButton>
        {groupId ? (
          <LinkButton
            className="sm:flex-1"
            to={`/review/group/${groupId}`}
            variant="secondary"
          >
            {t("reviewGroup")}
          </LinkButton>
        ) : null}
        <LinkButton className="sm:flex-1" to="/statistics" variant="secondary">
          {t("progress")}
        </LinkButton>
      </div>

      {loading && !data ? (
        <EmptyState>{t("loadingDecks")}</EmptyState>
      ) : error ? (
        <ErrorState>{t("loadError")}</ErrorState>
      ) : decks.length === 0 ? (
        <EmptyState>{t("noDecks")}</EmptyState>
      ) : (
        <SortableList
          getLabel={(deck) => deck.name}
          items={decks}
          onReorder={(next) => void handleReorder(next)}
          renderItem={(deck) => (
            <div className="flex items-start justify-between gap-2 p-2 pl-4">
              <Link
                className="min-w-0 flex-1 py-2"
                to={`/decks/${deck.id}/cards`}
              >
                <span className="block truncate text-xl font-extrabold">
                  {deck.name}
                </span>
                {deck.description ? (
                  <span className="mt-1 block text-fg-secondary">
                    {deck.description}
                  </span>
                ) : null}
                <span className="mt-1 block text-sm font-semibold text-primary">
                  {describeReview(deck.id)}
                </span>
              </Link>
              <ItemActionsMenu
                actions={[
                  {
                    label: t("review"),
                    onSelect: () => navigate(`/review/deck/${deck.id}`),
                  },
                  {
                    label: t("edit"),
                    onSelect: () => navigate(`/decks/${deck.id}/edit`),
                  },
                  {
                    label: t("delete"),
                    destructive: true,
                    onSelect: () => setPendingDelete(deck),
                  },
                ]}
                title={deck.name}
              />
            </div>
          )}
        />
      )}

      <ConfirmDialog
        confirmLabel={t("confirmDelete")}
        message={t("deleteDeckText")}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
        open={pendingDelete !== null}
        title={t("deleteDeckTitle")}
      />
    </div>
  );
}
