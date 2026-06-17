import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  SafeAreaView,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useInterviewStore } from "../src/store/interviews";
import { colors, spacing, typography } from "../src/ui/theme";
import { initQVAC } from "../src/qvac/client";
import { installEgressTrap, isEvidenceBuild } from "../src/lib/egress";
import { loadPerfLog } from "../src/lib/log";

export default function LibraryScreen() {
  const { interviews, setActive, create } = useInterviewStore();
  const [searchText, setSearchText] = useState("");
  const [ready, setReady] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ interviewId: string; score: number; snippet: string }>>([]);

  useEffect(() => {
    async function boot() {
      if (isEvidenceBuild()) installEgressTrap();
      await loadPerfLog();
      initQVAC();
      setReady(true);
    }
    boot();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setActive(null);
    }, [])
  );

  const handleNewInterview = () => {
    const interview = create();
    router.push(`/interview/${interview.id}`);
  };

  const handleOpenInterview = (id: string) => {
    setActive(id);
    router.push(`/interview/${id}`);
  };

  const handleRagSearch = async () => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }
    const { searchInterviews } = await import("../src/features/library");
    const results = await searchInterviews(searchText, "EMBEDDINGGEMMA_300M_Q4_0", 5);
    setSearchResults(results);
  };

  const filteredInterviews = searchText
    ? interviews.filter(
        (i) =>
          i.title.toLowerCase().includes(searchText.toLowerCase()) ||
          i.tags.some((t) => t.toLowerCase().includes(searchText.toLowerCase()))
      )
    : interviews;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Faraday</Text>
        <Text style={styles.subtitle}>Offline Journalist's Desk</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search interviews..."
          placeholderTextColor={colors.textMuted}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleRagSearch}
          returnKeyType="search"
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleNewInterview}>
          <Text style={styles.primaryButtonText}>+ New Interview</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/settings")}>
          <Text style={styles.secondaryButtonText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/models")}>
          <Text style={styles.secondaryButtonText}>Models</Text>
        </TouchableOpacity>
      </View>

      {searchResults.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Semantic Search Results</Text>
          {searchResults.map((r) => (
            <TouchableOpacity key={r.interviewId} style={styles.resultCard} onPress={() => handleOpenInterview(r.interviewId)}>
              <Text style={styles.resultScore}>{Math.round(r.score * 100)}% match</Text>
              <Text style={styles.resultSnippet} numberOfLines={2}>{r.snippet}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={filteredInterviews}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {ready ? "No interviews yet. Tap '+ New Interview' to start." : "Initializing Faraday..."}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handleOpenInterview(item.id)}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.cardDate}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            {item.summary && (
              <Text style={styles.cardSummary} numberOfLines={2}>{item.summary}</Text>
            )}
            <View style={styles.cardMeta}>
              {item.originalTranscript && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Transcript</Text>
                </View>
              )}
              {item.redactionApplied && (
                <View style={[styles.badge, styles.badgeSuccess]}>
                  <Text style={[styles.badgeText, styles.badgeTextSuccess]}>Redacted</Text>
                </View>
              )}
              {item.exportPath && (
                <View style={[styles.badge, styles.badgeMuted]}>
                  <Text style={[styles.badgeText, styles.badgeTextMuted]}>Exported</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  searchRow: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.bg,
    fontWeight: "600",
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: "500",
    fontSize: 14,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accentMuted,
  },
  resultScore: {
    ...typography.caption,
    color: colors.accent,
    marginBottom: 4,
  },
  resultSnippet: {
    ...typography.body,
    color: colors.text,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  cardTitle: {
    ...typography.subheading,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  cardDate: {
    ...typography.caption,
  },
  cardSummary: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  cardMeta: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  badge: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  badgeSuccess: {
    backgroundColor: colors.successMuted,
  },
  badgeTextSuccess: {
    color: colors.success,
  },
  badgeMuted: {
    backgroundColor: colors.surfaceAlt,
  },
  badgeTextMuted: {
    color: colors.textMuted,
  },
  empty: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
  },
});
