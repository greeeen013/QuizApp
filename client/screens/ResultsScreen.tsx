import React, { useCallback, useMemo, useLayoutEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { ScoreCircle } from "@/components/ScoreCircle";
import { useStore } from "@/lib/store";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "Results">;

export default function ResultsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { getRun, getQuiz, runs } = useStore();

  const { runId, isMiniRun } = route.params;
  const run = getRun(runId);

  const lastRun = useMemo(() => {
    if (run) return run;
    if (isMiniRun && runs.length > 0) {
      return null;
    }
    return null;
  }, [run, isMiniRun, runs]);

  const wrongAnswers = useMemo(() => {
    if (!lastRun) return [];
    return lastRun.answers.filter((a) => !a.isCorrect);
  }, [lastRun]);

  const handleClose = useCallback(() => {
    navigation.popToTop();
    navigation.goBack();
  }, [navigation]);

  const handleReviewMistakes = useCallback(() => {
    if (!lastRun) return;
    navigation.navigate("ReviewMistakes", { runId: lastRun.id });
  }, [navigation, lastRun]);

  const handleRetryMistakes = useCallback(() => {
    if (!lastRun) return;
    const quiz = getQuiz(lastRun.quizId);
    if (!quiz) return;
    
    navigation.replace("ActiveQuiz", {
      testId: lastRun.quizId,
      shuffle: false,
      questionIds: wrongAnswers.map((a) => a.questionId),
    });
  }, [lastRun, wrongAnswers, navigation, getQuiz]);

  const handleDone = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handleClose();
  }, [handleClose]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderButton onPress={handleClose}>
          <Feather name="x" size={22} color={theme.text} />
        </HeaderButton>
      ),
    });
  }, [navigation, handleClose, theme.text]);

  if (!lastRun && !isMiniRun) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyContainer}>
          <ThemedText>Results not found</ThemedText>
          <Button onPress={handleClose} style={{ marginTop: Spacing.lg }}>
            Go Back
          </Button>
        </View>
      </ThemedView>
    );
  }

  if (isMiniRun) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.miniRunContainer}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.success + "1A" },
              ]}
            >
              <Feather name="check-circle" size={48} color={theme.success} />
            </View>
            <ThemedText type="h3" style={styles.title}>
              Practice Complete!
            </ThemedText>
            <ThemedText
              style={[styles.description, { color: theme.textSecondary }]}
            >
              This was a practice run. Results were not saved to your history.
            </ThemedText>
          </View>

          <View style={styles.actions}>
            <Button onPress={handleDone}>Done</Button>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

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
          <ScoreCircle score={lastRun!.scorePercentage} />
        </View>

        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <View
              style={[styles.statIcon, { backgroundColor: theme.success + "1A" }]}
            >
              <Feather name="check-circle" size={20} color={theme.success} />
            </View>
            <ThemedText type="h4">{lastRun!.correctCount}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Correct
            </ThemedText>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <View
              style={[styles.statIcon, { backgroundColor: theme.error + "1A" }]}
            >
              <Feather name="x-circle" size={20} color={theme.error} />
            </View>
            <ThemedText type="h4">{lastRun!.wrongCount}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Wrong
            </ThemedText>
          </View>
        </View>

        {wrongAnswers.length > 0 ? (
          <View style={styles.mistakesSection}>
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
          </View>
        )}

        <View style={styles.actions}>
          <Button onPress={handleDone}>Done</Button>
        </View>
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
    marginBottom: Spacing.xl,
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
  mistakesSection: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionButton: {},
  perfectScore: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  actions: {
    gap: Spacing.md,
  },
  miniRunContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
});
