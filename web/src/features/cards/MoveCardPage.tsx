import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useServices } from "../../app/ServicesProvider";
import { notify } from "../../components/notifications";
import { BackLink, Button, EmptyState, ErrorState } from "../../components/ui";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useAsyncData } from "../../lib/useAsyncData";
import { moveFlashcard } from "./cardService";

export function MoveCardPage() {
  const { cardId = "" } = useParams();
  const services = useServices();
  const navigate = useNavigate();
  const { t, tError } = useLanguage();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, error, loading } = useAsyncData(async () => {
    const [card, decks] = await Promise.all([
      services.cards.findById(cardId),
      services.decks.findAll(),
    ]);
    return { card, decks };
  }, [services, cardId]);

  if (loading) return <EmptyState>{t("loadingDecks")}</EmptyState>;
  if (error || !data) return <ErrorState>{t("loadError")}</ErrorState>;
  const { card, decks } = data;
  if (!card) return <ErrorState>{t("notFound")}</ErrorState>;

  const currentDeck = decks.find((deck) => deck.id === card.deckId);
  const otherDecks = decks.filter((deck) => deck.id !== card.deckId);

  async function handleMove() {
    const target = otherDecks.find((deck) => deck.id === selectedId);
    if (!card || !target) return;
    try {
      await moveFlashcard(services.cards, card, target.id, services.now());
      notify.success(t("cardMoved", { deck: target.name }));
      navigate(`/decks/${card.deckId}/cards`);
    } catch (cause) {
      notify.error(
        cause instanceof Error ? tError(cause.message) : t("saveError"),
      );
    }
  }

  return (
    <div className="max-w-2xl">
      <BackLink to={`/decks/${card.deckId}/cards`}>{t("backToDecks")}</BackLink>
      <header className="mb-4">
        <p className="text-sm font-extrabold tracking-widest text-accent">
          {t("moveCardEyebrow")}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold">{t("moveCardTitle")}</h1>
        <p className="mt-2 text-fg-secondary">
          {t("currentDeck", { deck: currentDeck?.name ?? "" })}
        </p>
        <p className="mt-1 text-fg-secondary">{t("moveCardText")}</p>
      </header>

      {otherDecks.length === 0 ? (
        <EmptyState>{t("noOtherDecks")}</EmptyState>
      ) : (
        <fieldset>
          <legend className="sr-only">{t("moveCardTitle")}</legend>
          <ul className="flex flex-col gap-2">
            {otherDecks.map((deck) => (
              <li key={deck.id}>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 ${
                    selectedId === deck.id
                      ? "border-primary bg-primary-muted"
                      : "border-line bg-elevated"
                  }`}
                >
                  <input
                    checked={selectedId === deck.id}
                    name="target-deck"
                    onChange={() => setSelectedId(deck.id)}
                    type="radio"
                  />
                  <span className="font-semibold">{deck.name}</span>
                </label>
              </li>
            ))}
          </ul>
          <Button
            className="mt-6 w-full"
            disabled={selectedId === null}
            onClick={() => void handleMove()}
          >
            {t("move")}
          </Button>
        </fieldset>
      )}
    </div>
  );
}
