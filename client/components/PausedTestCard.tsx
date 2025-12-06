import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { PausedRun, useStore } from "@/lib/store";

interface PausedTestCardProps {
    pausedRun: PausedRun;
    onResume: () => void;
    onDelete: () => void;
}

export function PausedTestCard({ pausedRun, onResume, onDelete }: PausedTestCardProps) {
    const { theme } = useTheme();
    const { getQuiz } = useStore();
    const quiz = getQuiz(pausedRun.quizId);

    const progress = Math.round(
        (pausedRun.answers.length / (pausedRun.questionIds?.length || quiz?.questions.length || 1)) * 100
    );

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: theme.backgroundSecondary },
            ]}
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <ThemedText type="h4" style={styles.title}>
                        {quiz?.title || "Unknown Test"}
                    </ThemedText>
                    <View style={[styles.badge, { backgroundColor: theme.primary + "20" }]}>
                        <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>
                            Paused
                        </ThemedText>
                    </View>
                </View>

                <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
                    {new Date(pausedRun.timestamp).toLocaleDateString()} • {progress}% completed
                </ThemedText>

                <View style={styles.actions}>
                    <Pressable
                        onPress={onDelete}
                        style={({ pressed }) => [
                            styles.iconButton,
                            { opacity: pressed ? 0.7 : 1, backgroundColor: theme.error + "15" },
                        ]}
                    >
                        <Feather name="trash-2" size={18} color={theme.error} />
                    </Pressable>

                    <Pressable
                        onPress={onResume}
                        style={({ pressed }) => [
                            styles.resumeButton,
                            { opacity: pressed ? 0.9 : 1, backgroundColor: theme.primary },
                        ]}
                    >
                        <ThemedText type="small" style={{ color: "#fff", fontWeight: "600" }}>
                            Resume
                        </ThemedText>
                        <Feather name="play" size={16} color="#fff" />
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.md,
        overflow: "hidden",
    },
    content: {
        padding: Spacing.md,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: Spacing.sm,
    },
    title: {
        flex: 1,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    actions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        marginTop: Spacing.md,
        gap: Spacing.md,
    },
    iconButton: {
        padding: 8,
        borderRadius: BorderRadius.sm,
        alignItems: "center",
        justifyContent: "center",
    },
    resumeButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: BorderRadius.sm,
    },
});
