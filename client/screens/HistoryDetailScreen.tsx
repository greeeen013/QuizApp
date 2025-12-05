import React, { useCallback, useMemo, useLayoutEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { ScoreCircle } from "@/components/ScoreCircle";
import { useStore } from "@/lib/store";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { HistoryStackParamList } from "@/navigation/HistoryStackNavigator";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<
  HistoryStackParamList & RootStackParamList
>;
type RouteProps = RouteProp<HistoryStackParamList, "HistoryDetail">;

export default function HistoryDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { getRun, getQuiz } = useStore();

  const { runId } = route.params;
  const run = getRun(runId);
  const quiz = run ? getQuiz(run.quizId) : undefined;

  const wrongAnswers = useMemo(() => {
    if (!run) return [];
    return run.answers.filter((a) => !a.isCorrect);
  }, [run]);

  const handleReviewMistakes = useCallback(() => {
    navigation.navigate("ReviewMistakes", { runId });
  }, [navigation, runId]);

  const handleRetryMistakes = useCallback(() => {
    if (!run || !quiz) {
      Alert.alert("Quiz not found", "The original quiz may have been deleted.");
      return;
    }
    if (wrongAnswers.length === 0) {
      Alert.alert("No mistakes", "You got all answers correct!");
      return;
    }
    navigation.navigate("ActiveQuiz", {
      testId: run.quizId,
      shuffle: false,
      questionIds: wrongAnswers.map((a) => a.questionId),
    });
  }, [run, quiz, wrongAnswers, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: run?.quizTitle ?? "Run Details",
    });
  }, [navigation, run?.quizTitle]);

  if (!run) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyContainer}>
          <ThemedText>Run not found</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scoreSection}>
          <ScoreCircle score={run.scorePercentage} />
        </View>

        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <View style={[styles.statIcon, { backgroundColor: theme.success + "1A" }]}>
              <Feather name="check-circle" size={20} color={theme.success} />
            </View>
            <ThemedText type="h4">{run.correctCount}</ThemedText>
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary }}
            >
              Correct
            </ThemedText>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <View style={[styles.statIcon, { backgroundColor: theme.error + "1A" }]}>
              <Feather name="x-circle" size={20} color={theme.error} />
            </View>
            <ThemedText type="h4">{run.wrongCount}</ThemedText>
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary }}
            >
              Wrong
            </ThemedText>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <View style={[styles.statIcon, { backgroundColor: theme.primary + "1A" }]}>
              <Feather name="hash" size={20} color={theme.primary} />
            </View>
            <ThemedText type="h4">{run.totalQuestions}</ThemedText>
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary }}
            >
              Total
            </ThemedText>
          </View>
        </View>

        <View
          style={[
            styles.dateCard,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.border,
            },
          ]}
        >
          <Feather name="calendar" size={18} color={theme.textSecondary} />
          <ThemedText style={{ color: theme.textSecondary }}>
            {formatDate(run.timestamp)}
          </ThemedText>
        </View>

        {wrongAnswers.length > 0 ? (
          <View style={styles.actions}>
            <Button onPress={handleReviewMistakes} style={styles.actionButton}>
              Review Mistakes ({wrongAnswers.length})
            </Button>
            <Button
              onPress={handleRetryMistakes}
              style={[
                styles.actionButton,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderWidth: 1,
                  borderColor: theme.primary,
                },
              ]}
            >
              <ThemedText style={{ color: theme.primary, fontWeight: "600" }}>
                Retry Mistakes
              </ThemedText>
            </Button>
          </View>
        ) : (
          <View style={styles.perfectScore}>
            <Feather name="award" size={32} color={theme.success} />
            <ThemedText type="h4" style={{ color: theme.success }}>
              Perfect Score!
            </ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>
              You answered all questions correctly
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  scoreSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  dateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  actions: {
    gap: Spacing.md,
  },
  actionButton: {},
  perfectScore: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing["2xl"],
  },
});
