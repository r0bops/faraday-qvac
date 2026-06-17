import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { downloadAsset, unloadModel as sdkUnloadModel, type ModelProgressUpdate } from "@qvac/sdk";
import { MODEL_CATALOG, MOBILE_PRESET, resolveSrc } from "../src/qvac/models";
import { useModelStatus } from "../src/store/modelStatus";
import { useSettingsStore } from "../src/store/settings";
import { loadModel, unloadModel } from "../src/qvac/modelManager";
import { colors, spacing, typography } from "../src/ui/theme";

export default function ModelsScreen() {
  const modelStatus = useModelStatus();
  const settings = useSettingsStore();

  const sideloadFor = (modelId: string) =>
    settings.useSideloaded ? MODEL_CATALOG[modelId]?.sideloadPath : undefined;

  const handleLoad = async (modelId: string) => {
    try {
      await loadModel(modelId, undefined, sideloadFor(modelId));
    } catch (e: unknown) {
      console.warn(`Failed to load ${modelId}:`, e);
    }
  };

  const handleUnload = async (modelId: string) => {
    try {
      await unloadModel(modelId);
    } catch (e: unknown) {
      console.warn(`Failed to unload ${modelId}:`, e);
    }
  };

  const handleLoadPreset = async () => {
    for (const [, modelKey] of Object.entries(MOBILE_PRESET)) {
      try {
        await loadModel(modelKey, undefined, sideloadFor(modelKey));
      } catch (e: unknown) {
        console.warn(`Failed to load preset ${modelKey}:`, e);
      }
    }
  };

  // Download the model weights without loading them into memory. Uses the SDK
  // constant (or local /sdcard path when sideloading) as assetSrc and streams
  // progress into the modelStatus store via the existing loading/progress
  // fields so the card can render a live percentage.
  const handleDownload = async (modelId: string) => {
    const store = useModelStatus.getState();
    store.setLoading(modelId, true, 0);
    try {
      const assetSrc = resolveSrc(modelId, sideloadFor(modelId));
      await downloadAsset({
        assetSrc,
        onProgress: (progress: ModelProgressUpdate) => {
          useModelStatus.getState().setLoading(modelId, true, progress.percentage);
        },
      });
      // Download complete: clear the loading flag but keep it un-loaded.
      useModelStatus.getState().setLoading(modelId, false);
      useModelStatus.getState().setLoaded(modelId, false);
    } catch (e: unknown) {
      useModelStatus.getState().setLoading(modelId, false);
      console.warn(`Failed to download ${modelId}:`, e);
    }
  };

  // Delete cached weights from storage. unloadModel with clearStorage:true
  // removes the on-disk asset; the modelId the SDK keys storage by is the
  // resolved assetSrc (constant/path), matching what download/load used.
  const handleDelete = async (modelId: string) => {
    try {
      // Ensure it is not loaded in memory first so its handles are released.
      await unloadModel(modelId).catch(() => undefined);
      const assetSrc = resolveSrc(modelId, sideloadFor(modelId));
      await sdkUnloadModel({ modelId: String(assetSrc), clearStorage: true });
    } catch (e: unknown) {
      console.warn(`Failed to delete ${modelId}:`, e);
    } finally {
      useModelStatus.getState().setLoaded(modelId, false);
      useModelStatus.getState().setLoading(modelId, false);
    }
  };

  const modelTypes = ["llm", "whisper", "nmt", "embeddings", "tts", "ocr"];
  const typeLabels: Record<string, string> = {
    llm: "LLM (Redaction/Summary)",
    whisper: "Whisper (Transcription)",
    nmt: "Bergamot NMT (Translation)",
    embeddings: "Embeddings (RAG)",
    tts: "TTS (Supertonic)",
    ocr: "OCR",
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.presetButton} onPress={handleLoadPreset}>
          <Text style={styles.presetButtonText}>Load All Mobile Presets</Text>
        </TouchableOpacity>

        {modelTypes.map((type) => {
          const entries = Object.entries(MODEL_CATALOG).filter(([, m]) => m.tags.includes(type));
          return (
            <View key={type} style={styles.section}>
              <Text style={styles.sectionTitle}>{typeLabels[type] ?? type}</Text>
              {entries.map(([key, m]) => {
                const status = modelStatus.models[key];
                const loaded = status?.loaded ?? false;
                const loading = status?.loading ?? false;
                const progress = status?.progress;
                const downloaded = loaded; // loaded implies the weights are on disk
                const busy = loading;
                return (
                  <View key={key} style={styles.modelCard}>
                    <View style={styles.modelInfo}>
                      <Text style={styles.modelName}>{m.name}</Text>
                      <Text style={styles.modelSize}>
                        {(m.sizeBytes / 1_000_000).toFixed(0)} MB
                      </Text>
                      {loaded && (
                        <View style={styles.badgeLoaded}>
                          <Text style={styles.badgeLoadedText}>LOADED</Text>
                        </View>
                      )}
                      {!loaded && downloaded && (
                        <View style={styles.badgeDownloaded}>
                          <Text style={styles.badgeDownloadedText}>DOWNLOADED</Text>
                        </View>
                      )}
                      {busy && (
                        <View style={styles.badgeLoading}>
                          <Text style={styles.badgeLoadingText}>
                            {progress != null
                              ? `WORKING ${Math.round(progress)}%`
                              : "WORKING..."}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.actions}>
                      {loaded ? (
                        <TouchableOpacity
                          style={styles.unloadButton}
                          onPress={() => handleUnload(key)}
                        >
                          <Text style={styles.unloadButtonText}>Unload</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.loadButton, busy && styles.loadButtonDisabled]}
                          onPress={() => handleLoad(key)}
                          disabled={busy}
                        >
                          <Text style={styles.loadButtonText}>
                            {busy ? "Working..." : "Load"}
                          </Text>
                        </TouchableOpacity>
                      )}
                      {!loaded && (
                        <TouchableOpacity
                          style={[styles.downloadButton, busy && styles.loadButtonDisabled]}
                          onPress={() => handleDownload(key)}
                          disabled={busy}
                        >
                          <Text style={styles.downloadButtonText}>Download</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.deleteButton, busy && styles.loadButtonDisabled]}
                        onPress={() => handleDelete(key)}
                        disabled={busy}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  presetButton: {
    backgroundColor: colors.accent, borderRadius: 8, padding: spacing.md,
    alignItems: "center", marginBottom: spacing.lg,
  },
  presetButtonText: { color: colors.bg, fontWeight: "600", fontSize: 15 },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.subheading, color: colors.accent, marginBottom: spacing.sm },
  modelCard: {
    backgroundColor: colors.surface, borderRadius: 8, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  modelInfo: { flex: 1 },
  modelName: { ...typography.body, color: colors.text, fontWeight: "500" },
  modelSize: { ...typography.caption, marginTop: 2 },
  badgeLoaded: {
    backgroundColor: colors.successMuted, paddingHorizontal: spacing.sm,
    paddingVertical: 2, borderRadius: 4, alignSelf: "flex-start", marginTop: spacing.xs,
  },
  badgeLoadedText: { fontSize: 11, color: colors.success, fontWeight: "600" },
  badgeDownloaded: {
    backgroundColor: colors.border, paddingHorizontal: spacing.sm,
    paddingVertical: 2, borderRadius: 4, alignSelf: "flex-start", marginTop: spacing.xs,
  },
  badgeDownloadedText: { fontSize: 11, color: colors.text, fontWeight: "600" },
  badgeLoading: {
    backgroundColor: colors.accentMuted, paddingHorizontal: spacing.sm,
    paddingVertical: 2, borderRadius: 4, alignSelf: "flex-start", marginTop: spacing.xs,
  },
  badgeLoadingText: { fontSize: 11, color: colors.accent, fontWeight: "600" },
  actions: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  loadButton: {
    backgroundColor: colors.accent, borderRadius: 6,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
  },
  loadButtonDisabled: { opacity: 0.5 },
  loadButtonText: { color: colors.bg, fontWeight: "600", fontSize: 13 },
  downloadButton: {
    backgroundColor: "transparent", borderRadius: 6,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderWidth: 1, borderColor: colors.accent,
  },
  downloadButtonText: { color: colors.accent, fontWeight: "600", fontSize: 13 },
  unloadButton: {
    backgroundColor: "transparent", borderRadius: 6,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderWidth: 1, borderColor: colors.danger,
  },
  unloadButtonText: { color: colors.danger, fontWeight: "600", fontSize: 13 },
  deleteButton: {
    backgroundColor: "transparent", borderRadius: 6,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderWidth: 1, borderColor: colors.danger,
  },
  deleteButtonText: { color: colors.danger, fontWeight: "600", fontSize: 13 },
});
