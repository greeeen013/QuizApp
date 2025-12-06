import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList, Pressable, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { HistoryCard } from "@/components/HistoryCard";
import { PausedTestCard } from "@/components/PausedTestCard";
import { EmptyState } from "@/components/EmptyState";
import { useStore, QuizRun } from "@/lib/store";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { HistoryStackParamList } from "@/navigation/HistoryStackNavigator";

type NavigationProp = NativeStackNavigationProp<HistoryStackParamList>;

export default function HistoryListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { runs, quizzes, pausedRuns, deletePausedRun } = useStore();
  const [filterQuizId, setFilterQuizId] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const filteredRuns = useMemo(() => {
    if (!filterQuizId) return runs;
    return runs.filter((r) => r.quizId === filterQuizId);
  }, [runs, filterQuizId]);

  const filteredPausedRuns = useMemo(() => {
    if (!filterQuizId) return pausedRuns;
    return pausedRuns.filter((r) => r.quizId === filterQuizId);
  }, [pausedRuns, filterQuizId]);

  const uniqueQuizIds = useMemo(() => {
    const ids = new Set(runs.map((r) => r.quizId));
    return Array.from(ids);
  }, [runs]);

  const handleRunPress = useCallback(
    (run: QuizRun) => {
      navigation.navigate("HistoryDetail", { runId: run.id });
    },
    [navigation]
  );

  const handleResumeRun = useCallback(
    (pausedRunId: string, testId: string) => {
      // @ts-ignore - navigation type mismatch
      navigation.navigate("ActiveQuiz", {
        testId,
        shuffle: false, // Will be overridden by saved state
        pausedRunId
      });
    },
    [navigation]
  );

  const handleDeletePausedRun = useCallback(
    (id: string) => {
      deletePausedRun(id);
    },
    [deletePausedRun]
  );

  const handleFilterPress = useCallback(() => {
    setShowFilterModal(true);
  }, []);

  const handleSelectFilter = useCallback((quizId: string | null) => {
    setFilterQuizId(quizId);
    setShowFilterModal(false);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: QuizRun }) => (
      <HistoryCard run={item} onPress={() => handleRunPress(item)} />
    ),
    [handleRunPress]
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
        <ThemedText type="h3">History</ThemedText>
        <View style={styles.headerRight}>
          {filterQuizId ? (
            <Pressable
              onPress={() => setFilterQuizId(null)}
              style={({ pressed }) => [
                styles.clearFilter,
                {
                  backgroundColor: theme.primary + "1A",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <ThemedText type="small" style={{ color: theme.primary }}>
                Clear
              </ThemedText>
              <Feather name="x" size={14} color={theme.primary} />
            </Pressable>
          ) : null}
          {uniqueQuizIds.length > 1 ? (
            <Pressable
              onPress={handleFilterPress}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Feather name="filter" size={22} color={theme.text} />
            </Pressable>
          ) : null}
        </View>
      </View>
    ),
    [
      insets.top,
      theme,
      filterQuizId,
      uniqueQuizIds.length,
      handleFilterPress,
    ]
  );

  const renderHeaderWithPaused = useCallback(() => (
    <View>
      {renderHeader()}
      {filteredPausedRuns.length > 0 && (
        <View style={styles.pausedSection}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Paused Tests
          </ThemedText>
          {filteredPausedRuns.map((run) => (
            <PausedTestCard
              key={run.id}
              pausedRun={run}
              onResume={() => handleResumeRun(run.id, run.quizId)}
              onDelete={() => handleDeletePausedRun(run.id)}
            />
          ))}
          <View style={styles.separator} />
          <ThemedText type="h4" style={styles.sectionTitle}>
            Completed Tests
          </ThemedText>
        </View>
      )}
    </View>
  ), [renderHeader, filteredPausedRuns, handleResumeRun, handleDeletePausedRun]);

  return (
    <ThemedView style={styles.container}>
      {runs.length === 0 && pausedRuns.length === 0 ? (
        <>
          {renderHeader()}
          <EmptyState
            icon="clock"
            title="No quiz history yet"
            description="Complete a quiz to see your results and track your progress over time"
          />
        </>
      ) : (
        <FlatList
          data={filteredRuns}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeaderWithPaused}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarHeight + Spacing.xl },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          scrollIndicatorInsets={{ bottom: tabBarHeight }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyFilter}>
              <ThemedText style={{ color: theme.textSecondary }}>
                No history for this test
              </ThemedText>
            </View>
          }
        />
      )}

      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowFilterModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundRoot },
            ]}
          >
            <ThemedText type="h4" style={styles.modalTitle}>
              Filter by Test
            </ThemedText>
            <Pressable
              onPress={() => handleSelectFilter(null)}
              style={({ pressed }) => [
                styles.filterOption,
                {
                  backgroundColor: !filterQuizId
                    ? theme.primary + "1A"
                    : "transparent",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <ThemedText
                style={{ color: !filterQuizId ? theme.primary : theme.text }}
              >
                All Tests
              </ThemedText>
              {!filterQuizId ? (
                <Feather name="check" size={18} color={theme.primary} />
              ) : null}
            </Pressable>
            {uniqueQuizIds.map((quizId) => {
              const quiz = quizzes.find((q) => q.id === quizId);
              const quizTitle =
                quiz?.title ||
                runs.find((r) => r.quizId === quizId)?.quizTitle ||
                "Unknown";
              return (
                <Pressable
                  key={quizId}
                  onPress={() => handleSelectFilter(quizId)}
                  style={({ pressed }) => [
                    styles.filterOption,
                    {
                      backgroundColor:
                        filterQuizId === quizId
                          ? theme.primary + "1A"
                          : "transparent",
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <ThemedText
                    numberOfLines={1}
                    style={{
                      color:
                        filterQuizId === quizId ? theme.primary : theme.text,
                      flex: 1,
                    }}
                  >
                    {quizTitle}
                  </ThemedText>
                  {filterQuizId === quizId ? (
                    <Feather name="check" size={18} color={theme.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
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
  clearFilter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.lg,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  separator: {
    height: Spacing.md,
  },
  emptyFilter: {
    paddingVertical: Spacing["3xl"],
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    maxHeight: "70%",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  modalTitle: {
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xs,
  },
  pausedSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    color: "#666",
  },
});
