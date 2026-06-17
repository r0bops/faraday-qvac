import React, { useState, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView, Modal } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";
import { CameraView, useCameraPermissions } from "expo-camera";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { useInterviewStore } from "../../src/store/interviews";
import { useSettingsStore } from "../../src/store/settings";
import { colors, spacing, typography } from "../../src/ui/theme";
import {
  transcribeInterview,
} from "../../src/features/transcript";
import { translateInterview } from "../../src/features/translate";
import { redactInterview, toggleRedactionSpan } from "../../src/features/redact";
import { summarizeInterview } from "../../src/features/summarize";
import { exportInterview } from "../../src/features/export";
import { ocrDocument } from "../../src/features/ocr";
import { speakInterview } from "../../src/features/tts";
import { ensurePermissions } from "../../src/lib/permissions";

const cfgExtra = (Constants.expoConfig as unknown as { extra?: Record<string, unknown> })?.extra;
const ENABLE_OCR = cfgExtra?.ENABLE_OCR !== false;
const ENABLE_TTS = cfgExtra?.ENABLE_TTS !== false;

type Tab = "transcript" | "translate" | "redact" | "summary" | "docs" | "listen" | "export";

export default function InterviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const interview = useInterviewStore((s) => s.getById(id ?? ""));
  const settings = useSettingsStore();

  const [tab, setTab] = useState<Tab>("transcript");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [camPermission, requestCamPermission] = useCameraPermissions();
  const audioPlayerRef = useRef<AudioPlayer | null>(null);

  const tabs: Tab[] = [
    "transcript",
    "translate",
    "redact",
    "summary",
    ...(ENABLE_OCR ? (["docs"] as const) : []),
    ...(ENABLE_TTS ? (["listen"] as const) : []),
    "export",
  ];

  const startTranscribe = useCallback(async () => {
    setLoading(true); setStatus("Transcribing...");
    try {
      await ensurePermissions(["audio"]);
      if (interview?.audioPath) {
        await transcribeInterview(id!, settings.whisperModelId);
        setStatus("Transcription complete");
      } else {
        Alert.alert("No Audio", "Record or import audio first.");
      }
    } catch (e: unknown) {
      setStatus(`Error: ${e instanceof Error ? e.message : "Unknown"}`);
    } finally { setLoading(false); }
  }, [id, interview?.audioPath, settings.whisperModelId]);

  const startTranslate = useCallback(async () => {
    const text = interview?.redactedTranscript || interview?.originalTranscript;
    if (!text) { Alert.alert("No Transcript", "Transcribe first."); return; }
    setLoading(true); setStatus("Translating...");
    try {
      await translateInterview(id!, settings.nmtModelId, settings.sourceLanguage, settings.targetLanguage);
      setStatus("Translation complete");
    } catch (e: unknown) {
      setStatus(`Error: ${e instanceof Error ? e.message : "Unknown"}`);
    } finally { setLoading(false); }
  }, [id, interview?.originalTranscript, interview?.redactedTranscript, settings.nmtModelId, settings.sourceLanguage, settings.targetLanguage]);

  const startRedact = useCallback(async () => {
    if (!interview?.originalTranscript) { Alert.alert("No Transcript", "Transcribe first."); return; }
    setLoading(true); setStatus("Redacting...");
    try {
      await redactInterview(id!, settings.llmModelId);
      setStatus("Redaction complete - review spans below");
    } catch (e: unknown) {
      setStatus(`Error: ${e instanceof Error ? e.message : "Unknown"}`);
    } finally { setLoading(false); }
  }, [id, interview?.originalTranscript, settings.llmModelId]);

  const startSummarize = useCallback(async () => {
    const text = interview?.redactedTranscript || interview?.originalTranscript;
    if (!text) { Alert.alert("No Transcript", "Transcribe first."); return; }
    setLoading(true); setStatus("Summarizing...");
    try {
      await summarizeInterview(id!, settings.llmModelId);
      setStatus("Summary complete");
    } catch (e: unknown) {
      setStatus(`Error: ${e instanceof Error ? e.message : "Unknown"}`);
    } finally { setLoading(false); }
  }, [id, interview?.originalTranscript, interview?.redactedTranscript, settings.llmModelId]);

  const startExport = useCallback(async (format: "txt" | "json" | "encrypted") => {
    if (!interview) return;
    setLoading(true); setStatus("Exporting...");
    try {
      const path = await exportInterview(id!, format);
      setStatus(`Exported to ${path}`);
    } catch (e: unknown) {
      setStatus(`Error: ${e instanceof Error ? e.message : "Unknown"}`);
    } finally { setLoading(false); }
  }, [id, interview]);

  const openCamera = useCallback(async () => {
    if (!ENABLE_OCR) { Alert.alert("Disabled", "OCR is disabled (ENABLE_OCR=false)."); return; }
    if (!camPermission?.granted) {
      const res = await requestCamPermission();
      if (!res?.granted) { Alert.alert("Permission needed", "Camera access is required to scan documents."); return; }
    }
    setCameraOpen(true);
  }, [camPermission?.granted, requestCamPermission]);

  const captureDocument = useCallback(async () => {
    if (!ENABLE_OCR) return;
    setLoading(true); setStatus("Scanning document...");
    try {
      const photo = await cameraRef.current?.takePictureAsync();
      setCameraOpen(false);
      if (!photo?.uri) { setStatus("No image captured"); return; }
      await ocrDocument(id!, photo.uri);
      setStatus("Document text extracted");
    } catch (e: unknown) {
      setStatus(`Error: ${e instanceof Error ? e.message : "Unknown"}`);
    } finally { setLoading(false); }
  }, [id]);

  const startListen = useCallback(async () => {
    if (!ENABLE_TTS) { Alert.alert("Disabled", "TTS is disabled (ENABLE_TTS=false)."); return; }
    const text = interview?.summary || interview?.redactedTranscript;
    if (!text) { Alert.alert("Nothing to read", "Generate a redacted transcript or summary first."); return; }
    setLoading(true); setStatus("Synthesizing speech...");
    try {
      const uri = await speakInterview(id!, settings.ttsModelId, text);
      audioPlayerRef.current?.remove();
      const player = createAudioPlayer(uri);
      audioPlayerRef.current = player;
      player.play();
      setStatus("Playing audio");
    } catch (e: unknown) {
      setStatus(`Error: ${e instanceof Error ? e.message : "Unknown"}`);
    } finally { setLoading(false); }
  }, [id, interview?.summary, interview?.redactedTranscript, settings.ttsModelId]);

  if (!interview) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyText}>Interview not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{interview.title}</Text>
        <Text style={styles.date}>{new Date(interview.createdAt).toLocaleString()}</Text>
      </View>

      <ScrollView horizontal style={styles.tabs} showsHorizontalScrollIndicator={false}>
        {tabs.map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {status ? (
        <View style={styles.statusBar}><Text style={styles.statusText}>{status}</Text></View>
      ) : null}

      <View style={styles.content}>
        {tab === "transcript" && (
          <View style={styles.tabContent}>
            {!interview.audioPath ? (
              <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/record?id=${id}`)}>
                <Text style={styles.actionButtonText}>Record or Import Audio</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.actionButton, loading && styles.disabled]} onPress={startTranscribe} disabled={loading}>
                <Text style={styles.actionButtonText}>{interview.originalTranscript ? "Re-Transcribe" : "Transcribe"}</Text>
              </TouchableOpacity>
            )}
            {interview.originalTranscript && (
              <View style={styles.textBox}>
                <Text style={styles.textLabel}>Transcript</Text>
                <Text style={styles.textContent}>{interview.originalTranscript}</Text>
              </View>
            )}
          </View>
        )}

        {tab === "translate" && (
          <View style={styles.tabContent}>
            <TouchableOpacity style={[styles.actionButton, loading && styles.disabled]} onPress={startTranslate} disabled={loading}>
              <Text style={styles.actionButtonText}>Translate ({settings.sourceLanguage} → {settings.targetLanguage})</Text>
            </TouchableOpacity>
            {interview.translatedTranscript && (
              <View style={styles.textBox}>
                <Text style={styles.textLabel}>Translation</Text>
                <Text style={styles.textContent}>{interview.translatedTranscript}</Text>
              </View>
            )}
          </View>
        )}

        {tab === "redact" && (
          <View style={styles.tabContent}>
            <TouchableOpacity style={[styles.actionButton, loading && styles.disabled]} onPress={startRedact} disabled={loading}>
              <Text style={styles.actionButtonText}>Run Redaction Pass</Text>
            </TouchableOpacity>
            {interview.redactionSpans && interview.redactionSpans.length > 0 && (
              <View style={styles.spansSection}>
                <Text style={styles.sectionLabel}>
                  Redaction Spans ({interview.redactionSpans.filter((s) => s.approved).length}/{interview.redactionSpans.length} approved)
                </Text>
                {interview.redactionSpans.map((span, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.spanCard, span.approved && styles.spanApproved]}
                    onPress={() => toggleRedactionSpan(id!, i)}
                  >
                    <View style={styles.spanHeader}>
                      <Text style={styles.spanType}>{span.type}</Text>
                      <Text style={[styles.spanStatus, span.approved && styles.spanStatusApproved]}>
                        {span.approved ? "✓ Approved" : "Tap to approve"}
                      </Text>
                    </View>
                    <Text style={styles.spanText}>"{span.text}"</Text>
                    <Text style={styles.spanReason}>{span.reason}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {interview.redactedTranscript && (
              <View style={styles.textBox}>
                <Text style={styles.textLabel}>Redacted Preview</Text>
                <Text style={styles.textContent}>{interview.redactedTranscript}</Text>
              </View>
            )}
            {interview.redactionApplied && (
              <View style={styles.gateBox}><Text style={styles.gateText}>✓ Redaction complete — safe to export</Text></View>
            )}
          </View>
        )}

        {tab === "summary" && (
          <View style={styles.tabContent}>
            <TouchableOpacity style={[styles.actionButton, loading && styles.disabled]} onPress={startSummarize} disabled={loading}>
              <Text style={styles.actionButtonText}>Generate Summary</Text>
            </TouchableOpacity>
            {interview.summary && (
              <View style={styles.textBox}>
                <Text style={styles.textLabel}>Summary</Text>
                <Text style={styles.textContent}>{interview.summary}</Text>
              </View>
            )}
            {interview.keyPoints && interview.keyPoints.length > 0 && (
              <View style={styles.textBox}>
                <Text style={styles.textLabel}>Key Points</Text>
                {interview.keyPoints.map((kp, i) => (
                  <Text key={i} style={styles.keyPoint}>• {kp}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {tab === "docs" && (
          <View style={styles.tabContent}>
            {ENABLE_OCR ? (
              <>
                <TouchableOpacity style={[styles.actionButton, loading && styles.disabled]} onPress={openCamera} disabled={loading}>
                  <Text style={styles.actionButtonText}>Scan Document</Text>
                </TouchableOpacity>
                {interview.docsText ? (
                  <View style={styles.textBox}>
                    <Text style={styles.textLabel}>Extracted Document Text</Text>
                    <Text style={styles.textContent}>{interview.docsText}</Text>
                  </View>
                ) : (
                  <Text style={styles.emptyText}>No documents scanned yet.</Text>
                )}
              </>
            ) : (
              <View style={styles.gateBoxWarn}>
                <Text style={styles.gateWarnText}>OCR is disabled (ENABLE_OCR=false).</Text>
              </View>
            )}
          </View>
        )}

        {tab === "listen" && (
          <View style={styles.tabContent}>
            {ENABLE_TTS ? (
              <>
                <TouchableOpacity style={[styles.actionButton, loading && styles.disabled]} onPress={startListen} disabled={loading}>
                  <Text style={styles.actionButtonText}>Synthesize &amp; Play</Text>
                </TouchableOpacity>
                <Text style={styles.emptyText}>
                  Reads the summary if available, otherwise the redacted transcript.
                </Text>
              </>
            ) : (
              <View style={styles.gateBoxWarn}>
                <Text style={styles.gateWarnText}>TTS is disabled (ENABLE_TTS=false).</Text>
              </View>
            )}
          </View>
        )}

        {tab === "export" && (
          <View style={styles.tabContent}>
            {!interview.redactionApplied ? (
              <View style={styles.gateBoxWarn}>
                <Text style={styles.gateWarnText}>
                  Redaction required before export. Run the redaction pass and approve every span in the Redact tab first — Faraday will not export unredacted source material.
                </Text>
              </View>
            ) : (
              <>
                <TouchableOpacity style={styles.actionButton} onPress={() => startExport("txt")} disabled={loading}>
                  <Text style={styles.actionButtonText}>Export as Text (Redacted)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => startExport("json")} disabled={loading}>
                  <Text style={styles.actionButtonText}>Export as JSON (Redacted)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={() => startExport("encrypted")} disabled={loading}>
                  <Text style={styles.actionButtonText}>Export Encrypted (Redacted)</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>

      <Modal visible={cameraOpen} animationType="slide" onRequestClose={() => setCameraOpen(false)}>
        <View style={styles.cameraContainer}>
          <CameraView ref={cameraRef} style={styles.camera} facing="back" />
          <View style={styles.cameraControls}>
            <TouchableOpacity style={[styles.actionButton, styles.cameraButton]} onPress={() => setCameraOpen(false)} disabled={loading}>
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.cameraButton, loading && styles.disabled]} onPress={captureDocument} disabled={loading}>
              <Text style={styles.actionButtonText}>{loading ? "Working..." : "Capture"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { ...typography.heading, color: colors.text },
  date: { ...typography.caption, marginTop: spacing.xs },
  tabs: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, marginHorizontal: 2 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.accent },
  tabText: { fontSize: 14, color: colors.textMuted, fontWeight: "500" },
  tabTextActive: { color: colors.accent },
  statusBar: { backgroundColor: colors.surfaceAlt, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  statusText: { ...typography.caption, color: colors.accent },
  content: { flex: 1 },
  tabContent: { flex: 1, padding: spacing.lg },
  actionButton: { backgroundColor: colors.accent, borderRadius: 8, padding: spacing.md, alignItems: "center", marginBottom: spacing.md },
  dangerButton: { backgroundColor: colors.danger },
  disabled: { opacity: 0.5 },
  actionButtonText: { color: colors.bg, fontWeight: "600", fontSize: 15 },
  textBox: { backgroundColor: colors.surface, borderRadius: 8, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginTop: spacing.md },
  textLabel: { ...typography.caption, color: colors.accent, marginBottom: spacing.sm, textTransform: "uppercase", letterSpacing: 1 },
  textContent: { ...typography.body, color: colors.text },
  keyPoint: { ...typography.body, color: colors.text, marginBottom: spacing.xs },
  sectionLabel: { ...typography.subheading, color: colors.text, marginBottom: spacing.sm },
  spansSection: { marginBottom: spacing.md },
  spanCard: { backgroundColor: colors.surface, borderRadius: 8, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.dangerMuted },
  spanApproved: { borderColor: colors.successMuted, backgroundColor: colors.surfaceAlt },
  spanHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xs },
  spanType: { fontSize: 13, color: colors.danger, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  spanStatus: { fontSize: 13, color: colors.textMuted },
  spanStatusApproved: { color: colors.success },
  spanText: { ...typography.mono, color: colors.text, marginBottom: spacing.xs },
  spanReason: { ...typography.caption },
  gateBox: { backgroundColor: colors.successMuted, borderRadius: 8, padding: spacing.md, marginTop: spacing.md, borderWidth: 1, borderColor: colors.success, alignItems: "center" },
  gateText: { color: colors.success, fontWeight: "600", fontSize: 14 },
  gateBoxWarn: { backgroundColor: colors.dangerMuted, borderRadius: 8, padding: spacing.md, borderWidth: 1, borderColor: colors.danger },
  gateWarnText: { color: colors.danger, fontWeight: "600", fontSize: 14 },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: "center", marginTop: spacing.xxl },
  cameraContainer: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  cameraControls: { flexDirection: "row", justifyContent: "space-between", padding: spacing.lg, backgroundColor: colors.bg },
  cameraButton: { flex: 1, marginHorizontal: spacing.xs, marginBottom: 0 },
});
