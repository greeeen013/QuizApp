import React from "react";
import { StyleSheet, Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { Question } from "@/lib/store";

interface QuestionCardProps {
  question: Question;
  index: number;
  onPress: () => void;
  onDelete: () => void;
  dragHandle?: React.ReactNode;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function QuestionCard({
  question,
  index,
  onPress,
  onDelete,
  dragHandle,
}: QuestionCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const correctAnswerCount = question.answers.filter((a) => a.isCorrect).length;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: theme.border,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.indexContainer}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {index + 1}
        </ThemedText>
      </View>
      <View style={styles.content}>
        <ThemedText numberOfLines={2} style={styles.questionText}>
          {question.text}
        </ThemedText>
        <View style={styles.meta}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {question.answers.length} answer{question.answers.length !== 1 ? "s" : ""}
          </ThemedText>
          {correctAnswerCount > 0 ? (
            <View style={styles.correctBadge}>
              <Feather name="check" size={12} color={theme.success} />
              <ThemedText
                type="small"
                style={{ color: theme.success }}
              >
                {correctAnswerCount} correct
              </ThemedText>
            </View>
          ) : (
            <View style={styles.correctBadge}>
              <Feather name="alert-circle" size={12} color={theme.error} />
              <ThemedText
                type="small"
                style={{ color: theme.error }}
              >
                No correct answer
              </ThemedText>
            </View>
          )}
        </View>
      </View>
      <Pressable
        onPress={onDelete}
        hitSlop={8}
        style={({ pressed }) => [
          styles.deleteButton,
          { opacity: pressed ? 0.5 : 1 },
        ]}
      >
        <Feather name="trash-2" size={18} color={theme.error} />
      </Pressable>
      {dragHandle}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  indexContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  questionText: {
    marginBottom: Spacing.xs,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  correctBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deleteButton: {
    padding: Spacing.sm,
    marginRight: Spacing.xs,
  },
});
