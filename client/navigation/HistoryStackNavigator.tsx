import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import HistoryListScreen from "@/screens/HistoryListScreen";
import HistoryDetailScreen from "@/screens/HistoryDetailScreen";

export type HistoryStackParamList = {
  HistoryList: undefined;
  HistoryDetail: { runId: string };
};

const Stack = createNativeStackNavigator<HistoryStackParamList>();

export default function HistoryStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="HistoryList"
        component={HistoryListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HistoryDetail"
        component={HistoryDetailScreen}
        options={{ headerTitle: "Run Details" }}
      />
    </Stack.Navigator>
  );
}
