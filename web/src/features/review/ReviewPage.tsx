import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useServices } from "../../app/ServicesProvider";
import { notify } from "../../components/notifications";
import { BackLink, Button, Panel } from "../../components/ui";
import { useLanguage } from "../../i18n/LanguageProvider";
import { AudioPlayButton } from "../cards/AudioPlayButton";
import type { Flashcard } from "../cards/domain";
import type { ReviewRating, SchedulerAlgorithm } from "./domain";
import { DEFAULT_RETENTION } from "./retention";
import { createScheduler } from "./schedulerFactory";
import { advanceQueue, RATING_BUTTONS, toReviewState } from "./session";
import { formatCompactReviewInterval } from "./time";

interface Session {
  cards: Flashcard[];
  totalCards: number;
  algorithm: SchedulerAlgorithm;
  retention: number;
  label: string | null;
}

export function ReviewPage() {
  const { deckId, groupId } = useParams();
  const services = useServices();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [sessionNow] = useState(() => services.now());
  const [session, setSession] = useState<Session | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [shownAt, setShownAt] = useState(sessionNow);
  const [flipped, setFlipped] = useState(false);
  const [saving, setSaving] = useState(false);

  const backPath = deckId
    ? `/decks/${deckId}/cards`
    : groupId
      ? `/groups/${groupId}/decks`
      : "/";

  useEffect(() => {
    let active = true;

    async function load() {
      const [dueCards, algorithm, retention, decks, groups] = await Promise.all(
        [
          services.reviews.findDueCards(
            sessionNow.toISOString(),
            deckId,
            groupId,
          ),
          services.algorithm.getActiveAlgorithm(),
          services.algorithm.getDesiredRetention(),
          services.decks.findAll(),
          services.groups.findAll(),
        ],
      );
      const label = deckId
        ? (decks.find((deck) => deck.id === deckId)?.name ?? null)
        : groupId
          ? (groups.find((group) => group.id === groupId)?.name ?? null)
          : null;
      if (active) {
        setSession({
          cards: dueCards,
          totalCards: dueCards.length,
          algorithm,
          retention: retention ?? DEFAULT_RETENTION,
          label,
        });
      }
    }

    load().catch(() => {
      if (active) setLoadFailed(true);
    });
    return () => {
      active = false;
    };
  }, [services, deckId, groupId, sessionNow]);

  const currentCard = session?.cards[0];

  const previews = useMemo(() => {
    if (!session || !currentCard || !flipped) return null;
    const scheduler = createScheduler(session.algorithm, {
      retention: session.retention,
    });
    return RATING_BUTTONS.map((button) => {
      const { nextState } = scheduler.schedule(
        toReviewState(currentCard),
        button.rating,
        shownAt,
      );
      return formatCompactReviewInterval(
        nextState.intervalMinutes ?? nextState.intervalDays * 1440,
      );
    });
  }, [session, currentCard, flipped, shownAt]);

  async function handleRate(rating: ReviewRating) {
    if (!session || !currentCard || saving) return;

    setSaving(true);
    try {
      const reviewedAt = services.now();
      const result = createScheduler(session.algorithm, {
        retention: session.retention,
      }).schedule(toReviewState(currentCard), rating, reviewedAt);

      await services.reviews.recordReview(
        currentCard.id,
        services.createId(),
        result.nextState,
        result.review,
      );

      setSession({
        ...session,
        cards: advanceQueue(session.cards, result.nextState, reviewedAt),
      });
      setShownAt(services.now());
      setFlipped(false);
      notify.success(t("reviewRegistered"));
    } catch (cause) {
      notify.error(cause instanceof Error ? cause.message : t("reviewError"));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!flipped) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const button = RATING_BUTTONS[Number(event.key) - 1];
      if (button) void handleRate(button.rating);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  const totalCards = session?.totalCards ?? 0;
  const remaining = session?.cards.length ?? 0;
  const reviewedCount = totalCards - remaining;
  const progressPercent =
    totalCards === 0 ? 0 : Math.round((reviewedCount / totalCards) * 100);

  const eyebrow = deckId
    ? `REVISÃO • ${(session?.label ?? "").toUpperCase()}`
    : groupId
      ? `GRUPO • ${(session?.label ?? "").toUpperCase()}`
      : t("todaySession").toUpperCase();

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink to={backPath}>{t("back")}</BackLink>
      <p className="text-sm font-extrabold tracking-widest text-accent">
        {eyebrow}
      </p>
      <h1 className="mt-1 text-3xl font-extrabold">{t("review")}</h1>

      {loadFailed ? (
        <p className="mt-6 text-danger" role="alert">
          {t("loadError")}
        </p>
      ) : !session ? (
        <p className="mt-6 text-fg-secondary" role="status">
          {t("reviewPreparing")}
        </p>
      ) : currentCard ? (
        <>
          <div className="mt-6 flex items-center justify-between">
            <p className="font-semibold text-fg-secondary">
              {t("cardProgress", {
                current: reviewedCount + 1,
                total: totalCards,
              })}
            </p>
            <p className="font-extrabold text-primary">{`${progressPercent}%`}</p>
          </div>
          <p className="mt-2 text-sm text-fg-muted">
            {t("estimatedTime", {
              minutes: Math.max(1, Math.ceil(remaining * 0.5)),
            })}
          </p>
          <div
            aria-label={t("review")}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progressPercent}
            className="mt-2 h-2 overflow-hidden rounded-full bg-primary-muted"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              data-testid="review-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <Panel
            className={`mt-8 p-8 ${flipped ? "flip-in" : ""}`}
            key={`${currentCard.id}-${flipped}`}
          >
            <p className="text-sm font-bold uppercase tracking-wider text-fg-muted">
              {flipped ? t("backSide") : t("front")}
            </p>
            <p className="mt-4 whitespace-pre-wrap break-words text-2xl leading-relaxed">
              {flipped ? currentCard.back : currentCard.front}
            </p>
            {!flipped && currentCard.frontAudioUri ? (
              <AudioPlayButton cardId={currentCard.id} />
            ) : null}
            <Button
              className="mt-6 w-full"
              onClick={() => setFlipped((current) => !current)}
              variant="secondary"
            >
              {`↻ ${t("flipCard")}`}
            </Button>
            {flipped ? (
              <div className="mt-6 grid grid-cols-4 gap-2">
                {RATING_BUTTONS.map((button, index) => (
                  <button
                    className={`${button.color} flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 font-extrabold text-white transition active:scale-[0.98] disabled:opacity-50`}
                    disabled={saving}
                    key={button.key}
                    onClick={() => void handleRate(button.rating)}
                    type="button"
                  >
                    <span className="text-sm">{t(button.key)}</span>
                    <span className="text-xs font-semibold">
                      {previews?.[index]}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </Panel>
        </>
      ) : totalCards > 0 ? (
        <Panel
          className="mt-8 text-center"
          data-testid="review-completion-card"
        >
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success text-2xl font-extrabold text-on-primary">
            ✓
          </div>
          <h2 className="mt-4 text-2xl font-bold">{t("completed")}</h2>
          <p className="mt-2 text-fg-secondary">
            {t("reviewedCards", {
              count: totalCards,
              label:
                language === "en"
                  ? totalCards === 1
                    ? "card"
                    : "cards"
                  : totalCards === 1
                    ? "cartão"
                    : "cartões",
              suffix: language === "en" ? "" : totalCards === 1 ? "" : "s",
            })}
          </p>
          <Button className="mt-6 w-full" onClick={() => navigate(backPath)}>
            {t("backToDecksPlain")}
          </Button>
        </Panel>
      ) : (
        <p className="mt-6 text-fg-secondary">{t("allReviewed")}</p>
      )}
    </div>
  );
}
