import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import TestsLibraryScreen from "@/screens/TestsLibraryScreen";
import TestEditorScreen from "@/screens/TestEditorScreen";

export type TestsStackParamList = {
  TestsLibrary: undefined;
  TestEditor: { testId?: string };
};

const Stack = createNativeStackNavigator<TestsStackParamList>();

export default function TestsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="TestsLibrary"
        component={TestsLibraryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TestEditor"
        component={TestEditorScreen}
        options={{ headerTitle: "New Test" }}
      />
    </Stack.Navigator>
  );
}
