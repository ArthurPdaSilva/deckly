import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useServices } from "../../app/ServicesProvider";
import { TextField } from "../../components/fields";
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
import { createDeckGroup, renameDeckGroup } from "./deckService";
import type { DeckGroup } from "./domain";
import { type GroupFormValues, groupSchema } from "./schemas";

export function GroupFormPage() {
  const { groupId } = useParams();
  const services = useServices();
  const { t } = useLanguage();

  const { data, error, loading } = useAsyncData(async () => {
    const groups = await services.groups.findAll();
    return {
      groups,
      group: groupId ? groups.find((item) => item.id === groupId) : undefined,
    };
  }, [services, groupId]);

  if (loading) return <EmptyState>{t("loadingDecks")}</EmptyState>;
  if (error || !data) return <ErrorState>{t("loadError")}</ErrorState>;
  if (groupId && !data.group) return <ErrorState>{t("notFound")}</ErrorState>;

  return <GroupForm group={data.group} nextSortOrder={data.groups.length} />;
}

function GroupForm({
  group,
  nextSortOrder,
}: {
  group?: DeckGroup;
  nextSortOrder: number;
}) {
  const services = useServices();
  const navigate = useNavigate();
  const { t, tError } = useLanguage();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: group?.name ?? "" },
  });

  async function onSubmit(values: GroupFormValues) {
    try {
      if (group) {
        await renameDeckGroup(
          services.groups,
          group,
          values.name,
          services.now(),
        );
      } else {
        await createDeckGroup(services.groups, values.name, {
          now: services.now(),
          createId: services.createId,
          sortOrder: nextSortOrder,
        });
      }
      notify.success(t("saved"));
      navigate("/groups");
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
        subtitle={t("groupHint")}
        title={group ? t("formEditGroup") : t("formNewGroup")}
      />
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <TextField
          autoFocus
          error={errors.name?.message}
          label={t("groupName")}
          {...register("name")}
        />
        <Button className="mt-6 w-full" disabled={isSubmitting} type="submit">
          {group ? t("saveGroup") : t("createGroup")}
        </Button>
      </form>
    </div>
  );
}
