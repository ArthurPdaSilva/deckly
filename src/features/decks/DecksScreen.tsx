import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AnimatedScreen } from "../../components/AnimatedScreen";
import { notify } from "../../components/notifications";
import { resetAndSeedDatabase } from "../../database/seed";
import { useTheme } from "../../styles/ThemeProvider";
import { CardsScreen } from "../cards/CardsScreen";
import { ReviewScreen } from "../review/ReviewScreen";
import type { Deck } from "./domain/deck";
import { createDeckRepository } from "./repository";
import { createDeck, deleteDeck, listDecks, updateDeck } from "./useCases";

export function DecksScreen() {
  const database = useSQLiteContext();
  const { theme } = useTheme();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [deckPendingDelete, setDeckPendingDelete] = useState<Deck | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [seedPending, setSeedPending] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    let mounted = true;
    const repository = createDeckRepository(database);

    void listDecks(repository).then((loadedDecks) => {
      if (mounted) {
        setDecks(loadedDecks);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [database]);

  async function handleSubmitDeck() {
    try {
      const repository = createDeckRepository(database);

      if (editingDeck) {
        const deck = await updateDeck(
          repository,
          editingDeck,
          { name: editingName },
          new Date(),
        );
        setDecks((currentDecks) =>
          currentDecks.map((currentDeck) =>
            currentDeck.id === deck.id ? deck : currentDeck,
          ),
        );
        setEditingDeck(null);
        notify.success("Baralho atualizado.");
      } else {
        const deck = await createDeck(
          repository,
          { name },
          {
            now: new Date(),
            createId: () => `deck-${Date.now()}`,
          },
        );
        setDecks((currentDecks) => [deck, ...currentDecks]);
        notify.success("Baralho criado.");
      }

      setName("");
      setEditingName("");
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível salvar o baralho",
      );
      notify.error(
        cause instanceof Error
          ? cause.message
          : "Não foi possível salvar o baralho",
      );
    }
  }

  function handleStartEdit(deck: Deck) {
    setEditingDeck(deck);
    setEditingName(deck.name);
    setError(null);
  }

  function handleCancelEdit() {
    setEditingDeck(null);
    setEditingName("");
    setError(null);
  }

  async function handleConfirmDelete() {
    if (!deckPendingDelete) {
      return;
    }

    const repository = createDeckRepository(database);
    await deleteDeck(repository, deckPendingDelete.id);
    setDecks((currentDecks) =>
      currentDecks.filter((deck) => deck.id !== deckPendingDelete.id),
    );

    if (editingDeck?.id === deckPendingDelete.id) {
      handleCancelEdit();
    }
    setDeckPendingDelete(null);
    notify.success("Baralho excluído.");
  }

  async function handleSeedDatabase() {
    try {
      await resetAndSeedDatabase(database);
      const seededDecks = await listDecks(createDeckRepository(database));
      setDecks(seededDecks);
      notify.success("Dados de teste carregados.");
    } catch (cause) {
      notify.error(
        cause instanceof Error
          ? cause.message
          : "Não foi possível carregar os dados de teste",
      );
    } finally {
      setSeedPending(false);
    }
  }

  if (selectedDeck) {
    return (
      <CardsScreen deck={selectedDeck} onBack={() => setSelectedDeck(null)} />
    );
  }

  if (isReviewing) {
    return <ReviewScreen onBack={() => setIsReviewing(false)} />;
  }

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
      padding: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
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
    seedButton: {
      alignItems: "center",
      borderColor: theme.colors.accent,
      borderRadius: 14,
      borderWidth: 1,
      marginTop: theme.spacing.lg,
      padding: theme.spacing.sm,
    },
    seedButtonLabel: {
      color: theme.colors.warning,
      fontSize: theme.typography.bodySmall,
      fontWeight: "700",
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
      padding: theme.spacing.lg,
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
    actionRow: {
      flexDirection: "row",
      gap: theme.spacing.lg,
      marginTop: theme.spacing.md,
    },
    editAction: {
      color: theme.colors.primary,
      fontWeight: "700",
    },
    deleteAction: {
      color: theme.colors.danger,
      fontWeight: "700",
    },
    confirmation: {
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: theme.colors.accent,
      borderRadius: 18,
      borderWidth: 1,
      marginTop: theme.spacing.lg,
      padding: theme.spacing.md,
    },
    confirmationTitle: {
      color: theme.colors.text,
      fontSize: theme.typography.body,
      fontWeight: "700",
    },
    confirmationText: {
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    confirmationActions: {
      flexDirection: "row",
      gap: theme.spacing.lg,
      marginTop: theme.spacing.md,
    },
  });

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.eyebrow}>DECKLY</Text>
        </View>
        <Text style={styles.title}>Seus baralhos</Text>
        <Text style={styles.subtitle}>
          Pequenas revisões. Memórias que ficam.
        </Text>
        <Pressable
          onPress={() => setIsReviewing(true)}
          style={styles.reviewButton}
        >
          <Text style={styles.reviewButtonLabel}>Começar revisão</Text>
        </Pressable>
        <TextInput
          accessibilityLabel="Nome do baralho"
          onChangeText={setName}
          placeholder="Nome do baralho"
          placeholderTextColor={theme.colors.textSecondary}
          style={styles.input}
          value={name}
        />
        <Pressable
          accessibilityLabel="Criar baralho"
          accessibilityRole="button"
          onPress={() => void handleSubmitDeck()}
          style={({ pressed }) => [
            styles.createButton,
            pressed && styles.createButtonPressed,
          ]}
        >
          <Text style={styles.createButtonLabel}>Criar baralho</Text>
        </Pressable>
        {__DEV__ ? (
          <Pressable
            onPress={() => setSeedPending(true)}
            style={styles.seedButton}
          >
            <Text style={styles.seedButtonLabel}>Carregar dados de teste</Text>
          </Pressable>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {isLoading ? (
          <Text style={styles.empty}>Carregando baralhos...</Text>
        ) : (
          <FlatList
            data={decks}
            keyExtractor={(deck) => deck.id}
            ListEmptyComponent={
              <Text style={styles.empty}>Nenhum baralho criado ainda.</Text>
            }
            renderItem={({ item }) => (
              <Pressable
                testID={`deck-${item.id}`}
                onPress={() => setSelectedDeck(item)}
                style={({ pressed }) => [
                  styles.deck,
                  pressed && styles.deckPressed,
                ]}
              >
                <Text style={styles.deckName}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.deckDescription}>{item.description}</Text>
                ) : null}
                <View style={styles.actionRow}>
                  <Pressable
                    onPress={(event) => {
                      event?.stopPropagation?.();
                      handleStartEdit(item);
                    }}
                  >
                    <Text style={styles.editAction}>Editar</Text>
                  </Pressable>
                  <Pressable
                    onPress={(event) => {
                      event?.stopPropagation?.();
                      setDeckPendingDelete(item);
                    }}
                  >
                    <Text style={styles.deleteAction}>Excluir</Text>
                  </Pressable>
                </View>
              </Pressable>
            )}
          />
        )}
        {deckPendingDelete ? (
          <View style={styles.confirmation}>
            <Text style={styles.confirmationTitle}>Excluir este baralho?</Text>
            <Text style={styles.confirmationText}>
              Os cartões desse baralho também serão removidos.
            </Text>
            <View style={styles.confirmationActions}>
              <Pressable onPress={() => setDeckPendingDelete(null)}>
                <Text style={styles.editAction}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={() => void handleConfirmDelete()}>
                <Text style={styles.deleteAction}>Confirmar exclusão</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
        {editingDeck ? (
          <View testID="deck-editor" style={styles.editorPanel}>
            <Text style={styles.editorTitle}>Editar baralho</Text>
            <Text style={styles.editorHint}>
              Atualize o nome sem perder seus cartões.
            </Text>
            <TextInput
              accessibilityLabel="Nome para edição"
              onChangeText={setEditingName}
              placeholder="Nome para edição"
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.editorInput}
              value={editingName}
            />
            <View style={styles.editorActions}>
              <Pressable
                onPress={() => void handleSubmitDeck()}
                style={styles.editorSave}
              >
                <Text style={styles.editorSaveLabel}>Salvar alterações</Text>
              </Pressable>
              <Pressable onPress={handleCancelEdit} style={styles.editorCancel}>
                <Text style={styles.editorCancelLabel}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
        {seedPending ? (
          <View style={styles.confirmation}>
            <Text style={styles.confirmationTitle}>
              Substituir dados locais?
            </Text>
            <Text style={styles.confirmationText}>
              Todos os decks e cartões atuais serão apagados e substituídos pela
              seed.
            </Text>
            <View style={styles.confirmationActions}>
              <Pressable onPress={() => setSeedPending(false)}>
                <Text style={styles.editAction}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={() => void handleSeedDatabase()}>
                <Text style={styles.deleteAction}>Confirmar reset</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </AnimatedScreen>
  );
}
