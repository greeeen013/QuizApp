import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import SettingsScreen from "@/screens/SettingsScreen";
import QuestionEditorScreen from "@/screens/QuestionEditorScreen";
import ActiveQuizScreen from "@/screens/ActiveQuizScreen";
import ResultsScreen from "@/screens/ResultsScreen";
import ReviewMistakesScreen from "@/screens/ReviewMistakesScreen";
import PreQuizScreen from "@/screens/PreQuizScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RootStackParamList = {
  Main: undefined;
  Settings: undefined;
  QuestionEditor: { testId: string; questionId?: string };
  PreQuiz: { testId: string };
  ActiveQuiz: { testId: string; shuffle: boolean; questionIds?: string[] };
  Results: { runId: string; isMiniRun?: boolean };
  ReviewMistakes: { runId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          presentation: "modal",
          headerTitle: "Settings",
        }}
      />
      <Stack.Screen
        name="QuestionEditor"
        component={QuestionEditorScreen}
        options={{
          presentation: "modal",
          headerTitle: "Question",
        }}
      />
      <Stack.Screen
        name="PreQuiz"
        component={PreQuizScreen}
        options={{
          presentation: "modal",
          headerTitle: "Start Quiz",
        }}
      />
      <Stack.Screen
        name="ActiveQuiz"
        component={ActiveQuizScreen}
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="Results"
        component={ResultsScreen}
        options={{
          presentation: "modal",
          headerTitle: "Results",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="ReviewMistakes"
        component={ReviewMistakesScreen}
        options={{
          presentation: "modal",
          headerTitle: "Review Mistakes",
        }}
      />
    </Stack.Navigator>
  );
}
