import React, { useState, useCallback, useLayoutEffect } from "react";
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
import { ToggleSwitch } from "@/components/ToggleSwitch";
import { useStore } from "@/lib/store";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "PreQuiz">;

export default function PreQuizScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { getQuiz, settings } = useStore();

  const { testId } = route.params;
  const quiz = getQuiz(testId);

  const [shuffle, setShuffle] = useState(settings.defaultShuffle);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleStartQuiz = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.replace("ActiveQuiz", {
      testId,
      shuffle,
    });
  }, [navigation, testId, shuffle]);

  const handleEditQuiz = useCallback(() => {
    navigation.navigate("Main", {
      screen: "TestsTab",
      params: {
        screen: "TestEditor",
        params: { testId },
      },
    } as any);
  }, [navigation, testId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: quiz?.title ?? "Start Quiz",
      headerRight: () => (
        <HeaderButton onPress={handleClose}>
          <Feather name="x" size={22} color={theme.text} />
        </HeaderButton>
      ),
    });
  }, [navigation, quiz?.title, handleClose, theme.text]);

  if (!quiz) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyContainer}>
          <ThemedText>Quiz not found</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const validQuestions = quiz.questions.filter(
    (q) => q.answers.some((a) => a.isCorrect)
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.quizInfo}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.primary + "1A" },
            ]}
          >
            <Feather name="file-text" size={40} color={theme.primary} />
          </View>
          <ThemedText type="h3" style={styles.title}>
            {quiz.title}
          </ThemedText>
          {quiz.description ? (
            <ThemedText
              style={[styles.description, { color: theme.textSecondary }]}
            >
              {quiz.description}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.stats}>
          <View
            style={[
              styles.statItem,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <Feather name="help-circle" size={20} color={theme.primary} />
            <ThemedText type="h4">{validQuestions.length}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Questions
            </ThemedText>
          </View>
        </View>

        {validQuestions.length === 0 ? (
          <View
            style={[
              styles.warningCard,
              {
                backgroundColor: theme.error + "1A",
                borderColor: theme.error,
              },
            ]}
          >
            <Feather name="alert-circle" size={20} color={theme.error} />
            <View style={styles.warningContent}>
              <ThemedText style={{ color: theme.error, fontWeight: "600" }}>
                No valid questions
              </ThemedText>
              <ThemedText
                type="small"
                style={{ color: theme.error }}
              >
                Add questions with correct answers to start the quiz
              </ThemedText>
            </View>
          </View>
        ) : null}

        <View style={styles.options}>
          <ThemedText type="small" style={[styles.optionsTitle, { color: theme.textSecondary }]}>
            OPTIONS
          </ThemedText>
          <View
            style={[
              styles.optionCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Feather name="shuffle" size={20} color={theme.primary} />
                <View>
                  <ThemedText>Shuffle Questions</ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Randomize question order
                  </ThemedText>
                </View>
              </View>
              <ToggleSwitch value={shuffle} onValueChange={setShuffle} />
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            onPress={handleStartQuiz}
            disabled={validQuestions.length === 0}
          >
            Start Quiz
          </Button>
          <Button
            onPress={handleEditQuiz}
            style={[
              styles.editButton,
              {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText style={{ fontWeight: "600" }}>Edit Quiz</ThemedText>
          </Button>
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
  quizInfo: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  description: {
    textAlign: "center",
  },
  stats: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  statItem: {
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    minWidth: 100,
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  warningContent: {
    flex: 1,
    gap: 4,
  },
  options: {
    marginBottom: Spacing.xl,
  },
  optionsTitle: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  optionCard: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  actions: {
    gap: Spacing.md,
  },
  editButton: {},
});
