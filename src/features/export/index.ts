// SDK 54 expo-file-system: the new synchronous File/Paths API.
// (The old cacheDirectory/writeAsStringAsync helpers moved to the unstable "/legacy" subpath.)
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useInterviewStore } from "../../store/interviews";
import { encryptString } from "../../lib/crypto";

export async function exportInterview(
  interviewId: string,
  format: "txt" | "json" | "encrypted",
): Promise<string | null> {
  const interview = useInterviewStore.getState().getById(interviewId);
  if (!interview) return null;

  // SOURCE-PROTECTION GATE: never let raw, source-identifying material leave the device.
  // Export is only permitted once redaction has been applied AND a redacted transcript exists.
  if (!interview.redactionApplied || !interview.redactedTranscript) {
    throw new Error(
      "Redaction not applied — approve every redaction span in the Redact tab before exporting.",
    );
  }

  // Build a brief from REDACTED / derived fields ONLY. Never originalTranscript, audioPath, or
  // the raw redactionSpans (which contain the verbatim identifying text).
  const safe = {
    id: interview.id,
    title: interview.title,
    createdAt: interview.createdAt,
    summary: interview.summary,
    keyPoints: interview.keyPoints,
    redactedTranscript: interview.redactedTranscript,
    translatedTranscript: interview.translatedTranscript,
  };

  const ext = format === "encrypted" ? "enc" : format;

  let content: string;
  let mimeType: string;
  switch (format) {
    case "json": {
      content = JSON.stringify(safe, null, 2);
      mimeType = "application/json";
      break;
    }
    case "txt": {
      const parts: string[] = [];
      parts.push(`# ${safe.title}`);
      parts.push(`Date: ${new Date(safe.createdAt).toISOString()}`);
      parts.push("");
      if (safe.summary) {
        parts.push("## Summary");
        parts.push(safe.summary);
        parts.push("");
      }
      parts.push("## Transcript (Redacted)");
      parts.push(safe.redactedTranscript!);
      if (safe.translatedTranscript) {
        parts.push("");
        parts.push("## Translation");
        parts.push(safe.translatedTranscript);
      }
      content = parts.join("\n");
      mimeType = "text/plain";
      break;
    }
    case "encrypted": {
      // Write REAL ciphertext of the redacted brief (keyed by the secret vault key) — not base64 plaintext.
      content = await encryptString(JSON.stringify(safe));
      mimeType = "application/octet-stream";
      break;
    }
    default:
      return null;
  }

  const file = new File(Paths.cache, `${interview.id}-export.${ext}`);
  if (!file.exists) file.create();
  file.write(content);

  useInterviewStore.getState().update(interviewId, { exportPath: file.uri });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(file.uri, {
      mimeType,
      dialogTitle: `Export ${safe.title}`,
    });
  }

  return file.uri;
}
