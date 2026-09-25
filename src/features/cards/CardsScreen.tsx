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
import type { Deck } from "../decks/domain/deck";
import type { Flashcard } from "./domain/flashcard";
import { createFlashcardRepository } from "./repository";
import { createFlashcard, listFlashcards } from "./useCases";

interface CardsScreenProps {
  deck: Deck;
  onBack: () => void;
}

export function CardsScreen({ deck, onBack }: CardsScreenProps) {
  const database = useSQLiteContext();
  const { theme } = useTheme();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const repository = createFlashcardRepository(database);

    void listFlashcards(repository, deck.id).then((loadedCards) => {
      if (mounted) {
        setCards(loadedCards);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [database, deck.id]);

  async function handleCreateCard() {
    try {
      const card = await createFlashcard(
        createFlashcardRepository(database),
        deck.id,
        { front, back },
        {
          now: new Date(),
          createId: () => `card-${Date.now()}`,
        },
      );
      setCards((currentCards) => [...currentCards, card]);
      setFront("");
      setBack("");
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível adicionar o cartão",
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
    back: {
      color: theme.colors.primary,
      fontWeight: "700",
      marginBottom: theme.spacing.lg,
    },
    eyebrow: {
      color: theme.colors.accent,
      fontSize: theme.typography.bodySmall,
      fontWeight: "800",
      letterSpacing: 1.5,
    },
    title: {
      color: theme.colors.text,
      fontSize: 30,
      fontWeight: "700",
      marginTop: theme.spacing.xs,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: 16,
      borderWidth: 1,
      color: theme.colors.text,
      marginTop: theme.spacing.md,
      minHeight: 84,
      padding: theme.spacing.md,
      textAlignVertical: "top",
    },
    button: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      justifyContent: "center",
      marginTop: theme.spacing.sm,
      minHeight: 52,
    },
    buttonLabel: {
      color: theme.colors.onPrimary,
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
    card: {
      backgroundColor: theme.colors.surfaceElevated,
      borderRadius: 20,
      marginTop: theme.spacing.sm,
      padding: theme.spacing.lg,
    },
    cardLabel: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.bodySmall,
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    cardText: {
      color: theme.colors.text,
      fontSize: theme.typography.body,
      marginTop: theme.spacing.xs,
    },
    cardBack: {
      borderColor: theme.colors.border,
      borderTopWidth: 1,
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
    },
  });

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack}>
        <Text style={styles.back}>← Voltar aos baralhos</Text>
      </Pressable>
      <Text style={styles.eyebrow}>BARALHO</Text>
      <Text style={styles.title}>{deck.name}</Text>
      <TextInput
        accessibilityLabel="Frente do cartão"
        multiline
        onChangeText={setFront}
        placeholder="Frente do cartão"
        placeholderTextColor={theme.colors.textSecondary}
        style={styles.input}
        value={front}
      />
      <TextInput
        accessibilityLabel="Verso do cartão"
        multiline
        onChangeText={setBack}
        placeholder="Verso do cartão"
        placeholderTextColor={theme.colors.textSecondary}
        style={styles.input}
        value={back}
      />
      <Pressable onPress={() => void handleCreateCard()} style={styles.button}>
        <Text style={styles.buttonLabel}>Adicionar cartão</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {isLoading ? (
        <Text style={styles.empty}>Carregando cartões...</Text>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(card) => card.id}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhum cartão criado ainda.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Frente</Text>
              <Text style={styles.cardText}>{item.front}</Text>
              <View style={styles.cardBack}>
                <Text style={styles.cardLabel}>Verso</Text>
                <Text style={styles.cardText}>{item.back}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
