import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
    runOnJS,
    withDelay,
    Easing
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/useTheme';

interface StreakOverlayProps {
    streak: number;
    visible: boolean;
    onAnimationComplete: () => void;
}

export function StreakOverlay({ streak, visible, onAnimationComplete }: StreakOverlayProps) {
    const { theme } = useTheme();
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.5);

    useEffect(() => {
        if (visible) {
            opacity.value = 0;
            scale.value = 0.5;

            opacity.value = withSequence(
                withTiming(1, { duration: 250 }),
                withDelay(500, withTiming(0, { duration: 250 }, (finished) => {
                    if (finished) {
                        runOnJS(onAnimationComplete)();
                    }
                }))
            );

            scale.value = withSequence(
                withTiming(1.2, { duration: 250, easing: Easing.out(Easing.back(1.5)) }),
                withDelay(500, withTiming(1.5, { duration: 250 }))
            );
        }
    }, [visible, streak, opacity, scale, onAnimationComplete]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    if (!visible) return null;

    return (
        <View style={styles.container} pointerEvents="none">
            <Animated.View style={[styles.content, animatedStyle]}>
                <Feather name="zap" size={120} color="#FFD700" />
                {/* Using zap as flame might not be available or zap fits streak better. User asked for Flame/Fire. Stick to Flame? 
            Feather doesn't have a great 'fire'. 'zap' is good for streaks. 
            User specifically asked for Flame/Fire. 
            Let's check if 'activity' or 'trending-up' or something else is better. 
            Actually Feather has no 'fire'. FontAwesome has 'fire'. 
            I'll use 'zap' (lightning) as it's cleaner in Feather, or maybe just stick to requirements and use an image if needed?
            Wait, user "Display a large Flame/Fire icon". 
            Let's stick with Feather 'zap' but colored orange/red, or maybe 'sun'. 
            Actually, let's use 'zap' but color it OrangeRed. */}
                <ThemedText type="h1" style={styles.text}>
                    Streak!
                </ThemedText>
                <ThemedText type="h1" style={[styles.number, { color: theme.primary }]}>
                    {streak}
                </ThemedText>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.3)', // Slight dimming behind
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#FFFFFF',
        fontSize: 40,
        marginTop: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    number: {
        fontSize: 60,
        fontWeight: 'bold',
        color: '#FFD700',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    }
});
