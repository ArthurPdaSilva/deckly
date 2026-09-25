import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AnimatedScreen } from "../../components/AnimatedScreen";
import { useTheme } from "../../styles/ThemeProvider";
import type { DashboardStats } from "./domain/statistics";
import { createStatisticsRepository } from "./repository";

interface StatisticsScreenProps {
  now?: Date;
  onBack: () => void;
}

const EMPTY_STATS: DashboardStats = {
  totalDecks: 0,
  totalCards: 0,
  dueCards: 0,
  reviewsToday: 0,
  averageRating: 0,
  ratingDistribution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
};

export function StatisticsScreen({
  now = new Date(),
  onBack,
}: StatisticsScreenProps) {
  const database = useSQLiteContext();
  const { mode, theme, toggleTheme } = useTheme();
  const [sessionNow] = useState(() => now ?? new Date());
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    void createStatisticsRepository(database)
      .getDashboardStats(sessionNow)
      .then((loadedStats) => {
        if (mounted) {
          setStats(loadedStats);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setError(true);
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [database, sessionNow]);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
      padding: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
    },
    content: {
      paddingBottom: theme.spacing.xl,
    },
    back: {
      color: theme.colors.primary,
      fontWeight: "700",
      marginBottom: theme.spacing.xl,
    },
    eyebrow: {
      color: theme.colors.accent,
      fontSize: theme.typography.bodySmall,
      fontWeight: "800",
      letterSpacing: 1.5,
    },
    title: {
      color: theme.colors.text,
      fontSize: 32,
      fontWeight: "700",
      marginTop: theme.spacing.xs,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.body,
      lineHeight: 23,
      marginTop: theme.spacing.xs,
    },
    themeButton: {
      alignSelf: "flex-start",
      borderColor: theme.colors.border,
      borderRadius: 12,
      borderWidth: 1,
      marginTop: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    themeButtonLabel: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.bodySmall,
      fontWeight: "700",
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xl,
    },
    metric: {
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: theme.colors.border,
      borderRadius: 20,
      borderWidth: 1,
      minWidth: "47%",
      padding: theme.spacing.md,
    },
    metricValue: {
      color: theme.colors.text,
      fontSize: 28,
      fontWeight: "800",
    },
    metricLabel: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.bodySmall,
      marginTop: theme.spacing.xs,
    },
    panel: {
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: theme.colors.border,
      borderRadius: 22,
      borderWidth: 1,
      marginTop: theme.spacing.md,
      padding: theme.spacing.lg,
    },
    panelTitle: {
      color: theme.colors.text,
      fontSize: theme.typography.heading,
      fontWeight: "700",
    },
    panelHint: {
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    ratingRow: {
      alignItems: "center",
      flexDirection: "row",
      marginTop: theme.spacing.md,
    },
    ratingLabel: {
      color: theme.colors.textSecondary,
      width: 58,
    },
    ratingTrack: {
      backgroundColor: theme.colors.primaryMuted,
      borderRadius: 99,
      flex: 1,
      height: 10,
      overflow: "hidden",
    },
    ratingFill: {
      backgroundColor: theme.colors.primary,
      borderRadius: 99,
      height: "100%",
    },
    ratingCount: {
      color: theme.colors.text,
      fontWeight: "700",
      marginLeft: theme.spacing.sm,
      textAlign: "right",
      width: 24,
    },
    loading: {
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xl,
    },
    error: {
      color: theme.colors.danger,
      marginTop: theme.spacing.xl,
    },
  });

  const totalRatings = Object.values(stats.ratingDistribution).reduce(
    (total, count) => total + count,
    0,
  );

  return (
    <AnimatedScreen>
      <ScrollView
        contentContainerStyle={styles.content}
        style={styles.container}
      >
        <Pressable onPress={onBack}>
          <Text style={styles.back}>← Voltar aos baralhos</Text>
        </Pressable>
        <Text style={styles.eyebrow}>VISÃO GERAL</Text>
        <Text style={styles.title}>Seu progresso</Text>
        <Text style={styles.subtitle}>
          Acompanhe o ritmo das suas revisões neste dispositivo.
        </Text>
        <Pressable onPress={toggleTheme} style={styles.themeButton}>
          <Text style={styles.themeButtonLabel}>
            {mode === "dark" ? "Usar tema claro" : "Usar tema escuro"}
          </Text>
        </Pressable>
        {isLoading ? (
          <Text style={styles.loading}>Calculando seu progresso...</Text>
        ) : error ? (
          <Text style={styles.error}>
            Não foi possível carregar seu progresso.
          </Text>
        ) : (
          <>
            <View style={styles.grid}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{stats.totalCards}</Text>
                <Text style={styles.metricLabel}>cartões criados</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{stats.dueCards}</Text>
                <Text style={styles.metricLabel}>para revisar</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>
                  {stats.averageRating.toFixed(1)}
                </Text>
                <Text style={styles.metricLabel}>média das avaliações</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{stats.totalDecks}</Text>
                <Text style={styles.metricLabel}>baralhos</Text>
              </View>
            </View>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>
                {stats.reviewsToday} revisões hoje
              </Text>
              <Text style={styles.panelHint}>
                Como você avaliou suas respostas
              </Text>
              {([2, 4, 5] as const).map((rating) => {
                const count = stats.ratingDistribution[rating];
                const width =
                  totalRatings === 0 ? 0 : (count / totalRatings) * 100;
                const label =
                  rating === 2 ? "Difícil" : rating === 4 ? "Bom" : "Fácil";

                return (
                  <View key={rating} style={styles.ratingRow}>
                    <Text style={styles.ratingLabel}>{label}</Text>
                    <View style={styles.ratingTrack}>
                      <View
                        style={[styles.ratingFill, { width: `${width}%` }]}
                      />
                    </View>
                    <Text style={styles.ratingCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </AnimatedScreen>
  );
}
