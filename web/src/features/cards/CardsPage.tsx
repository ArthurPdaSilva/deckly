import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useServices } from "../../app/ServicesProvider";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { ItemActionsMenu } from "../../components/ItemActionsMenu";
import { notify } from "../../components/notifications";
import {
  BackLink,
  EmptyState,
  ErrorState,
  LinkButton,
} from "../../components/ui";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useAsyncData } from "../../lib/useAsyncData";
import { AudioPlayButton } from "./AudioPlayButton";
import { deleteFlashcard } from "./cardService";
import type { Flashcard } from "./domain";

export function CardsPage() {
  const { deckId = "" } = useParams();
  const services = useServices();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [pendingDelete, setPendingDelete] = useState<Flashcard | null>(null);

  const { data, error, loading, setData } = useAsyncData(async () => {
    const decks = await services.decks.findAll();
    const deck = decks.find((item) => item.id === deckId);
    return {
      deck,
      cards: deck ? await services.cards.findByDeckId(deckId) : [],
    };
  }, [services, deckId]);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    const card = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteFlashcard(services.cards, card.id);
      setData((current) =>
        current
          ? {
              ...current,
              cards: current.cards.filter((item) => item.id !== card.id),
            }
          : current,
      );
      notify.success(t("deleted"));
    } catch (cause) {
      notify.error(cause instanceof Error ? cause.message : t("saveError"));
    }
  }

  if (!loading && !error && !data?.deck) {
    return <ErrorState>{t("notFound")}</ErrorState>;
  }

  const deck = data?.deck;
  const backPath = deck?.groupId
    ? `/groups/${deck.groupId}/decks`
    : "/groups/none/decks";

  return (
    <div>
      <BackLink to={backPath}>{t("backToDecks")}</BackLink>
      <header className="mb-4">
        <p className="text-sm font-extrabold tracking-widest text-accent">
          {t("cards")}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold">{deck?.name ?? ""}</h1>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row">
        <LinkButton className="sm:flex-1" to={`/review/deck/${deckId}`}>
          {t("reviewDeck")}
        </LinkButton>
        <LinkButton
          className="sm:flex-1"
          to={`/decks/${deckId}/cards/new`}
          variant="secondary"
        >
          {t("newCard")}
        </LinkButton>
      </div>

      {loading && !data ? (
        <EmptyState>{t("loadingCards")}</EmptyState>
      ) : error ? (
        <ErrorState>{t("loadError")}</ErrorState>
      ) : data?.cards.length === 0 ? (
        <EmptyState>{t("noCardsCreated")}</EmptyState>
      ) : (
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {data?.cards.map((card) => (
            <li
              className="flex items-start justify-between gap-2 rounded-3xl border border-line bg-elevated p-4"
              key={card.id}
            >
              <div className="min-w-0 flex-1">
                <Link className="block" to={`/cards/${card.id}/edit`}>
                  <span className="block text-xs font-bold uppercase tracking-wider text-fg-muted">
                    {t("front")}
                  </span>
                  <span className="mt-1 block whitespace-pre-wrap break-words">
                    {card.front}
                  </span>
                </Link>
                {card.frontAudioUri ? (
                  <AudioPlayButton cardId={card.id} />
                ) : null}
                <Link
                  className="mt-3 block border-t border-line pt-3"
                  to={`/cards/${card.id}/edit`}
                >
                  <span className="block text-xs font-bold uppercase tracking-wider text-fg-muted">
                    {t("backSide")}
                  </span>
                  <span className="mt-1 block whitespace-pre-wrap break-words">
                    {card.back}
                  </span>
                </Link>
              </div>
              <ItemActionsMenu
                actions={[
                  {
                    label: t("edit"),
                    onSelect: () => navigate(`/cards/${card.id}/edit`),
                  },
                  {
                    label: t("move"),
                    onSelect: () => navigate(`/cards/${card.id}/move`),
                  },
                  {
                    label: t("delete"),
                    destructive: true,
                    onSelect: () => setPendingDelete(card),
                  },
                ]}
                title={card.front}
              />
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        confirmLabel={t("confirmDelete")}
        message={t("deleteCardText")}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
        open={pendingDelete !== null}
        title={t("deleteCardTitle")}
      />
    </div>
  );
}
