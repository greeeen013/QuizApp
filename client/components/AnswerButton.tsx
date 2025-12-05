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

interface AnswerButtonProps {
  text: string;
  state: "default" | "selected" | "correct" | "wrong";
  onPress: () => void;
  disabled?: boolean;
  showIcon?: boolean;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnswerButton({
  text,
  state,
  onPress,
  disabled = false,
  showIcon = true,
}: AnswerButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.98, springConfig);
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1, springConfig);
    }
  };

  const getStyles = () => {
    switch (state) {
      case "correct":
        return {
          backgroundColor: theme.success + "1A",
          borderColor: theme.success,
          textColor: theme.success,
          icon: "check" as const,
        };
      case "wrong":
        return {
          backgroundColor: theme.error + "1A",
          borderColor: theme.error,
          textColor: theme.error,
          icon: "x" as const,
        };
      case "selected":
        return {
          backgroundColor: theme.backgroundDefault,
          borderColor: theme.primary,
          textColor: theme.text,
          icon: null,
        };
      default:
        return {
          backgroundColor: theme.backgroundDefault,
          borderColor: theme.border,
          textColor: theme.text,
          icon: null,
        };
    }
  };

  const stateStyles = getStyles();

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: stateStyles.backgroundColor,
          borderColor: stateStyles.borderColor,
          opacity: disabled && state === "default" ? 0.5 : 1,
        },
        animatedStyle,
      ]}
    >
      <ThemedText style={[styles.text, { color: stateStyles.textColor }]}>
        {text}
      </ThemedText>
      {showIcon && stateStyles.icon ? (
        <View style={styles.iconContainer}>
          <Feather name={stateStyles.icon} size={20} color={stateStyles.textColor} />
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    minHeight: 52,
  },
  text: {
    flex: 1,
    fontSize: 16,
  },
  iconContainer: {
    marginLeft: Spacing.sm,
  },
});
