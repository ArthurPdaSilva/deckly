import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useServices } from "../../app/ServicesProvider";
import { TextAreaField } from "../../components/fields";
import { notify } from "../../components/notifications";
import {
  BackLink,
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
} from "../../components/ui";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useAsyncData } from "../../lib/useAsyncData";
import {
  attachCardAudio,
  createFlashcard,
  removeCardAudio,
  updateFlashcard,
} from "./cardService";
import type { Flashcard } from "./domain";
import { type CardFormValues, cardSchema } from "./schemas";

export function CardFormPage() {
  const { deckId, cardId } = useParams();
  const services = useServices();
  const { t } = useLanguage();

  const { data, error, loading } = useAsyncData(async () => {
    const card = cardId ? await services.cards.findById(cardId) : undefined;
    return { card, targetDeckId: card?.deckId ?? deckId };
  }, [services, cardId, deckId]);

  if (loading) return <EmptyState>{t("loadingCards")}</EmptyState>;
  if (error || !data) return <ErrorState>{t("loadError")}</ErrorState>;
  if ((cardId && !data.card) || !data.targetDeckId) {
    return <ErrorState>{t("notFound")}</ErrorState>;
  }

  return <CardForm card={data.card} deckId={data.targetDeckId} />;
}

function CardForm({ card, deckId }: { card?: Flashcard; deckId: string }) {
  const services = useServices();
  const navigate = useNavigate();
  const { t, tError } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioRemoved, setAudioRemoved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: { front: card?.front ?? "", back: card?.back ?? "" },
  });

  const currentAudioName = audioFile
    ? audioFile.name
    : audioRemoved
      ? null
      : (card?.frontAudioUri ?? null);

  async function onSubmit(values: CardFormValues) {
    try {
      let saved: Flashcard = card
        ? await updateFlashcard(services.cards, card, values, services.now())
        : await createFlashcard(services.cards, deckId, values, {
            now: services.now(),
            createId: services.createId,
          });

      if (audioFile) {
        saved = await attachCardAudio(
          services.cards,
          saved,
          { name: audioFile.name, blob: audioFile },
          services.now(),
        );
        notify.info(t("audioAttachedStored"));
      } else if (audioRemoved && saved.frontAudioUri) {
        await removeCardAudio(services.cards, saved, services.now());
      }

      notify.success(t("saved"));
      navigate(`/decks/${saved.deckId}/cards`);
    } catch (cause) {
      notify.error(
        cause instanceof Error ? tError(cause.message) : t("saveError"),
      );
    }
  }

  return (
    <div className="max-w-2xl">
      <BackLink to={`/decks/${deckId}/cards`}>{t("backToDecks")}</BackLink>
      <PageHeader
        subtitle={t("cardHint")}
        title={card ? t("formEditCard") : t("formNewCard")}
      />
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <TextAreaField
          autoFocus
          error={errors.front?.message}
          label={t("cardFront")}
          {...register("front")}
        />
        <TextAreaField
          error={errors.back?.message}
          label={t("cardBack")}
          {...register("back")}
        />

        <div className="mt-4">
          <input
            accept="audio/*"
            aria-label={t("attachAudio")}
            className="sr-only"
            data-testid="audio-input"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                setAudioFile(file);
                setAudioRemoved(false);
              }
              event.target.value = "";
            }}
            ref={fileInputRef}
            type="file"
          />
          {currentAudioName ? (
            <p className="mb-2 text-sm font-semibold text-primary">
              {t("audioAttached", { name: currentAudioName })}
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
            >
              {currentAudioName ? t("replaceAudio") : t("attachAudio")}
            </Button>
            {currentAudioName ? (
              <Button
                onClick={() => {
                  setAudioFile(null);
                  setAudioRemoved(true);
                }}
                variant="secondary"
              >
                {t("removeAudio")}
              </Button>
            ) : null}
          </div>
        </div>

        <Button className="mt-6 w-full" disabled={isSubmitting} type="submit">
          {card ? t("saveCard") : t("createCard")}
        </Button>
      </form>
    </div>
  );
}
