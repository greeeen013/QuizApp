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
import type { QuizRun } from "@/lib/store";

interface HistoryCardProps {
  run: QuizRun;
  onPress: () => void;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function HistoryCard({ run, onPress }: HistoryCardProps) {
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = () => {
    if (run.scorePercentage >= 80) return theme.success;
    if (run.scorePercentage >= 50) return theme.primary;
    return theme.error;
  };

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
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="h4" numberOfLines={1} style={styles.title}>
            {run.quizTitle}
          </ThemedText>
          <View
            style={[
              styles.scoreBadge,
              { backgroundColor: getScoreColor() + "1A" },
            ]}
          >
            <ThemedText
              style={[styles.scoreText, { color: getScoreColor() }]}
            >
              {Math.round(run.scorePercentage)}%
            </ThemedText>
          </View>
        </View>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Feather name="check-circle" size={14} color={theme.success} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {run.correctCount}
            </ThemedText>
          </View>
          <View style={styles.metaItem}>
            <Feather name="x-circle" size={14} color={theme.error} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {run.wrongCount}
            </ThemedText>
          </View>
          <View style={styles.metaItem}>
            <Feather name="calendar" size={14} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {formatDate(run.timestamp)}
            </ThemedText>
          </View>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  content: {
    flex: 1,
    marginRight: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  title: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  scoreBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.lg,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "600",
  },
  meta: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
});
