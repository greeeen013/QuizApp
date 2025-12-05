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

  const { runId } = route.params;
  const run = getRun(runId);
  const quiz = run ? getQuiz(run.quizId) : undefined;

  const mistakes = useMemo<MistakeItem[]>(() => {
    if (!run || !quiz) return [];
    return run.answers
      .filter((a) => !a.isCorrect)
      .map((a) => {
        const question = quiz.questions.find((q) => q.id === a.questionId);
        const selectedAnswers =
          question?.answers
            .filter((ans) => a.selectedAnswerIds.includes(ans.id))
            .map((ans) => ans.text) ?? [];
        const correctAnswers =
          question?.answers
            .filter((ans) => ans.isCorrect)
            .map((ans) => ans.text) ?? [];
        return {
          questionId: a.questionId,
          questionText: question?.text ?? "Unknown question",
          questionImages: question?.images,
          selectedAnswers,
          correctAnswers,
        };
      });
  }, [run, quiz]);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleRetryMistakes = useCallback(() => {
    if (!run) return;
    navigation.navigate("ActiveQuiz", {
      testId: run.quizId,
      shuffle: false,
      questionIds: mistakes.map((m) => m.questionId),
    });
  }, [run, mistakes, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderButton onPress={handleClose}>
          <Feather name="x" size={22} color={theme.text} />
        </HeaderButton>
      ),
    });
  }, [navigation, handleClose, theme.text]);

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
        <ThemedText type="h4" style={styles.questionText}>
          {item.questionText}
        </ThemedText>
      </View>

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
        data={mistakes}
        keyExtractor={(item) => item.questionId}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="h4">
              {mistakes.length} Question{mistakes.length !== 1 ? "s" : ""} Wrong
            </ThemedText>
          </View>
        }
        ListFooterComponent={
          mistakes.length > 0 ? (
            <View style={styles.footer}>
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
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
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
    marginTop: Spacing.md,
  },
});
