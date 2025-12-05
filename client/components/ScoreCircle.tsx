import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface ScoreCircleProps {
  score: number;
  size?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ScoreCircle({ score, size = 180 }: ScoreCircleProps) {
  const { theme } = useTheme();
  const progress = useSharedValue(0);

  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    progress.value = withTiming(score / 100, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [score, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const getScoreColor = () => {
    if (score >= 80) return theme.success;
    if (score >= 50) return theme.primary;
    return theme.error;
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.backgroundSecondary}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getScoreColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.content}>
        <ThemedText
          style={[styles.score, { color: getScoreColor() }]}
        >
          {Math.round(score)}%
        </ThemedText>
        <ThemedText
          type="small"
          style={[styles.label, { color: theme.textSecondary }]}
        >
          Score
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    position: "absolute",
  },
  content: {
    alignItems: "center",
  },
  score: {
    fontSize: 40,
    fontWeight: "700",
  },
  label: {
    marginTop: Spacing.xs,
  },
});
