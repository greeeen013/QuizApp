import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
  Dimensions,
  BackHandler,
  AppState,
  AppStateStatus,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { AnswerButton } from "@/components/AnswerButton";
import { useStore, Question, QuizRunAnswer } from "@/lib/store";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "ActiveQuiz">;

// Helper to get incomplete score
const calculateIncompleteScore = (
  answers: QuizRunAnswer[],
  totalQuestions: number
) => {
  const correctCount = answers.filter((a) => a.isCorrect).length;
  // Score is based on answered questions only for "End Early" but we might want to show it as incomplete
  // Requirement: "ty % se budou vyhodnocovat správně/nesprávně odpověděno tzn. že na ty co neodpověděl se nebudou počítat"
  // So percentage is correct / answered.
  const scorePercentage =
    answers.length > 0 ? (correctCount / answers.length) * 100 : 0;
  return { correctCount, scorePercentage };
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function ActiveQuizScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { getQuiz, addRun, updateStreak, settings, savePausedRun, getPausedRun, deletePausedRun } = useStore();

  const { testId, shuffle, shuffleAnswers, questionIds, pausedRunId } = route.params;
  const quiz = getQuiz(testId);

  // Load paused run if exists
  const pausedRun = useMemo(() => {
    if (pausedRunId) {
      return getPausedRun(pausedRunId);
    }
    return undefined;
  }, [pausedRunId, getPausedRun]);

  const effectiveQuestionIds = useMemo(() => questionIds || pausedRun?.questionIds, [questionIds, pausedRun]);
  const effectiveShuffle = useMemo(() => shuffle || pausedRun?.shuffle, [shuffle, pausedRun]);
  const effectiveShuffleAnswers = useMemo(() => shuffleAnswers || pausedRun?.shuffleAnswers, [shuffleAnswers, pausedRun]);

  const questions = useMemo(() => {
    if (!quiz) return [];
    let qs = [...quiz.questions].filter((q) =>
      q.answers.some((a) => a.isCorrect)
    );

    if (effectiveQuestionIds && effectiveQuestionIds.length > 0) {
      qs = qs.filter((q) => effectiveQuestionIds.includes(q.id));
    }

    qs.sort((a, b) => a.orderIndex - b.orderIndex);

    if (effectiveShuffle) {
      qs = shuffleArray(qs);
    }

    if (effectiveShuffleAnswers) {
      qs = qs.map(q => ({
        ...q,
        answers: shuffleArray(q.answers)
      }));
    }
    return qs;
  }, [quiz, effectiveShuffle, effectiveShuffleAnswers, effectiveQuestionIds]);

  const isMiniRun = (effectiveQuestionIds && effectiveQuestionIds.length > 0) || (pausedRun?.questionIds && pausedRun.questionIds.length > 0);

  const [currentIndex, setCurrentIndex] = useState(pausedRun?.currentQuestionIndex ?? 0);
  const [selectedAnswerIds, setSelectedAnswerIds] = useState<string[]>(pausedRun?.selectedAnswerIds ?? []);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [answers, setAnswers] = useState<QuizRunAnswer[]>(pausedRun?.answers ?? []);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const progressWidth = useSharedValue(progress);

  useEffect(() => {
    progressWidth.value = withSpring(progress, { damping: 15 });
  }, [progress, progressWidth]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const safeGoBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // If we can't go back, go to Main screen
      navigation.navigate("Main");
    }
  }, [navigation]);

  const handlePause = useCallback(() => {
    if (isMiniRun) {
      safeGoBack();
      return;
    }

    savePausedRun({
      quizId: testId,
      currentQuestionIndex: currentIndex,
      selectedAnswerIds,
      answers,
      shuffle: effectiveShuffle ?? false,
      shuffleAnswers: effectiveShuffleAnswers ?? false,
      questionIds: effectiveQuestionIds,
    });

    // If we are resuming a paused run, we should delete the old one to avoid duplicates if ID changes, 
    // but here we are just saving a new state. If ID is same, it updates.
    // Actually savePausedRun generates new ID. We should probably update if exists?
    // The store implementation of savePausedRun generates a NEW ID every time.
    // We should probably delete the old one if we are pausing again.
    if (pausedRunId) {
      deletePausedRun(pausedRunId);
    }

    if (settings.vibrationEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    safeGoBack();
  }, [
    isMiniRun,
    navigation,
    savePausedRun,
    testId,
    currentIndex,
    selectedAnswerIds,
    answers,
    pausedRunId,
    deletePausedRun,
    settings.vibrationEnabled,
    effectiveShuffle,
    effectiveQuestionIds,
    safeGoBack,
  ]);

  const handleEndEarly = useCallback(() => {
    Alert.alert(
      "End Test Early?",
      "Unanswered questions will not be counted in your score.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Test",
          style: "default",
          onPress: () => {
            const { correctCount, scorePercentage } = calculateIncompleteScore(
              answers,
              questions.length
            );
            const wrongCount = answers.length - correctCount;

            if (!isMiniRun) {
              const run = addRun({
                quizId: testId,
                quizTitle: quiz?.title ?? "",
                scorePercentage,
                totalQuestions: answers.length, // Only count answered
                correctCount,
                wrongCount,
                answers,
                isIncomplete: true,
              });
              // If we were in a paused run, delete it as it is now finished
              if (pausedRunId) {
                deletePausedRun(pausedRunId);
              }
              navigation.replace("Results", { runId: run.id });
            } else {
              safeGoBack();
            }
          },
        },
      ]
    );
  }, [
    answers,
    questions.length,
    isMiniRun,
    addRun,
    testId,
    quiz,
    pausedRunId,
    pausedRunId,
    deletePausedRun,
    navigation,
    safeGoBack,
  ]);

  const handleQuit = useCallback(() => {
    Alert.alert("Exit Test", "What would you like to do?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Pause & Exit",
        onPress: handlePause,
      },
      {
        text: "End Early",
        onPress: handleEndEarly,
      },
    ]);
  }, [handlePause, handleEndEarly]);

  // Auto-save on background
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState.match(/inactive|background/) && !isMiniRun && !isSubmitted) {
        // Auto-pause
        // We can't use navigation here reliably, but we can save state.
        // However, we don't want to exit the screen.
        // Just save the state so if app is killed, it's there.
        savePausedRun({
          quizId: testId,
          currentQuestionIndex: currentIndex,
          selectedAnswerIds,
          answers,
          shuffle: effectiveShuffle ?? false,
          shuffleAnswers: effectiveShuffleAnswers ?? false,
          questionIds: effectiveQuestionIds,
        });
        // If we had a previous paused run, we should delete it to avoid clutter?
        // Or maybe savePausedRun should accept an ID to update?
        // For now, let's just save. If user comes back to same screen, nothing changes.
        // If app is killed, they can resume from this saved state.
        // Note: This might create multiple paused runs if user backgrounds multiple times.
        // Ideally store should handle upsert.
        if (pausedRunId) {
          deletePausedRun(pausedRunId);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [
    isMiniRun,
    isSubmitted,
    savePausedRun,
    testId,
    currentIndex,
    selectedAnswerIds,
    answers,
    pausedRunId,
    deletePausedRun,
    effectiveShuffle,
    effectiveShuffleAnswers,
    effectiveQuestionIds,
  ]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        handleQuit();
        return true;
      }
    );
    return () => backHandler.remove();
  }, [handleQuit]);

  const handleAnswerSelect = useCallback(
    (answerId: string) => {
      if (isSubmitted) return;
      if (settings.vibrationEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setSelectedAnswerIds((prev) => {
        if (prev.includes(answerId)) {
          return prev.filter((id) => id !== answerId);
        }
        return [...prev, answerId];
      });
    },
    [isSubmitted]
  );

  const handleSubmit = useCallback(() => {
    if (selectedAnswerIds.length === 0 || !currentQuestion) return;

    setIsSubmitted(true);

    const correctIds = currentQuestion.answers
      .filter((a) => a.isCorrect)
      .map((a) => a.id);

    const isCorrect =
      selectedAnswerIds.length === correctIds.length &&
      selectedAnswerIds.every((id) => correctIds.includes(id));

    if (isCorrect) {
      if (settings.vibrationEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      if (settings.vibrationEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }

    const newAnswer: QuizRunAnswer = {
      questionId: currentQuestion.id,
      selectedAnswerIds,
      isCorrect,
    };

    setAnswers((prev) => [...prev, newAnswer]);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedAnswerIds([]);
        setIsSubmitted(false);
      } else {
        const updatedAnswers = [...answers, newAnswer];
        const correctCount = updatedAnswers.filter((a) => a.isCorrect).length;
        const wrongCount = updatedAnswers.length - correctCount;
        const scorePercentage = (correctCount / updatedAnswers.length) * 100;

        if (!isMiniRun) {
          const run = addRun({
            quizId: testId,
            quizTitle: quiz?.title ?? "",
            scorePercentage,
            totalQuestions: updatedAnswers.length,
            correctCount,
            wrongCount,
            answers: updatedAnswers,
          });
          updateStreak();
          if (pausedRunId) {
            deletePausedRun(pausedRunId);
          }
          navigation.replace("Results", { runId: run.id });
        } else {
          const tempRunId = `temp_${Date.now()}`;
          navigation.replace("Results", { runId: tempRunId, isMiniRun: true });
        }
      }
    }, 1500);
  }, [
    selectedAnswerIds,
    currentQuestion,
    currentIndex,
    questions.length,
    answers,
    isMiniRun,
    testId,
    quiz?.title,
    addRun,
    updateStreak,
    navigation,
    pausedRunId,
    deletePausedRun,
    settings.vibrationEnabled,
  ]);

  if (!quiz || questions.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyContainer}>
          <ThemedText>No questions available</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const getAnswerState = (answerId: string) => {
    if (!isSubmitted) {
      return selectedAnswerIds.includes(answerId) ? "selected" : "default";
    }
    const answer = currentQuestion?.answers.find((a) => a.id === answerId);
    if (answer?.isCorrect) return "correct";
    if (selectedAnswerIds.includes(answerId)) return "wrong";
    return "default";
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={handleQuit}
          hitSlop={12}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: theme.primary },
                progressStyle,
              ]}
            />
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {currentIndex + 1}/{questions.length}
          </ThemedText>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          key={currentQuestion.id}
          entering={FadeIn.duration(300)}
          style={styles.questionContainer}
        >
          <View style={styles.questionCard}>
            {currentQuestion.images && currentQuestion.images.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imagesContainer}
              >
                {currentQuestion.images.map((img, index) => (
                  <Image
                    key={index}
                    source={{
                      uri: img.startsWith("http")
                        ? img
                        : `data:image/png;base64,${img}`,
                    }}
                    style={styles.questionImage}
                    resizeMode="contain"
                  />
                ))}
              </ScrollView>
            )}
            <ThemedText type="h3" style={styles.questionText}>
              {currentQuestion.text}
            </ThemedText>
          </View>
        </Animated.View>

        <View style={styles.answersContainer}>
          {currentQuestion.answers.map((answer) => (
            <AnswerButton
              key={answer.id}
              text={answer.text}
              state={getAnswerState(answer.id)}
              onPress={() => handleAnswerSelect(answer.id)}
              disabled={isSubmitted}
            />
          ))}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + Spacing.lg },
        ]}
      >
        {!isSubmitted && selectedAnswerIds.length > 0 && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.submitContainer}>
            <Button onPress={handleSubmit} style={styles.submitButton}>
              Submit Answer
            </Button>
          </Animated.View>
        )}
        {isMiniRun ? (
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Practice mode - results won't be saved
          </ThemedText>
        ) : null}
      </View>
    </ThemedView >
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  progressContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  headerPlaceholder: {
    width: 24,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    justifyContent: "center",
  },
  questionContainer: {
    marginBottom: Spacing["3xl"],
  },
  questionCard: {
    marginBottom: Spacing.xl,
  },
  imagesContainer: {
    marginBottom: Spacing.lg,
  },
  questionImage: {
    width: Dimensions.get("window").width - Spacing.lg * 4,
    height: 200,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
    backgroundColor: "#00000010",
  },
  questionText: {
    textAlign: "center",
  },
  answersContainer: {
    gap: Spacing.md,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  submitContainer: {
    width: "100%",
    marginBottom: Spacing.md,
  },
  submitButton: {
    width: "100%",
  },
});
