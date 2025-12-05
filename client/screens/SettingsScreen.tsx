import React, { useCallback, useLayoutEffect, useState } from "react";
import { View, StyleSheet, ScrollView, TextInput, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { SettingsRow } from "@/components/SettingsRow";
import { ToggleSwitch } from "@/components/ToggleSwitch";
import { AvatarPreset } from "@/components/AvatarPreset";
import { useStore } from "@/lib/store";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, streak } = useStore();

  const [displayName, setDisplayName] = useState(settings.displayName);

  const handleClose = useCallback(() => {
    if (displayName !== settings.displayName) {
      updateSettings({ displayName });
    }
    navigation.goBack();
  }, [navigation, displayName, settings.displayName, updateSettings]);

  const handleAvatarChange = useCallback(
    (preset: number) => {
      updateSettings({ avatarPreset: preset });
    },
    [updateSettings]
  );

  const handleShuffleToggle = useCallback(
    (value: boolean) => {
      updateSettings({ defaultShuffle: value });
    },
    [updateSettings]
  );

  const handleVibrationToggle = useCallback(
    (value: boolean) => {
      updateSettings({ vibrationEnabled: value });
    },
    [updateSettings]
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderButton onPress={handleClose}>
          <Feather name="x" size={22} color={theme.text} />
        </HeaderButton>
      ),
    });
  }, [navigation, handleClose, theme.text]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            PROFILE
          </ThemedText>
          <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.avatarSection}>
              <ThemedText type="small" style={styles.label}>
                Avatar
              </ThemedText>
              <View style={styles.avatarOptions}>
                {[0, 1, 2].map((preset) => (
                  <AvatarPreset
                    key={preset}
                    preset={preset}
                    selected={settings.avatarPreset === preset}
                    onPress={() => handleAvatarChange(preset)}
                    size={56}
                  />
                ))}
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.nameSection}>
              <ThemedText type="small" style={styles.label}>
                Display Name
              </ThemedText>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your name"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            STREAK
          </ThemedText>
          <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.streakInfo}>
              <View style={styles.streakIcon}>
                <Feather name="zap" size={24} color={theme.primary} />
              </View>
              <View style={styles.streakDetails}>
                <ThemedText type="h4">{streak.currentStreak} day streak</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {streak.lastCompletedDate
                    ? `Last completed: ${new Date(streak.lastCompletedDate).toLocaleDateString()}`
                    : "Complete a quiz to start your streak!"}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            QUIZ DEFAULTS
          </ThemedText>
          <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
            <SettingsRow
              label="Shuffle Questions"
              description="Randomize question order by default"
              rightElement={
                <ToggleSwitch
                  value={settings.defaultShuffle}
                  onValueChange={handleShuffleToggle}
                />
              }
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <SettingsRow
              label="Vibration"
              description="Enable haptic feedback"
              rightElement={
                <ToggleSwitch
                  value={settings.vibrationEnabled}
                  onValueChange={handleVibrationToggle}
                />
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            ABOUT
          </ThemedText>
          <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
            <SettingsRow
              label="Version"
              rightElement={
                <ThemedText style={{ color: theme.textSecondary }}>
                  1.0.0
                </ThemedText>
              }
            />
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
  content: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  avatarSection: {
    padding: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.md,
    fontWeight: "500",
  },
  avatarOptions: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.lg,
  },
  nameSection: {
    padding: Spacing.lg,
  },
  input: {
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
    fontSize: 16,
  },
  streakInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  streakIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E51A",
  },
  streakDetails: {
    flex: 1,
  },
});
