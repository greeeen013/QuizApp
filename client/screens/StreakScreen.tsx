import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { HeaderButton } from "@react-navigation/elements";
import { useStore } from "@/lib/store";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function StreakScreen() {
    const navigation = useNavigation<NavigationProp>();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const { streak, diamonds, buyFreezer } = useStore();

    const handleClose = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const handleBuyFreezer = useCallback(() => {
        if (diamonds < 100) {
            Alert.alert("Not enough diamonds", "You need 100 diamonds to buy a Streak Freezer.");
            return;
        }

        Alert.alert(
            "Buy Streak Freezer",
            "Are you sure you want to buy a Streak Freezer for 100 diamonds?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Buy",
                    onPress: () => {
                        const success = buyFreezer();
                        if (success) {
                            Alert.alert("Success", "You bought a Streak Freezer!");
                        } else {
                            Alert.alert("Error", "Something went wrong.");
                        }
                    },
                },
            ]
        );
    }, [diamonds, buyFreezer]);

    // Calendar Logic
    const calendarDays = useMemo(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

        const days = [];
        // Add empty slots for days before the 1st
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }
        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    }, []);

    const getDayStatus = (date: Date | null) => {
        if (!date) return "empty";
        const dateStr = date.toISOString().split("T")[0];
        const status = streak.history[dateStr];

        if (status === "completed") return "completed";
        if (status === "freezed") return "freezed";

        // Check if it's today and completed
        // (Already covered by history check if updateStreak works correctly)

        return "none";
    };

    return (
        <ThemedView style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
                <HeaderButton onPress={handleClose}>
                    <Feather name="x" size={24} color={theme.text} />
                </HeaderButton>
                <ThemedText type="h4">Streak</ThemedText>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Streak Stats */}
                <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
                    <View style={styles.streakHeader}>
                        <View style={styles.statItem}>
                            <Feather name="zap" size={32} color={theme.primary} />
                            <ThemedText type="h2" style={{ color: theme.primary }}>{streak.currentStreak}</ThemedText>
                            <ThemedText type="small" style={{ color: theme.textSecondary }}>Day Streak</ThemedText>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <Feather name="hexagon" size={32} color="#0EA5E9" />
                            <ThemedText type="h2" style={{ color: "#0EA5E9" }}>{Math.floor(diamonds)}</ThemedText>
                            <ThemedText type="small" style={{ color: theme.textSecondary }}>Diamonds</ThemedText>
                        </View>
                    </View>
                </View>

                {/* Shop */}
                <ThemedText type="h4" style={styles.sectionTitle}>Shop</ThemedText>
                <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
                    <View style={styles.shopItem}>
                        <View style={styles.shopIcon}>
                            <Feather name="thermometer" size={24} color="#3B82F6" />
                        </View>
                        <View style={styles.shopDetails}>
                            <ThemedText type="default" style={{ fontWeight: "600" }}>Streak Freezer</ThemedText>
                            <ThemedText type="small" style={{ color: theme.textSecondary }}>
                                You have {streak.freezers} / 3
                            </ThemedText>
                        </View>
                        <Pressable
                            onPress={handleBuyFreezer}
                            disabled={streak.freezers >= 3}
                            style={({ pressed }) => [
                                styles.buyButton,
                                { opacity: pressed || streak.freezers >= 3 ? 0.7 : 1, backgroundColor: theme.primary }
                            ]}
                        >
                            <Feather name="hexagon" size={14} color="white" style={{ marginRight: 4 }} />
                            <ThemedText type="small" style={{ color: "white", fontWeight: "600" }}>100</ThemedText>
                        </Pressable>
                    </View>
                </View>

                {/* Calendar */}
                <ThemedText type="h4" style={styles.sectionTitle}>Calendar</ThemedText>
                <View style={[styles.card, { backgroundColor: theme.backgroundDefault, padding: Spacing.lg }]}>
                    <View style={styles.calendarGrid}>
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                            <ThemedText key={day} type="small" style={styles.calendarHeader}>
                                {day}
                            </ThemedText>
                        ))}
                        {calendarDays.map((date, index) => {
                            const status = getDayStatus(date);
                            const isToday = date?.toDateString() === new Date().toDateString();

                            return (
                                <View key={index} style={styles.dayContainer}>
                                    {date && (
                                        <View
                                            style={[
                                                styles.dayCircle,
                                                status === "completed" && { backgroundColor: theme.primary },
                                                status === "freezed" && { backgroundColor: theme.textSecondary }, // White/Grey for freezed
                                                isToday && status === "none" && { borderWidth: 1, borderColor: theme.textSecondary },
                                            ]}
                                        >
                                            <ThemedText
                                                type="small"
                                                style={{
                                                    color: status === "completed" || status === "freezed" ? "white" : theme.text,
                                                    fontWeight: isToday ? "bold" : "normal",
                                                }}
                                            >
                                                {date.getDate()}
                                            </ThemedText>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    content: {
        padding: Spacing.lg,
        gap: Spacing.xl,
    },
    card: {
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
    },
    streakHeader: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
    },
    statItem: {
        alignItems: "center",
        gap: Spacing.xs,
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: "#E5E7EB",
    },
    sectionTitle: {
        marginBottom: -Spacing.md,
        marginLeft: Spacing.xs,
    },
    shopItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
    },
    shopIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#EFF6FF",
        alignItems: "center",
        justifyContent: "center",
    },
    shopDetails: {
        flex: 1,
    },
    buyButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
    },
    calendarGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    calendarHeader: {
        width: "14.28%",
        textAlign: "center",
        marginBottom: Spacing.sm,
        color: "#9CA3AF",
    },
    dayContainer: {
        width: "14.28%",
        aspectRatio: 1,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.xs,
    },
    dayCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
});
