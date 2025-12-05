import React, { useState, useCallback, useLayoutEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
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
  const { getQuiz, addQuestion, updateQuestion, settings } = useStore();

  const { testId, questionId } = route.params;
  const quiz = getQuiz(testId);
  const existingQuestion = quiz?.questions.find((q) => q.id === questionId);

  const [questionText, setQuestionText] = useState(
    existingQuestion?.text ?? ""
  );
  const [answers, setAnswers] = useState<Answer[]>(
    existingQuestion?.answers ?? [
      { id: generateId(), text: "", isCorrect: false },
      { id: generateId(), text: "", isCorrect: false },
    ]
  );
  const [images, setImages] = useState<string[]>(
    existingQuestion?.images ?? []
  );
  const [hasChanges, setHasChanges] = useState(false);

  const isValid =
    questionText.trim().length > 0 &&
    answers.length >= 2 &&
    answers.some((a) => a.isCorrect) &&
    answers.filter((a) => a.text.trim().length > 0).length >= 2;

  const handleSave = useCallback(() => {
    if (!isValid) return;

    if (settings.vibrationEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const validAnswers = answers.filter((a) => a.text.trim().length > 0);

    if (existingQuestion) {
      updateQuestion(testId, questionId!, {
        text: questionText.trim(),
        answers: validAnswers,
        images,
      });
    } else {
      addQuestion(testId, {
        text: questionText.trim(),
        answers: validAnswers,
        images,
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
    images,
  ]);

  const handleCancel = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        "Discard changes?",
        "You have unsaved changes. Are you sure you want to discard them?",
        [
          { text: "Keep Editing", style: "cancel" },
          { text: "Discard", style: "destructive", onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [navigation, hasChanges]);

  const handleAddAnswer = useCallback(() => {
    if (answers.length >= 6) {
      Alert.alert("Maximum answers", "You can only add up to 6 answers.");
      return;
    }
    if (settings.vibrationEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setAnswers((prev) => [
      ...prev,
      { id: generateId(), text: "", isCorrect: false },
    ]);
    setHasChanges(true);
  }, [answers.length, settings.vibrationEnabled]);

  const handleRemoveAnswer = useCallback(
    (answerId: string) => {
      if (answers.length <= 2) {
        Alert.alert("Minimum answers", "You need at least 2 answers.");
        return;
      }
      if (settings.vibrationEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setAnswers((prev) => {
        const filtered = prev.filter((a) => a.id !== answerId);
        if (!filtered.some((a) => a.isCorrect) && filtered.length > 0) {
          filtered[0].isCorrect = true;
        }
        return filtered;
      });
      setHasChanges(true);
    },
    [answers.length, settings.vibrationEnabled]
  );

  const handleAnswerTextChange = useCallback((answerId: string, text: string) => {
    setAnswers((prev) =>
      prev.map((a) => (a.id === answerId ? { ...a, text } : a))
    );
    setHasChanges(true);
  }, []);

  const handleSetCorrect = useCallback((answerId: string) => {
    if (settings.vibrationEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setAnswers((prev) =>
      prev.map((a) =>
        a.id === answerId ? { ...a, isCorrect: !a.isCorrect } : a
      )
    );
    setHasChanges(true);
  }, [settings.vibrationEnabled]);

  const handlePasteImage = useCallback(async () => {
    // Check for URL first
    const hasString = await Clipboard.hasStringAsync();
    if (hasString) {
      const text = await Clipboard.getStringAsync();
      const trimmedText = text.trim();
      if (
        trimmedText &&
        (trimmedText.toLowerCase().startsWith("http://") ||
          trimmedText.toLowerCase().startsWith("https://"))
      ) {
        if (settings.vibrationEnabled) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setImages((prev) => [...prev, trimmedText]);
        setHasChanges(true);
        return;
      }
    }

    // Check for image data
    const hasImage = await Clipboard.hasImageAsync();
    if (!hasImage) {
      Alert.alert(
        "No Image or URL",
        "Clipboard does not contain an image or a valid URL."
      );
      return;
    }

    const image = await Clipboard.getImageAsync({ format: "png" });
    if (image?.data) {
      if (settings.vibrationEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setImages((prev) => [...prev, image.data]);
      setHasChanges(true);
    }
  }, [settings.vibrationEnabled]);

  const handlePickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0].base64) {
      if (settings.vibrationEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setImages((prev) => [...prev, result.assets[0].base64!]);
      setHasChanges(true);
    }
  }, [settings.vibrationEnabled]);

  const handleRemoveImage = useCallback(
    (index: number) => {
      Alert.alert("Remove Image", "Are you sure you want to remove this image?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setImages((prev) => prev.filter((_, i) => i !== index));
            setHasChanges(true);
          },
        },
      ]);
    },
    []
  );

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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 44 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>
              Question Text
            </ThemedText>
            <TextInput
              value={questionText}
              onChangeText={(text) => {
                setQuestionText(text);
                setHasChanges(true);
              }}
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

          <View style={styles.inputGroup}>
            <View style={styles.sectionHeader}>
              <ThemedText type="small" style={styles.label}>
                Images
              </ThemedText>
              <View style={styles.imageActions}>
                <Pressable
                  onPress={handlePasteImage}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <ThemedText style={{ color: theme.primary, fontSize: 14 }}>
                    Paste
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={handlePickImage}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <ThemedText style={{ color: theme.primary, fontSize: 14 }}>
                    Pick
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.imagesContainer}>
                {images.map((img, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image
                      source={{
                        uri: img.startsWith("http")
                          ? img
                          : `data:image/png;base64,${img}`,
                      }}
                      style={styles.imageThumbnail}
                    />
                    <Pressable
                      style={styles.removeImageButton}
                      onPress={() => handleRemoveImage(index)}
                    >
                      <Feather name="x" size={12} color="white" />
                    </Pressable>
                  </View>
                ))}
              </View>
            </ScrollView>
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
      </KeyboardAvoidingView>
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
  addButton: {
    marginTop: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  imageActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  imagesContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    backgroundColor: "#00000010",
  },
  imageThumbnail: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
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
