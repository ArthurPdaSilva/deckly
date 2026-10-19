import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useServices } from "../../app/ServicesProvider";
import { SelectField, TextAreaField, TextField } from "../../components/fields";
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
import { UNGROUPED_ROUTE_ID } from "./DecksPage";
import { createDeck, moveDeck, updateDeck } from "./deckService";
import type { Deck, DeckGroup } from "./domain";
import { type DeckFormValues, deckSchema } from "./schemas";

export function DeckFormPage() {
  const { deckId } = useParams();
  const [searchParams] = useSearchParams();
  const services = useServices();
  const { t } = useLanguage();

  const { data, error, loading } = useAsyncData(async () => {
    const [groups, decks] = await Promise.all([
      services.groups.findAll(),
      services.decks.findAll(),
    ]);
    return {
      groups,
      decks,
      deck: deckId ? decks.find((item) => item.id === deckId) : undefined,
    };
  }, [services, deckId]);

  if (loading) return <EmptyState>{t("loadingDecks")}</EmptyState>;
  if (error || !data) return <ErrorState>{t("loadError")}</ErrorState>;
  if (deckId && !data.deck) return <ErrorState>{t("notFound")}</ErrorState>;

  return (
    <DeckForm
      deck={data.deck}
      decks={data.decks}
      defaultGroupId={searchParams.get("group")}
      groups={data.groups}
    />
  );
}

interface DeckFormProps {
  deck?: Deck;
  decks: Deck[];
  groups: DeckGroup[];
  defaultGroupId: string | null;
}

function DeckForm({ deck, decks, groups, defaultGroupId }: DeckFormProps) {
  const services = useServices();
  const navigate = useNavigate();
  const { t, tError } = useLanguage();
  const initialGroupId = deck ? (deck.groupId ?? "") : (defaultGroupId ?? "");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DeckFormValues>({
    resolver: zodResolver(deckSchema),
    defaultValues: {
      name: deck?.name ?? "",
      description: deck?.description ?? "",
      groupId: groups.some((group) => group.id === initialGroupId)
        ? initialGroupId
        : "",
    },
  });

  async function onSubmit(values: DeckFormValues) {
    const groupId = values.groupId === "" ? null : values.groupId;
    try {
      if (deck) {
        const updated = await updateDeck(
          services.decks,
          deck,
          { name: values.name, description: values.description },
          services.now(),
        );
        if ((deck.groupId ?? null) !== groupId) {
          const sortOrder = decks.filter(
            (item) => (item.groupId ?? null) === groupId,
          ).length;
          await moveDeck(
            services.decks,
            updated,
            groupId,
            sortOrder,
            services.now(),
          );
        }
      } else {
        await createDeck(
          services.decks,
          {
            name: values.name,
            description: values.description,
            groupId,
            sortOrder: decks.filter(
              (item) => (item.groupId ?? null) === groupId,
            ).length,
          },
          { now: services.now(), createId: services.createId },
        );
      }
      notify.success(t("saved"));
      navigate(`/groups/${groupId ?? UNGROUPED_ROUTE_ID}/decks`);
    } catch (cause) {
      notify.error(
        cause instanceof Error ? tError(cause.message) : t("saveError"),
      );
    }
  }

  return (
    <div className="max-w-2xl">
      <BackLink to="/groups">{t("backToGroups")}</BackLink>
      <PageHeader
        subtitle={t("deckHint")}
        title={deck ? t("formEditDeck") : t("formNewDeck")}
      />
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <TextField
          autoFocus
          error={errors.name?.message}
          label={t("deckName")}
          {...register("name")}
        />
        <TextAreaField
          label={t("optionalDescription")}
          {...register("description")}
        />
        <SelectField label={t("group")} {...register("groupId")}>
          <option value="">{t("noGroup")}</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </SelectField>
        <Button className="mt-6 w-full" disabled={isSubmitting} type="submit">
          {deck ? t("saveDeck") : t("createDeck")}
        </Button>
      </form>
    </div>
  );
}
