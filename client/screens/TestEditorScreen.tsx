import React, { useState, useCallback, useLayoutEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  Alert,
  Pressable,
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
import { QuestionCard } from "@/components/QuestionCard";
import { useStore, Question } from "@/lib/store";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { TestsStackParamList } from "@/navigation/TestsStackNavigator";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<
  TestsStackParamList & RootStackParamList
>;
type RouteProps = RouteProp<TestsStackParamList, "TestEditor">;

interface TestEditorHeaderProps {
  title: string;
  setTitle: (text: string) => void;
  description: string;
  setDescription: (text: string) => void;
  questionCount: number;
}

const TestEditorHeader = React.memo(
  ({
    title,
    setTitle,
    description,
    setDescription,
    questionCount,
  }: TestEditorHeaderProps) => {
    const { theme } = useTheme();

    return (
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <ThemedText type="small" style={styles.label}>
            Title *
          </ThemedText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter test title"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundDefault,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
          />
        </View>
        <View style={styles.inputGroup}>
          <ThemedText type="small" style={styles.label}>
            Description
          </ThemedText>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description (optional)"
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
        <View style={styles.questionsHeader}>
          <ThemedText type="h4">Questions ({questionCount})</ThemedText>
        </View>
      </View>
    );
  }
);

export default function TestEditorScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { getQuiz, addQuiz, updateQuiz, deleteQuestion, reorderQuestions } =
    useStore();

  const testId = route.params?.testId;
  const existingQuiz = testId ? getQuiz(testId) : undefined;

  const [title, setTitle] = useState(existingQuiz?.title ?? "");
  const [description, setDescription] = useState(
    existingQuiz?.description ?? ""
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [currentQuizId, setCurrentQuizId] = useState<string | undefined>(
    testId
  );

  const quiz = currentQuizId ? getQuiz(currentQuizId) : undefined;
  const questions = quiz?.questions ?? [];

  const sortedQuestions = [...questions].sort(
    (a, b) => a.orderIndex - b.orderIndex
  );

  const isValid = title.trim().length > 0;

  const handleSave = useCallback(() => {
    if (!isValid) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (currentQuizId && quiz) {
      updateQuiz(currentQuizId, {
        title: title.trim(),
        description: description.trim(),
      });
    } else {
      const newQuiz = addQuiz({
        title: title.trim(),
        description: description.trim(),
        questions: [],
      });
      setCurrentQuizId(newQuiz.id);
    }
    setHasChanges(false);
    navigation.goBack();
  }, [
    isValid,
    currentQuizId,
    quiz,
    title,
    description,
    updateQuiz,
    addQuiz,
    navigation,
  ]);

  const handleCancel = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        "Discard changes?",
        "You have unsaved changes. Are you sure you want to discard them?",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [hasChanges, navigation]);

  const handleAddQuestion = useCallback(() => {
    if (!currentQuizId) {
      if (!isValid) {
        Alert.alert("Add Title", "Please add a title before adding questions.");
        return;
      }
      const newQuiz = addQuiz({
        title: title.trim(),
        description: description.trim(),
        questions: [],
      });
      setCurrentQuizId(newQuiz.id);
      setHasChanges(false);
      navigation.navigate("QuestionEditor", { testId: newQuiz.id });
    } else {
      navigation.navigate("QuestionEditor", { testId: currentQuizId });
    }
  }, [
    currentQuizId,
    isValid,
    title,
    description,
    addQuiz,
    navigation,
  ]);

  const handleEditQuestion = useCallback(
    (questionId: string) => {
      if (currentQuizId) {
        navigation.navigate("QuestionEditor", {
          testId: currentQuizId,
          questionId,
        });
      }
    },
    [currentQuizId, navigation]
  );

  const handleDeleteQuestion = useCallback(
    (questionId: string) => {
      if (!currentQuizId) return;
      Alert.alert(
        "Delete Question",
        "Are you sure you want to delete this question?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning
              );
              deleteQuestion(currentQuizId, questionId);
            },
          },
        ]
      );
    },
    [currentQuizId, deleteQuestion]
  );

  const handleMoveQuestion = useCallback(
    (fromIndex: number, direction: "up" | "down") => {
      if (!currentQuizId) return;
      const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
      if (toIndex < 0 || toIndex >= sortedQuestions.length) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newOrder = [...sortedQuestions];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, moved);
      reorderQuestions(
        currentQuizId,
        newOrder.map((q) => q.id)
      );
    },
    [currentQuizId, sortedQuestions, reorderQuestions]
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: existingQuiz ? "Edit Test" : "New Test",
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
            Save
          </ThemedText>
        </HeaderButton>
      ),
    });
  }, [
    navigation,
    existingQuiz,
    handleCancel,
    handleSave,
    isValid,
    theme.primary,
  ]);

  const renderQuestion = useCallback(
    ({ item, index }: { item: Question; index: number }) => (
      <View style={styles.questionItem}>
        <QuestionCard
          question={item}
          index={index}
          onPress={() => handleEditQuestion(item.id)}
          onDelete={() => handleDeleteQuestion(item.id)}
          dragHandle={
            <View style={styles.reorderButtons}>
              <Pressable
                onPress={() => handleMoveQuestion(index, "up")}
                disabled={index === 0}
                hitSlop={8}
                style={({ pressed }) => ({
                  opacity: index === 0 ? 0.3 : pressed ? 0.5 : 1,
                })}
              >
                <Feather
                  name="chevron-up"
                  size={20}
                  color={theme.textSecondary}
                />
              </Pressable>
              <Pressable
                onPress={() => handleMoveQuestion(index, "down")}
                disabled={index === sortedQuestions.length - 1}
                hitSlop={8}
                style={({ pressed }) => ({
                  opacity:
                    index === sortedQuestions.length - 1
                      ? 0.3
                      : pressed
                        ? 0.5
                        : 1,
                })}
              >
                <Feather
                  name="chevron-down"
                  size={20}
                  color={theme.textSecondary}
                />
              </Pressable>
            </View>
          }
        />
      </View>
    ),
    [
      handleEditQuestion,
      handleDeleteQuestion,
      handleMoveQuestion,
      theme.textSecondary,
      sortedQuestions.length,
    ]
  );

  const header = (
    <TestEditorHeader
      title={title}
      setTitle={(text) => {
        setTitle(text);
        setHasChanges(true);
      }}
      description={description}
      setDescription={(text) => {
        setDescription(text);
        setHasChanges(true);
      }}
      questionCount={sortedQuestions.length}
    />
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <Button onPress={handleAddQuestion} style={styles.addButton}>
        Add Question
      </Button>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={sortedQuestions}
        keyExtractor={(item) => item.id}
        renderItem={renderQuestion}
        ListHeaderComponent={header}
        ListFooterComponent={renderFooter}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />
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
  form: {
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "500",
  },
  input: {
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    textAlignVertical: "top",
  },
  questionsHeader: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  questionItem: {},
  separator: {
    height: Spacing.sm,
  },
  reorderButtons: {
    marginLeft: Spacing.xs,
  },
  footer: {
    marginTop: Spacing.lg,
  },
  addButton: {},
});
