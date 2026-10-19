import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { reorderDeckGroups } from "./deckService";
import type { DeckGroup } from "./domain";

export function GroupsPage() {
  const services = useServices();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [pendingDelete, setPendingDelete] = useState<DeckGroup | null>(null);

  const { data, error, loading, setData } = useAsyncData(async () => {
    const [groups, decks] = await Promise.all([
      services.groups.findAll(),
      services.decks.findAll(),
    ]);
    return { groups, hasUngroupedDecks: decks.some((deck) => !deck.groupId) };
  }, [services]);

  const groups = data?.groups ?? [];

  async function handleReorder(next: DeckGroup[]) {
    setData((current) => (current ? { ...current, groups: next } : current));
    try {
      await reorderDeckGroups(services.groups, next, services.now());
    } catch (cause) {
      notify.error(cause instanceof Error ? cause.message : t("saveError"));
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    const group = pendingDelete;
    setPendingDelete(null);
    try {
      await services.groups.remove(group.id);
      setData((current) =>
        current
          ? {
              groups: current.groups.filter((item) => item.id !== group.id),
              // Os baralhos do grupo excluído passam a ficar sem grupo.
              hasUngroupedDecks: true,
            }
          : current,
      );
      notify.success(t("deleted"));
    } catch (cause) {
      notify.error(cause instanceof Error ? cause.message : t("saveError"));
    }
  }

  return (
    <div>
      <BackLink to="/">{t("backHome")}</BackLink>
      <PageHeader subtitle={t("groupsSubtitle")} title={t("groups")} />
      <LinkButton className="w-full sm:w-auto" to="/groups/new">
        {t("newGroup")}
      </LinkButton>

      {loading && !data ? (
        <EmptyState>{t("loadingDecks")}</EmptyState>
      ) : error ? (
        <ErrorState>{t("loadError")}</ErrorState>
      ) : (
        <>
          <SortableList
            getLabel={(group) => group.name}
            items={groups}
            onReorder={(next) => void handleReorder(next)}
            renderItem={(group) => (
              <div className="flex items-center justify-between gap-2 p-2 pl-4">
                <Link
                  className="min-w-0 flex-1 truncate py-3 text-xl font-extrabold hover:underline"
                  to={`/groups/${group.id}/decks`}
                >
                  {group.name}
                </Link>
                <ItemActionsMenu
                  actions={[
                    {
                      label: t("edit"),
                      onSelect: () => navigate(`/groups/${group.id}/edit`),
                    },
                    {
                      label: t("delete"),
                      destructive: true,
                      onSelect: () => setPendingDelete(group),
                    },
                  ]}
                  title={group.name}
                />
              </div>
            )}
          />
          {data?.hasUngroupedDecks ? (
            <Link
              className="mt-3 block rounded-3xl border border-line bg-elevated px-6 py-5 text-xl font-extrabold hover:underline"
              to="/groups/none/decks"
            >
              {t("ungrouped")}
            </Link>
          ) : groups.length === 0 ? (
            <EmptyState>{t("noGroups")}</EmptyState>
          ) : null}
        </>
      )}

      <ConfirmDialog
        confirmLabel={t("confirmDelete")}
        message={t("deleteGroupText")}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
        open={pendingDelete !== null}
        title={t("deleteGroupTitle")}
      />
    </div>
  );
}
