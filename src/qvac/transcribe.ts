import { transcribe as sdkTranscribe } from "@qvac/sdk";
import { logPerf } from "../lib/log";

export async function transcribe(
  modelId: string,
  audioPath: string,
  // Whisper applies language/translate at model LOAD time via modelConfig
  // (see whisperConfigSchema); the per-call transcribe params accept only
  // modelId/prompt/metadata/audioChunk. These opts are accepted for API
  // completeness and to document intent at the call site — the actual
  // language/translate wiring happens in loadModel (see features/transcript).
  _opts?: { language?: string; translate?: boolean }
): Promise<{ text: string }> {
  const t0 = Date.now();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await sdkTranscribe({
    modelId,
    audioChunk: audioPath,
  } as any);

  const text = typeof result === "string" ? result : JSON.stringify(result);

  logPerf("whisper", "transcribe", {
    modelId,
    textLength: text.length,
    durationMs: Date.now() - t0,
    ts: Date.now(),
  });

  return { text };
}
