import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface StreakBadgeProps {
  count: number;
  onPress?: () => void;
}

export function StreakBadge({ count, onPress }: StreakBadgeProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.primary + "1A",
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Feather name="zap" size={16} color={theme.primary} />
      <ThemedText
        style={[styles.text, { color: theme.primary }]}
      >
        {count}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.lg,
    gap: 4,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
  },
});
