import React, { useState, useCallback, useLayoutEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useStore, Answer } from "@/lib/store";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "QuestionEditor">;

const generateId = () => Math.random().toString(36).substring(2, 15);

export default function QuestionEditorScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { getQuiz, addQuestion, updateQuestion } = useStore();

  const { testId, questionId } = route.params;
  const quiz = getQuiz(testId);
  const existingQuestion = quiz?.questions.find((q) => q.id === questionId);

  const [questionText, setQuestionText] = useState(
    existingQuestion?.text ?? ""
  );
  const [answers, setAnswers] = useState<Answer[]>(
    existingQuestion?.answers ?? [
      { id: generateId(), text: "", isCorrect: true },
      { id: generateId(), text: "", isCorrect: false },
    ]
  );

  const isValid =
    questionText.trim().length > 0 &&
    answers.length >= 2 &&
    answers.some((a) => a.isCorrect) &&
    answers.filter((a) => a.text.trim().length > 0).length >= 2;

  const handleSave = useCallback(() => {
    if (!isValid) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const validAnswers = answers.filter((a) => a.text.trim().length > 0);

    if (existingQuestion) {
      updateQuestion(testId, questionId!, {
        text: questionText.trim(),
        answers: validAnswers,
      });
    } else {
      addQuestion(testId, {
        text: questionText.trim(),
        answers: validAnswers,
      });
    }
    navigation.goBack();
  }, [
    isValid,
    answers,
    existingQuestion,
    questionText,
    testId,
    questionId,
    updateQuestion,
    addQuestion,
    navigation,
  ]);

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleAddAnswer = useCallback(() => {
    if (answers.length >= 6) {
      Alert.alert("Maximum answers", "You can only add up to 6 answers.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAnswers((prev) => [
      ...prev,
      { id: generateId(), text: "", isCorrect: false },
    ]);
  }, [answers.length]);

  const handleRemoveAnswer = useCallback(
    (answerId: string) => {
      if (answers.length <= 2) {
        Alert.alert("Minimum answers", "You need at least 2 answers.");
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setAnswers((prev) => {
        const filtered = prev.filter((a) => a.id !== answerId);
        if (!filtered.some((a) => a.isCorrect) && filtered.length > 0) {
          filtered[0].isCorrect = true;
        }
        return filtered;
      });
    },
    [answers.length]
  );

  const handleAnswerTextChange = useCallback((answerId: string, text: string) => {
    setAnswers((prev) =>
      prev.map((a) => (a.id === answerId ? { ...a, text } : a))
    );
  }, []);

  const handleSetCorrect = useCallback((answerId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAnswers((prev) =>
      prev.map((a) => ({ ...a, isCorrect: a.id === answerId }))
    );
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: existingQuestion ? "Edit Question" : "New Question",
      headerLeft: () => (
        <HeaderButton onPress={handleCancel}>
          <ThemedText style={{ color: theme.primary }}>Cancel</ThemedText>
        </HeaderButton>
      ),
      headerRight: () => (
        <HeaderButton onPress={handleSave} disabled={!isValid}>
          <ThemedText
            style={{
              color: theme.primary,
              opacity: isValid ? 1 : 0.5,
              fontWeight: "600",
            }}
          >
            Done
          </ThemedText>
        </HeaderButton>
      ),
    });
  }, [
    navigation,
    existingQuestion,
    handleCancel,
    handleSave,
    isValid,
    theme.primary,
  ]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inputGroup}>
          <ThemedText type="small" style={styles.label}>
            Question *
          </ThemedText>
          <TextInput
            value={questionText}
            onChangeText={setQuestionText}
            placeholder="Enter your question"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={3}
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: theme.backgroundDefault,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
          />
        </View>

        <View style={styles.answersSection}>
          <ThemedText type="small" style={styles.label}>
            Answers (tap circle to mark correct) *
          </ThemedText>
          {answers.map((answer, index) => (
            <View
              key={answer.id}
              style={[
                styles.answerRow,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: answer.isCorrect ? theme.success : theme.border,
                },
              ]}
            >
              <Pressable
                onPress={() => handleSetCorrect(answer.id)}
                hitSlop={8}
                style={styles.radioButton}
              >
                <View
                  style={[
                    styles.radioOuter,
                    {
                      borderColor: answer.isCorrect
                        ? theme.success
                        : theme.textSecondary,
                    },
                  ]}
                >
                  {answer.isCorrect ? (
                    <View
                      style={[
                        styles.radioInner,
                        { backgroundColor: theme.success },
                      ]}
                    />
                  ) : null}
                </View>
              </Pressable>
              <TextInput
                value={answer.text}
                onChangeText={(text) => handleAnswerTextChange(answer.id, text)}
                placeholder={`Answer ${index + 1}`}
                placeholderTextColor={theme.textSecondary}
                style={[styles.answerInput, { color: theme.text }]}
              />
              <Pressable
                onPress={() => handleRemoveAnswer(answer.id)}
                hitSlop={8}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.5 : 1,
                  padding: Spacing.sm,
                })}
              >
                <Feather name="x" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>
          ))}
          {answers.length < 6 ? (
            <Pressable
              onPress={handleAddAnswer}
              style={({ pressed }) => [
                styles.addAnswerButton,
                {
                  borderColor: theme.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Feather name="plus" size={20} color={theme.primary} />
              <ThemedText style={{ color: theme.primary }}>
                Add Answer
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "500",
  },
  input: {
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    textAlignVertical: "top",
  },
  answersSection: {},
  answerRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.md,
  },
  radioButton: {
    padding: Spacing.xs,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  answerInput: {
    flex: 1,
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  addAnswerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
});
