import React from "react";
import { StyleSheet, Pressable, View } from "react-native";
import Svg, { Circle, Rect, Polygon } from "react-native-svg";
import { useTheme } from "@/hooks/useTheme";

interface AvatarPresetProps {
  preset: number;
  size?: number;
  selected?: boolean;
  onPress?: () => void;
}

export function AvatarPreset({
  preset,
  size = 64,
  selected = false,
  onPress,
}: AvatarPresetProps) {
  const { theme } = useTheme();

  const renderShape = () => {
    const svgSize = size * 0.6;
    const center = svgSize / 2;

    switch (preset) {
      case 0:
        return (
          <Svg width={svgSize} height={svgSize}>
            <Circle cx={center} cy={center} r={center - 4} fill={theme.primary} />
          </Svg>
        );
      case 1:
        return (
          <Svg width={svgSize} height={svgSize}>
            <Rect
              x={4}
              y={4}
              width={svgSize - 8}
              height={svgSize - 8}
              rx={6}
              fill={theme.primary}
            />
          </Svg>
        );
      case 2:
        const halfSize = svgSize / 2;
        const points = `${halfSize},4 ${svgSize - 4},${svgSize - 4} 4,${svgSize - 4}`;
        return (
          <Svg width={svgSize} height={svgSize}>
            <Polygon points={points} fill={theme.primary} />
          </Svg>
        );
      default:
        return (
          <Svg width={svgSize} height={svgSize}>
            <Circle cx={center} cy={center} r={center - 4} fill={theme.primary} />
          </Svg>
        );
    }
  };

  const content = (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor: theme.backgroundDefault,
          borderColor: selected ? theme.primary : theme.border,
          borderWidth: selected ? 2 : 1,
        },
      ]}
    >
      {renderShape()}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
});
