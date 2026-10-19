import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { AnimatedScreen } from "../../components/AnimatedScreen";
import { ConfirmModal } from "../../components/ConfirmModal";
import { ItemActionsMenu } from "../../components/ItemActionsMenu";
import { notify } from "../../components/notifications";
import type { AppRoute } from "../../routes/types";
import { useLanguage } from "../../styles/LanguageProvider";
import { useTheme } from "../../styles/ThemeProvider";
import { deleteAudioFile } from "../cards/audioStorage";
import {
  createReviewRepository,
  type DeckReviewSummary,
} from "../review/repository";
import { formatTimeUntil } from "../review/time";
import type { Deck } from "./domain/deck";
import type { DeckGroup } from "./domain/deckGroup";
import { createDeckGroupRepository } from "./groupRepository";
import { createDeckRepository } from "./repository";
import { deleteDeck, listDecks } from "./useCases";

interface DecksScreenProps {
  onNavigate?: (route: AppRoute) => void;
  onBack?: () => void;
  groupId?: string | null;
  reloadKey?: number;
}

type DeckListItem = { type: "deck"; deck: Deck };

export function DecksScreen({
  onNavigate = () => undefined,
  onBack,
  groupId,
  reloadKey = 0,
}: DecksScreenProps) {
  const database = useSQLiteContext();
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [groups, setGroups] = useState<DeckGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deckPendingDelete, setDeckPendingDelete] = useState<Deck | null>(null);
  const [reviewSummaries, setReviewSummaries] = useState<DeckReviewSummary[]>(
    [],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: reloadKey forces a reload when the screen regains focus
  useEffect(() => {
    let mounted = true;
    const repository = createDeckRepository(database);

    void Promise.all([
      listDecks(repository),
      createDeckGroupRepository(database).findAll(),
      createReviewRepository(database).findDeckSummaries(
        new Date().toISOString(),
      ),
    ]).then(([loadedDecks, loadedGroups, summaries]) => {
      if (mounted) {
        setDecks(
          groupId === undefined
            ? loadedDecks
            : loadedDecks.filter((deck) =>
                groupId === null ? !deck.groupId : deck.groupId === groupId,
              ),
        );
        setGroups(
          loadedGroups
            .filter((group) => Number.isFinite(group.sortOrder))
            .filter((group) => groupId === undefined || group.id === groupId),
        );
        setReviewSummaries(summaries);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [database, groupId, reloadKey]);

  function getReviewSummary(deckId: string) {
    return reviewSummaries.find((summary) => summary.deckId === deckId);
  }

  const listItems: DeckListItem[] = [
    ...decks
      .sort((first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0))
      .map((deck) => ({ type: "deck" as const, deck })),
  ];

  async function handleConfirmDelete() {
    if (!deckPendingDelete) {
      return;
    }

    const repository = createDeckRepository(database);
    const audioRows = await database.getAllAsync<{
      front_audio_uri: string | null;
    }>(
      "SELECT front_audio_uri FROM cards WHERE deck_id = ? AND front_audio_uri IS NOT NULL",
      [deckPendingDelete.id],
    );
    await deleteDeck(repository, deckPendingDelete.id);
    await Promise.all(
      audioRows.map((row) => deleteAudioFile(row.front_audio_uri)),
    );
    setDecks((currentDecks) =>
      currentDecks.filter((deck) => deck.id !== deckPendingDelete.id),
    );

    setDeckPendingDelete(null);
    notify.success(t("delete"));
  }

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
      padding: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
    },
    back: {
      color: theme.colors.primary,
      fontWeight: "700",
      marginBottom: theme.spacing.lg,
    },
    brandRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    brandDot: {
      backgroundColor: theme.colors.accent,
      borderRadius: 999,
      height: 12,
      width: 12,
    },
    eyebrow: {
      color: theme.colors.primary,
      fontSize: theme.typography.bodySmall,
      fontWeight: "800",
      letterSpacing: 2,
    },
    title: {
      color: theme.colors.text,
      fontSize: 34,
      fontWeight: "700",
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.body,
      lineHeight: 23,
      marginBottom: theme.spacing.lg,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: 16,
      borderWidth: 1,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    editorPanel: {
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: theme.colors.primaryMuted,
      borderRadius: 22,
      borderWidth: 1,
      marginTop: theme.spacing.lg,
      padding: theme.spacing.lg,
    },
    editorTitle: {
      color: theme.colors.text,
      fontSize: theme.typography.heading,
      fontWeight: "700",
    },
    editorHint: {
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    editorInput: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.primaryMuted,
      borderRadius: 14,
      borderWidth: 1,
      color: theme.colors.text,
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
    },
    editorActions: {
      flexDirection: "row",
      gap: theme.spacing.md,
      marginTop: theme.spacing.md,
    },
    editorSave: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    editorSaveLabel: {
      color: theme.colors.onPrimary,
      fontWeight: "700",
    },
    editorCancel: {
      borderColor: theme.colors.border,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    editorCancelLabel: {
      color: theme.colors.textSecondary,
      fontWeight: "600",
    },
    createButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      justifyContent: "center",
      minHeight: 52,
    },
    createButtonPressed: {
      opacity: 0.82,
      transform: [{ scale: 0.98 }],
    },
    createButtonLabel: {
      color: theme.colors.onPrimary,
      fontSize: theme.typography.body,
      fontWeight: "700",
    },
    reviewButton: {
      alignItems: "center",
      backgroundColor: theme.colors.accent,
      borderRadius: 16,
      justifyContent: "center",
      marginBottom: theme.spacing.sm,
      minHeight: 52,
    },
    reviewButtonLabel: {
      color: theme.colors.text,
      fontSize: theme.typography.body,
      fontWeight: "800",
    },
    reviewGroupButton: {
      alignItems: "center",
      borderColor: theme.colors.primary,
      borderRadius: 16,
      borderWidth: 1,
      justifyContent: "center",
      marginTop: theme.spacing.sm,
      minHeight: 48,
    },
    reviewGroupButtonLabel: {
      color: theme.colors.primary,
      fontWeight: "800",
    },
    progressButton: {
      alignItems: "center",
      borderColor: theme.colors.primaryMuted,
      borderRadius: 16,
      borderWidth: 1,
      justifyContent: "center",
      marginBottom: theme.spacing.md,
      minHeight: 48,
    },
    progressButtonLabel: {
      color: theme.colors.primary,
      fontWeight: "700",
    },
    cancelButton: {
      alignItems: "center",
      borderColor: theme.colors.border,
      borderRadius: 16,
      borderWidth: 1,
      justifyContent: "center",
      marginTop: theme.spacing.sm,
      minHeight: 48,
    },
    cancelButtonLabel: {
      color: theme.colors.textSecondary,
      fontWeight: "600",
    },
    error: {
      color: theme.colors.danger,
      marginTop: theme.spacing.sm,
    },
    empty: {
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.lg,
    },
    deck: {
      backgroundColor: theme.colors.surfaceElevated,
      borderRadius: 20,
      marginTop: theme.spacing.sm,
    },
    deckContent: {
      borderRadius: 20,
      padding: theme.spacing.lg,
      paddingRight: 56,
    },
    menu: {
      position: "absolute",
      right: theme.spacing.sm,
      top: theme.spacing.sm,
    },
    reviewChip: {
      alignSelf: "flex-start",
      borderColor: theme.colors.success,
      borderRadius: 999,
      borderWidth: 1,
      marginTop: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
    },
    groupHeader: {
      backgroundColor: theme.colors.primaryMuted,
      borderRadius: 14,
      marginTop: theme.spacing.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    groupTitle: {
      color: theme.colors.primary,
      fontSize: theme.typography.bodySmall,
      fontWeight: "800",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    dragHint: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.bodySmall,
      marginTop: theme.spacing.xs,
    },
    deckPressed: {
      opacity: 0.86,
      transform: [{ scale: 0.99 }],
    },
    deckName: {
      color: theme.colors.text,
      fontSize: theme.typography.body,
      fontWeight: "600",
    },
    deckDescription: {
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    reviewSummary: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.bodySmall,
      marginTop: theme.spacing.sm,
    },
    reviewAction: {
      color: theme.colors.success,
      fontWeight: "700",
    },
  });

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        {onBack ? (
          <Pressable onPress={onBack}>
            <Text style={styles.back}>{t("backHome")}</Text>
          </Pressable>
        ) : null}
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.eyebrow}>DECKLY</Text>
        </View>
        <Text style={styles.title}>{t("decks")}</Text>
        <Text style={styles.subtitle}>{t("decksSubtitle")}</Text>
        <Pressable
          accessibilityLabel={t("newDeck")}
          accessibilityRole="button"
          onPress={() => onNavigate({ name: "deckForm", groupId })}
          style={({ pressed }) => [
            styles.createButton,
            pressed && styles.createButtonPressed,
          ]}
        >
          <Text style={styles.createButtonLabel}>{t("newDeck")}</Text>
        </Pressable>
        {groupId && groups.length > 0 ? (
          <Pressable
            onPress={() => onNavigate({ name: "review", group: groups[0] })}
            style={styles.reviewGroupButton}
          >
            <Text style={styles.reviewGroupButtonLabel}>
              {t("reviewGroup")}
            </Text>
          </Pressable>
        ) : null}
        {isLoading ? (
          <Text style={styles.empty}>{t("loadingDecks")}</Text>
        ) : (
          <FlatList<DeckListItem>
            data={listItems}
            keyExtractor={(item) => item.deck.id}
            ListEmptyComponent={
              <Text style={styles.empty}>{t("noDecks")}</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.deck}>
                <Pressable
                  accessibilityRole="button"
                  testID={`deck-${item.deck.id}`}
                  onPress={() => onNavigate({ name: "cards", deck: item.deck })}
                  style={({ pressed }) => [
                    styles.deckContent,
                    pressed && styles.deckPressed,
                  ]}
                >
                  <Text style={styles.deckName}>{item.deck.name}</Text>
                  {item.deck.description ? (
                    <Text style={styles.deckDescription}>
                      {item.deck.description}
                    </Text>
                  ) : null}
                  <Text style={styles.reviewSummary}>
                    {(() => {
                      const summary = getReviewSummary(item.deck.id);
                      if (!summary) return t("noCards");
                      return t("nextReview", {
                        count: summary.dueCount,
                        time: summary.nextDueAt
                          ? formatTimeUntil(
                              summary.nextDueAt,
                              new Date(),
                              language,
                            )
                          : language === "en"
                            ? "no date"
                            : "sem data",
                      });
                    })()}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={(event) => {
                      event?.stopPropagation?.();
                      onNavigate({ name: "review", deck: item.deck });
                    }}
                    style={styles.reviewChip}
                  >
                    <Text style={styles.reviewAction}>{t("review")}</Text>
                  </Pressable>
                </Pressable>
                <View style={styles.menu}>
                  <ItemActionsMenu
                    actions={[
                      {
                        label: t("edit"),
                        onPress: () =>
                          onNavigate({ name: "deckForm", deck: item.deck }),
                      },
                      {
                        label: t("delete"),
                        destructive: true,
                        onPress: () => setDeckPendingDelete(item.deck),
                      },
                    ]}
                    testID={`deck-menu-${item.deck.id}`}
                    title={item.deck.name}
                  />
                </View>
              </View>
            )}
          />
        )}
      </View>
      <ConfirmModal
        cancelLabel={t("cancel")}
        confirmLabel={t("confirmDelete")}
        message={t("deleteDeckText")}
        onCancel={() => setDeckPendingDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
        title={t("deleteDeckTitle")}
        visible={deckPendingDelete !== null}
      />
    </AnimatedScreen>
  );
}
