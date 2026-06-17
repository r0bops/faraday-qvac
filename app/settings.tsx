import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { useSettingsStore } from "../src/store/settings";
import { MODEL_CATALOG } from "../src/qvac/models";
import { colors, spacing, typography } from "../src/ui/theme";

export default function SettingsScreen() {
  const settings = useSettingsStore();

  const languageOptions = [
    { label: "Arabic", value: "ar" },
    { label: "English", value: "en" },
    { label: "Farsi", value: "fa" },
    { label: "Russian", value: "ru" },
    { label: "Ukrainian", value: "uk" },
    { label: "Auto-detect", value: "auto" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>Language Settings</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Source Language</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {languageOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, settings.sourceLanguage === opt.value && styles.chipActive]}
                onPress={() => settings.setLanguage(opt.value, settings.targetLanguage)}
              >
                <Text style={[styles.chipText, settings.sourceLanguage === opt.value && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { marginTop: spacing.md }]}>Target Language</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {languageOptions.filter((o) => o.value !== "auto").map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, settings.targetLanguage === opt.value && styles.chipActive]}
                onPress={() => settings.setLanguage(settings.sourceLanguage, opt.value)}
              >
                <Text style={[styles.chipText, settings.targetLanguage === opt.value && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Text style={styles.sectionTitle}>Model Selection</Text>
        <View style={styles.card}>
          <ModelPicker label="LLM (Redaction/Summary)" value={settings.llmModelId} tag="llm"
            onChange={(id) => settings.setModelId("llm", id)} />
          <ModelPicker label="Whisper (Transcription)" value={settings.whisperModelId} tag="whisper"
            onChange={(id) => settings.setModelId("whisper", id)} />
          <ModelPicker label="NMT (Translation)" value={settings.nmtModelId} tag="nmt"
            onChange={(id) => settings.setModelId("nmt", id)} />
          <ModelPicker label="Embeddings (RAG)" value={settings.embeddingsModelId} tag="embeddings"
            onChange={(id) => settings.setModelId("embeddings", id)} />
          <ModelPicker label="TTS" value={settings.ttsModelId} tag="tts"
            onChange={(id) => settings.setModelId("tts", id)} />
          <ModelPicker label="OCR" value={settings.ocrModelId} tag="ocr"
            onChange={(id) => settings.setModelId("ocr", id)} />
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => settings.setUseSideloaded(!settings.useSideloaded)}
          >
            <Text style={styles.toggleLabel}>Use Sideloaded Models</Text>
            <Text style={settings.useSideloaded ? styles.toggleOn : styles.toggleOff}>
              {settings.useSideloaded ? "ON" : "OFF"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ModelPicker({ label, value, tag, onChange }: {
  label: string; value: string; tag: string; onChange: (id: string) => void;
}) {
  const options = Object.entries(MODEL_CATALOG).filter(([, m]) => m.tags.includes(tag));
  const selected = MODEL_CATALOG[value];

  return (
    <View style={styles.modelPicker}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.selectedModel}>{selected?.name ?? value}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {options.map(([key, opt]) => (
          <TouchableOpacity
            key={key}
            style={[styles.chip, value === key && styles.chipActive]}
            onPress={() => onChange(key)}
          >
            <Text style={[styles.chipText, value === key && styles.chipTextActive]}>
              {opt.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sectionTitle: { ...typography.subheading, color: colors.accent, marginTop: spacing.lg, marginBottom: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  label: { ...typography.body, color: colors.textMuted, marginBottom: spacing.sm },
  chipRow: { flexDirection: "row" },
  chip: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 6, backgroundColor: colors.surfaceAlt, marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
  chipText: { fontSize: 14, color: colors.textMuted },
  chipTextActive: { color: colors.accent, fontWeight: "600" },
  modelPicker: { marginBottom: spacing.md },
  selectedModel: { ...typography.mono, color: colors.text, marginBottom: spacing.sm },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm },
  toggleLabel: { ...typography.body, color: colors.text },
  toggleOn: { color: colors.accent, fontWeight: "600" },
  toggleOff: { color: colors.textMuted },
});
