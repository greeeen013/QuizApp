import React from "react";
import { StyleSheet, Pressable, View, Image } from "react-native";
import Svg, { Circle, Rect, Polygon, Defs, ClipPath } from "react-native-svg";
import { useTheme } from "@/hooks/useTheme";

interface AvatarPresetProps {
  preset: number;
  imageUri?: string | null;
  size?: number;
  selected?: boolean;
  onPress?: () => void;
}

export function AvatarPreset({
  preset,
  imageUri,
  size = 64,
  selected = false,
  onPress,
}: AvatarPresetProps) {
  const { theme } = useTheme();

  const renderContent = () => {
    // If image is present, we want it to fill the shape completely.
    if (imageUri) {
      // Use Svg with ClipPath for all shapes to ensure consistency and proper masking
      const shapeId = `clip-${preset}-${size}-${Math.random()}`;

      const getClipPath = () => {
        const center = size / 2;
        switch (preset) {
          case 0: // Circle
            return <Circle cx={center} cy={center} r={size / 2} />;
          case 1: // Rounded Square
            return <Rect x={0} y={0} width={size} height={size} rx={8} />;
          case 2: // Triangle/Polygon
            // Equilateral triangle pointing up
            const height = size * (Math.sqrt(3) / 2);
            const yOffset = (size - height) / 2;
            const p1 = `${size / 2},${yOffset}`;
            const p2 = `${size},${size - yOffset}`;
            const p3 = `0,${size - yOffset}`;
            return <Polygon points={`${p1} ${p2} ${p3}`} />;
          default:
            return <Circle cx={center} cy={center} r={size / 2} />;
        }
      };

      return (
        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size}>
            <Defs>
              <ClipPath id={shapeId}>
                {getClipPath()}
              </ClipPath>
            </Defs>
            {/* 
              We use a standard Image but mask it with Svg. 
              Actually, masking a standard Image with Svg ClipPath in RN is tricky without MaskedView.
              However, we can use Svg's <Image> tag which supports clip-path!
            */}
            <SvgImage
              href={{ uri: imageUri }}
              width={size}
              height={size}
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#${shapeId})`}
            />
            {/* Optional border/stroke on top? User didn't ask for it, but it looks better. 
                If selected, we need a border.
            */}
            {selected && (
              React.cloneElement(getClipPath() as React.ReactElement<any>, {
                fill: "none",
                stroke: theme.primary,
                strokeWidth: 3
              })
            )}
          </Svg>
        </View>
      );
    }

    // No image - Solid Color Shape
    const center = size / 2;
    const renderShape = () => {
      const props = { fill: theme.primary };
      switch (preset) {
        case 0:
          return <Circle cx={center} cy={center} r={size / 2} {...props} />;
        case 1:
          return <Rect x={0} y={0} width={size} height={size} rx={8} {...props} />;
        case 2:
          const height = size * (Math.sqrt(3) / 2);
          const yOffset = (size - height) / 2;
          const p1 = `${size / 2},${yOffset}`;
          const p2 = `${size},${size - yOffset}`;
          const p3 = `0,${size - yOffset}`;
          return <Polygon points={`${p1} ${p2} ${p3}`} {...props} />;
        default:
          return <Circle cx={center} cy={center} r={size / 2} {...props} />;
      }
    };

    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {renderShape()}
          {selected && (
            React.cloneElement(renderShape() as React.ReactElement<any>, {
              fill: "none",
              stroke: theme.text, // Contrast for selected solid color? Or maybe just a ring outside?
              strokeWidth: 3
            })
          )}
        </Svg>
        {/* If selected and solid color, maybe we need a better indicator? 
             The previous implementation had a border wrapper. 
             Let's keep it simple: if selected, we draw a stroke.
         */}
      </View>
    );
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        {renderContent()}
      </Pressable>
    );
  }

  return renderContent();
}

// Need to import Image as SvgImage to avoid conflict
import { Image as SvgImage } from "react-native-svg";

const styles = StyleSheet.create({
  container: {
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
});
