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
import { useTheme } from "../../styles/ThemeProvider";
import type { Deck } from "./domain/deck";
import { createDeckRepository } from "./repository";
import { createDeck, listDecks } from "./useCases";

export function DecksScreen() {
  const database = useSQLiteContext();
  const { theme } = useTheme();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  async function handleCreateDeck() {
    try {
      const repository = createDeckRepository(database);
      const deck = await createDeck(
        repository,
        { name },
        {
          now: new Date(),
          createId: () => `deck-${Date.now()}`,
        },
      );

      setDecks((currentDecks) => [deck, ...currentDecks]);
      setName("");
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível criar o baralho",
      );
    }
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
      borderRadius: 16,
      borderColor: theme.colors.border,
      borderWidth: 1,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
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
    deckName: {
      color: theme.colors.text,
      fontSize: theme.typography.body,
      fontWeight: "600",
    },
    deckDescription: {
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={styles.brandDot} />
        <Text style={styles.eyebrow}>DECKLY</Text>
      </View>
      <Text style={styles.title}>Seus baralhos</Text>
      <Text style={styles.subtitle}>
        Pequenas revisões. Memórias que ficam.
      </Text>
      <TextInput
        accessibilityLabel="Nome do baralho"
        onChangeText={setName}
        placeholder="Nome do baralho"
        placeholderTextColor={theme.colors.textSecondary}
        style={styles.input}
        value={name}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Criar baralho"
        onPress={() => void handleCreateDeck()}
        style={({ pressed }) => [
          styles.createButton,
          pressed && styles.createButtonPressed,
        ]}
      >
        <Text style={styles.createButtonLabel}>Criar baralho</Text>
      </Pressable>
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
            <View style={styles.deck}>
              <Text style={styles.deckName}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.deckDescription}>{item.description}</Text>
              ) : null}
            </View>
          )}
        />
      )}
    </View>
  );
}
