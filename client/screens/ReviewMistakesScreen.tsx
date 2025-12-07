import React, { useMemo, useLayoutEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, Image, Dimensions, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useStore } from "@/lib/store";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "ReviewMistakes">;

interface MistakeItem {
  questionId: string;
  questionText: string;
  questionImages?: string[];
  selectedAnswers: string[];
  correctAnswers: string[];
}

export default function ReviewMistakesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { getRun, getQuiz } = useStore();

  const { runId, mode = 'mistakes' } = route.params;
  const run = getRun(runId);
  const quiz = run ? getQuiz(run.quizId) : undefined;

  const questionsToReview = useMemo<MistakeItem[]>(() => {
    if (!run || !quiz) return [];

    let answersToReview = run.answers;
    if (mode === 'mistakes') {
      answersToReview = run.answers.filter((a) => !a.isCorrect);
    }
    // If mode is 'all', we use all answers

    const seenQuestions = new Set<string>();

    return answersToReview.reduce<MistakeItem[]>((acc, a) => {
      if (seenQuestions.has(a.questionId)) return acc;
      seenQuestions.add(a.questionId);

      const question = quiz.questions.find((q) => q.id === a.questionId);
      const selectedAnswers =
        question?.answers
          .filter((ans) => a.selectedAnswerIds.includes(ans.id))
          .map((ans) => ans.text) ?? [];
      const correctAnswers =
        question?.answers
          .filter((ans) => ans.isCorrect)
          .map((ans) => ans.text) ?? [];

      acc.push({
        questionId: a.questionId,
        questionText: question?.text ?? "Unknown question",
        questionImages: question?.images,
        selectedAnswers,
        correctAnswers,
      });
      return acc;
    }, []);
  }, [run, quiz, mode]);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleRetryMistakes = useCallback(() => {
    if (!run) return;
    navigation.navigate("ActiveQuiz", {
      testId: run.quizId,
      shuffle: false,
      shuffleAnswers: false,
      questionIds: questionsToReview.map((m) => m.questionId),
    });
  }, [run, questionsToReview, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderButton onPress={handleClose}>
          <Feather name="x" size={22} color={theme.text} />
        </HeaderButton>
      ),
      headerTitle: mode === 'all' ? "Review Test" : "Review Mistakes",
    });
  }, [navigation, handleClose, theme.text, mode]);

  if (!run) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyContainer}>
          <ThemedText>Run not found</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const renderItem = ({ item, index }: { item: MistakeItem; index: number }) => (
    <View
      style={[
        styles.mistakeCard,
        { backgroundColor: theme.backgroundDefault },
      ]}
    >
      <View style={styles.questionHeader}>
        <View
          style={[
            styles.questionNumber,
            { backgroundColor: theme.error + "1A" },
          ]}
        >
          <ThemedText type="small" style={{ color: theme.error }}>
            {index + 1}
          </ThemedText>
        </View>
        <ThemedText type="h4" style={styles.questionText}>
          {item.questionText}
        </ThemedText>
      </View>

      {item.questionImages && item.questionImages.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imagesContainer}
        >
          {item.questionImages.map((img, imgIndex) => (
            <Image
              key={imgIndex}
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

      <View style={styles.answersSection}>
        <View style={styles.answerRow}>
          <View style={[styles.answerIcon, { backgroundColor: theme.error + "1A" }]}>
            <Feather name="x" size={14} color={theme.error} />
          </View>
          <View style={styles.answerContent}>
            <ThemedText type="small" style={{ color: theme.error }}>
              Your answer
            </ThemedText>
            {item.selectedAnswers.length > 0 ? (
              item.selectedAnswers.map((ans, i) => (
                <ThemedText key={i}>{ans}</ThemedText>
              ))
            ) : (
              <ThemedText style={{ fontStyle: "italic" }}>
                No answer selected
              </ThemedText>
            )}
          </View>
        </View>

        <View style={styles.answerRow}>
          <View
            style={[styles.answerIcon, { backgroundColor: theme.success + "1A" }]}
          >
            <Feather name="check" size={14} color={theme.success} />
          </View>
          <View style={styles.answerContent}>
            <ThemedText type="small" style={{ color: theme.success }}>
              Correct answer
            </ThemedText>
            {item.correctAnswers.map((ans, i) => (
              <ThemedText key={i}>{ans}</ThemedText>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={questionsToReview}
        keyExtractor={(item) => item.questionId}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Spacing.xl }, // Add padding for content, but bottom padding is handled by surrounding view or safe area if sticky?
          // Actually, if we have a sticky footer, we need enough padding so the last item isn't covered.
          // The sticky footer will sit on top of the list bottom.
          { paddingBottom: 100 + insets.bottom }
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="h4">
              {questionsToReview.length} Question{questionsToReview.length !== 1 ? "s" : ""}
            </ThemedText>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
      {questionsToReview.length > 0 && (
        <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + Spacing.lg, backgroundColor: theme.backgroundDefault, borderTopColor: theme.border }]}>
          <Button onPress={handleRetryMistakes}>
            Retry These Questions
          </Button>
          <ThemedText
            type="small"
            style={[styles.footerNote, { color: theme.textSecondary }]}
          >
            Practice runs won't be saved to history
          </ThemedText>
        </View>
      )}
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  mistakeCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  imagesContainer: {
    marginBottom: Spacing.md,
  },
  questionImage: {
    width: Dimensions.get("window").width - Spacing.lg * 6,
    height: 150,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
    backgroundColor: "#00000010",
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  questionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  questionText: {
    flex: 1,
    fontWeight: "500",
  },
  answersSection: {
    gap: Spacing.md,
  },
  answerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  answerIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  answerContent: {
    flex: 1,
  },
  separator: {
    height: Spacing.md,
  },
  footer: {
    marginTop: Spacing.xl,
  },
  footerNote: {
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  stickyFooter: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
});
