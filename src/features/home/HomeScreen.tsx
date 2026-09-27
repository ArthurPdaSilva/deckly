import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AnimatedScreen } from "../../components/AnimatedScreen";
import type { AppRoute } from "../../routes/types";
import { useLanguage } from "../../styles/LanguageProvider";
import { useTheme } from "../../styles/ThemeProvider";
import { createReviewRepository } from "../review/repository";

interface HomeScreenProps {
  onNavigate: (route: AppRoute) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const database = useSQLiteContext();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    void createReviewRepository(database)
      .findDueCards(new Date().toISOString())
      .then((cards) => {
        if (mounted) {
          setDueCount(cards.length);
        }
      });

    return () => {
      mounted = false;
    };
  }, [database]);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
      justifyContent: "center",
      padding: theme.spacing.lg,
    },
    eyebrow: {
      color: theme.colors.accent,
      fontSize: theme.typography.bodySmall,
      fontWeight: "800",
      letterSpacing: 2,
    },
    title: {
      color: theme.colors.text,
      fontSize: 36,
      fontWeight: "800",
      marginTop: theme.spacing.sm,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.body,
      lineHeight: 24,
      marginTop: theme.spacing.sm,
    },
    reviewCard: {
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: theme.colors.border,
      borderRadius: 24,
      borderWidth: 1,
      marginTop: theme.spacing.xl,
      padding: theme.spacing.lg,
    },
    reviewLabel: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.bodySmall,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    reviewValue: {
      color: theme.colors.text,
      fontSize: 28,
      fontWeight: "800",
      marginTop: theme.spacing.xs,
    },
    primaryButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
    },
    primaryLabel: {
      color: theme.colors.onPrimary,
      fontWeight: "800",
    },
    secondaryButton: {
      alignItems: "center",
      borderColor: theme.colors.border,
      borderRadius: 16,
      borderWidth: 1,
      marginTop: theme.spacing.sm,
      padding: theme.spacing.md,
    },
    secondaryLabel: {
      color: theme.colors.primary,
      fontWeight: "700",
    },
  });

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>DECKLY</Text>
        <Text style={styles.title}>{t("home")}</Text>
        <Text style={styles.subtitle}>{t("homeSubtitle")}</Text>
        <View style={styles.reviewCard}>
          <Text style={styles.reviewLabel}>{t("todaySession")}</Text>
          <Text style={styles.reviewValue}>
            {t("pendingCards", { count: dueCount })}
          </Text>
          <Pressable
            onPress={() => onNavigate({ name: "review" })}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryLabel}>{t("startReview")}</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => onNavigate({ name: "groups" })}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryLabel}>{t("myDecks")}</Text>
        </Pressable>
        <Pressable
          onPress={() => onNavigate({ name: "settings" })}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryLabel}>{t("settings")}</Text>
        </Pressable>
        <Pressable
          onPress={() => onNavigate({ name: "statistics" })}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryLabel}>{t("progress")}</Text>
        </Pressable>
      </View>
    </AnimatedScreen>
  );
}
