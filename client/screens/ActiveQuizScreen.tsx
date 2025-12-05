import React, { useState, useCallback, useMemo, useEffect } from "react";
import { View, StyleSheet, Pressable, Alert, BackHandler } from "react-native";
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
import { AnswerButton } from "@/components/AnswerButton";
import { useStore, Question, QuizRunAnswer } from "@/lib/store";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "ActiveQuiz">;

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
  const { getQuiz, addRun, updateStreak } = useStore();

  const { testId, shuffle, questionIds } = route.params;
  const quiz = getQuiz(testId);

  const questions = useMemo(() => {
    if (!quiz) return [];
    let qs = [...quiz.questions].filter((q) =>
      q.answers.some((a) => a.isCorrect)
    );
    if (questionIds && questionIds.length > 0) {
      qs = qs.filter((q) => questionIds.includes(q.id));
    }
    qs.sort((a, b) => a.orderIndex - b.orderIndex);
    if (shuffle) {
      qs = shuffleArray(qs);
    }
    return qs;
  }, [quiz, shuffle, questionIds]);

  const isMiniRun = questionIds && questionIds.length > 0;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answers, setAnswers] = useState<QuizRunAnswer[]>([]);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const progressWidth = useSharedValue(progress);

  useEffect(() => {
    progressWidth.value = withSpring(progress, { damping: 15 });
  }, [progress, progressWidth]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const handleQuit = useCallback(() => {
    Alert.alert("Quit Quiz?", "Your progress will be lost.", [
      { text: "Continue", style: "cancel" },
      {
        text: "Quit",
        style: "destructive",
        onPress: () => navigation.goBack(),
      },
    ]);
  }, [navigation]);

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
      if (isAnswered || !currentQuestion) return;

      setSelectedAnswerId(answerId);
      setIsAnswered(true);

      const answer = currentQuestion.answers.find((a) => a.id === answerId);
      const isCorrect = answer?.isCorrect ?? false;

      if (isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      setAnswers((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          selectedAnswerId: answerId,
          isCorrect,
        },
      ]);

      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setSelectedAnswerId(null);
          setIsAnswered(false);
        } else {
          const updatedAnswers = [
            ...answers,
            {
              questionId: currentQuestion.id,
              selectedAnswerId: answerId,
              isCorrect,
            },
          ];
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
            navigation.replace("Results", { runId: run.id });
          } else {
            const tempRunId = `temp_${Date.now()}`;
            navigation.replace("Results", { runId: tempRunId, isMiniRun: true });
          }
        }
      }, 800);
    },
    [
      isAnswered,
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
    ]
  );

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
    if (!isAnswered) {
      return selectedAnswerId === answerId ? "selected" : "default";
    }
    const answer = currentQuestion?.answers.find((a) => a.id === answerId);
    if (answer?.isCorrect) return "correct";
    if (answerId === selectedAnswerId) return "wrong";
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

      <View style={styles.content}>
        <Animated.View
          key={currentQuestion.id}
          entering={FadeIn.duration(300)}
          style={styles.questionContainer}
        >
          <ThemedText type="h3" style={styles.questionText}>
            {currentQuestion.text}
          </ThemedText>
        </Animated.View>

        <View style={styles.answersContainer}>
          {currentQuestion.answers.map((answer) => (
            <AnswerButton
              key={answer.id}
              text={answer.text}
              state={getAnswerState(answer.id)}
              onPress={() => handleAnswerSelect(answer.id)}
              disabled={isAnswered}
            />
          ))}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        {isMiniRun ? (
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Practice mode - results won't be saved
          </ThemedText>
        ) : null}
      </View>
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
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: "center",
  },
  questionContainer: {
    marginBottom: Spacing["3xl"],
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
});
