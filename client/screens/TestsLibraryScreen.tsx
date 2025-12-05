import React, { useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { HeaderTitle } from "@/components/HeaderTitle";
import { StreakBadge } from "@/components/StreakBadge";
import { FAB } from "@/components/FAB";
import { TestCard } from "@/components/TestCard";
import { EmptyState } from "@/components/EmptyState";
import { useStore, Quiz } from "@/lib/store";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { TestsStackParamList } from "@/navigation/TestsStackNavigator";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList & TestsStackParamList
>;

export default function TestsLibraryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { quizzes, streak, deleteQuiz } = useStore();

  const sortedQuizzes = [...quizzes].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );

  const handleCreateTest = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("TestEditor", {});
  }, [navigation]);

  const handleTestPress = useCallback(
    (quiz: Quiz) => {
      if (quiz.questions.length === 0) {
        navigation.navigate("TestEditor", { testId: quiz.id });
      } else {
        navigation.navigate("PreQuiz", { testId: quiz.id });
      }
    },
    [navigation]
  );

  const handleTestLongPress = useCallback(
    (quiz: Quiz) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(quiz.title, "What would you like to do?", [
        {
          text: "Edit",
          onPress: () => navigation.navigate("TestEditor", { testId: quiz.id }),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Delete Test",
              "Are you sure you want to delete this test? This action cannot be undone.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => deleteQuiz(quiz.id),
                },
              ]
            );
          },
        },
        { text: "Cancel", style: "cancel" },
      ]);
    },
    [navigation, deleteQuiz]
  );

  const handleSettingsPress = useCallback(() => {
    navigation.navigate("Settings");
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: Quiz }) => (
      <TestCard
        quiz={item}
        onPress={() => handleTestPress(item)}
        onLongPress={() => handleTestLongPress(item)}
      />
    ),
    [handleTestPress, handleTestLongPress]
  );

  const renderHeader = useCallback(
    () => (
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.lg,
            backgroundColor: theme.backgroundRoot,
          },
        ]}
      >
        <HeaderTitle title="My Tests" />
        <View style={styles.headerRight}>
          <StreakBadge count={streak.currentStreak} />
          <Pressable
            onPress={handleSettingsPress}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Feather name="settings" size={22} color={theme.text} />
          </Pressable>
        </View>
      </View>
    ),
    [insets.top, theme, streak.currentStreak, handleSettingsPress]
  );

  return (
    <ThemedView style={styles.container}>
      {quizzes.length === 0 ? (
        <>
          {renderHeader()}
          <EmptyState
            icon="file-text"
            title="No tests yet"
            description="Create your first test to start learning and tracking your progress"
            actionLabel="Create your first test"
            onAction={handleCreateTest}
          />
        </>
      ) : (
        <FlatList
          data={sortedQuizzes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarHeight + 56 + Spacing["2xl"] },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          scrollIndicatorInsets={{ bottom: tabBarHeight }}
          showsVerticalScrollIndicator={false}
        />
      )}
      <FAB
        onPress={handleCreateTest}
        icon="plus"
        style={{
          position: "absolute",
          bottom: tabBarHeight + Spacing.xl,
          right: Spacing.lg,
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  separator: {
    height: Spacing.md,
  },
});
