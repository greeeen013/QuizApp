import React from "react";
import { StyleSheet, Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface SettingsRowProps {
  label: string;
  description?: string;
  icon?: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

export function SettingsRow({
  label,
  description,
  icon,
  onPress,
  rightElement,
  showChevron = false,
}: SettingsRowProps) {
  const { theme } = useTheme();

  const content = (
    <>
      {icon ? (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <Feather name={icon} size={20} color={theme.primary} />
        </View>
      ) : null}
      <View style={styles.textContainer}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        {description ? (
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {description}
          </ThemedText>
        ) : null}
      </View>
      {rightElement}
      {showChevron ? (
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.container,
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  label: {
    fontSize: 16,
  },
});
