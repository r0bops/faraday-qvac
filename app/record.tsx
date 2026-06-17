import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { importAudioFile } from "../src/lib/audio";
import { useCapture } from "../src/features/capture";
import { useInterviewStore } from "../src/store/interviews";
import { colors, spacing, typography } from "../src/ui/theme";

export default function RecordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const interview = useInterviewStore((s) => s.getById(id ?? ""));
  const updateInterview = useInterviewStore((s) => s.update);
  const capture = useCapture(id ?? "");
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recordState = capture.isRecording
    ? "recording" : capture.isPaused ? "paused"
    : capture.fileUri ? "done" : "idle";

  useEffect(() => {
    if (capture.isRecording) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else if (capture.isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [capture.isRecording, capture.isPaused]);

  useEffect(() => {
    if (capture.error) Alert.alert("Error", capture.error);
  }, [capture.error]);

  const handleStart = () => { capture.startRecording(); setElapsed(0); };
  const handlePauseToggle = () => {
    if (capture.isRecording) capture.pauseRecording();
    else if (capture.isPaused) capture.resumeRecording();
  };
  const handleStop = async () => { await capture.stopRecording(); };

  const handleImport = async () => {
    try {
      const result = await importAudioFile();
      if (!result.canceled && result.audioPath) {
        updateInterview(id!, { audioPath: result.audioPath });
        Alert.alert("Imported", "Audio file imported. Go to the Interview to transcribe.");
      }
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not import file");
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{interview?.title ?? "Record"}</Text>
      </View>

      <View style={styles.recorderArea}>
        <View style={styles.timerContainer}>
          <Text style={styles.timer}>{formatTime(elapsed)}</Text>
          {capture.isRecording && <View style={styles.recordingDot} />}
          {capture.isPaused && <Text style={styles.pausedLabel}>PAUSED</Text>}
        </View>

        <View style={styles.controls}>
          {recordState === "idle" && (
            <TouchableOpacity style={styles.recordButton} onPress={handleStart}>
              <View style={styles.recordButtonInner} />
            </TouchableOpacity>
          )}
          {recordState === "recording" && (
            <View style={styles.controlsRow}>
              <TouchableOpacity style={styles.controlButton} onPress={handlePauseToggle}>
                <Text style={styles.controlButtonText}>Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.recordButton, styles.recordButtonActive]} onPress={handleStop}>
                <View style={[styles.recordButtonInner, styles.recordButtonInnerStop]} />
              </TouchableOpacity>
              <View style={styles.controlButton} />
            </View>
          )}
          {recordState === "paused" && (
            <View style={styles.controlsRow}>
              <TouchableOpacity style={styles.controlButton} onPress={handleStop}>
                <Text style={[styles.controlButtonText, styles.controlButtonTextDanger]}>Stop</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.recordButton, styles.recordButtonPaused]} onPress={handlePauseToggle}>
                <View style={styles.recordButtonInner} />
              </TouchableOpacity>
              <View style={styles.controlButton} />
            </View>
          )}
          {recordState === "done" && (
            <View style={styles.doneState}>
              <Text style={styles.doneText}>✓ Audio captured</Text>
              <TouchableOpacity style={styles.newButton} onPress={handleStart}>
                <Text style={styles.newButtonText}>Record Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.importSection}>
        <TouchableOpacity style={styles.importButton} onPress={handleImport}>
          <Text style={styles.importButtonText}>Import Audio File</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navSection}>
        <TouchableOpacity style={styles.navButton} onPress={() => router.push(`/interview/${id}`)}>
          <Text style={styles.navButtonText}>Go to Interview →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { ...typography.heading, color: colors.text },
  recorderArea: { flex: 1, justifyContent: "center", alignItems: "center" },
  timerContainer: { flexDirection: "row", alignItems: "center", marginBottom: spacing.xxl },
  timer: { fontSize: 64, fontWeight: "200", color: colors.text, fontVariant: ["tabular-nums"] },
  recordingDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.danger, marginLeft: spacing.md },
  pausedLabel: { ...typography.caption, color: colors.warning, marginLeft: spacing.md, letterSpacing: 1 },
  controls: { alignItems: "center" },
  controlsRow: { flexDirection: "row", alignItems: "center", gap: spacing.xl },
  recordButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surface, borderWidth: 3, borderColor: colors.danger, justifyContent: "center", alignItems: "center" },
  recordButtonActive: { borderColor: colors.danger, backgroundColor: colors.dangerMuted },
  recordButtonPaused: { borderColor: colors.warning, backgroundColor: colors.surfaceAlt },
  recordButtonInner: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.danger },
  recordButtonInnerStop: { width: 24, height: 24, borderRadius: 4, backgroundColor: colors.danger },
  controlButton: { width: 80, alignItems: "center", padding: spacing.md },
  controlButtonText: { color: colors.text, fontSize: 16, fontWeight: "500" },
  controlButtonTextDanger: { color: colors.danger },
  doneState: { alignItems: "center", gap: spacing.lg },
  doneText: { ...typography.subheading, color: colors.success },
  newButton: { backgroundColor: colors.accent, borderRadius: 8, paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  newButtonText: { color: colors.bg, fontWeight: "600", fontSize: 15 },
  importSection: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  importButton: { backgroundColor: colors.surfaceAlt, borderRadius: 8, padding: spacing.md, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  importButtonText: { color: colors.text, fontWeight: "500", fontSize: 15 },
  navSection: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  navButton: { backgroundColor: colors.accent, borderRadius: 8, padding: spacing.md, alignItems: "center" },
  navButtonText: { color: colors.bg, fontWeight: "600", fontSize: 15 },
});
