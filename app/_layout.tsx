import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { colors } from "../src/ui/theme";
import { loadPerfLog, flushPerfLog } from "../src/lib/log";

const PERF_FLUSH_INTERVAL_MS = 30000;

export default function RootLayout() {
  useEffect(() => {
    void loadPerfLog();
    const interval = setInterval(() => {
      void flushPerfLog();
    }, PERF_FLUSH_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      void flushPerfLog();
    };
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: colors.bg },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" options={{ title: "Faraday Library", headerShown: false }} />
        <Stack.Screen name="record" options={{ title: "Record", headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="models" options={{ title: "Models" }} />
        <Stack.Screen name="interview/[id]" options={{ title: "Interview" }} />
      </Stack>
    </>
  );
}
