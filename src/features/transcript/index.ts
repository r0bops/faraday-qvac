import { loadModel, unloadModel } from "../../qvac/modelManager";
import { transcribe as runTranscribe } from "../../qvac/transcribe";
import { useInterviewStore } from "../../store/interviews";
import { useSettingsStore } from "../../store/settings";

/**
 * Builds loadModel overrides that pin whisper to the configured source
 * language (skipping the "auto" sentinel, which lets whisper detect).
 * Whisper applies these at LOAD time via modelConfig (whisperConfigSchema):
 * `language` (e.g. "en", "ar") and `translate: false` to keep the
 * transcript in the source language rather than translating to English.
 */
function whisperLoadOverrides():
  | { modelConfig: { language: string; translate: boolean } }
  | undefined {
  const sourceLanguage = useSettingsStore.getState().sourceLanguage;
  if (!sourceLanguage || sourceLanguage === "auto") return undefined;
  return { modelConfig: { language: sourceLanguage, translate: false } };
}

export async function transcribeInterview(
  interviewId: string,
  modelId: string
): Promise<string> {
  const interview = useInterviewStore.getState().getById(interviewId);
  if (!interview?.audioPath) throw new Error("No audio recorded");

  const sdkModelId = await loadModel(modelId, whisperLoadOverrides());

  const { text } = await runTranscribe(sdkModelId, interview.audioPath);

  useInterviewStore.getState().update(interviewId, {
    originalTranscript: text,
  });

  await unloadModel(modelId);
  return text;
}

export async function transcribeImportedFile(
  interviewId: string,
  modelId: string,
  audioPath: string
): Promise<string> {
  const sdkModelId = await loadModel(modelId, whisperLoadOverrides());

  const { text } = await runTranscribe(sdkModelId, audioPath);

  useInterviewStore.getState().update(interviewId, {
    audioPath,
    originalTranscript: text,
  });

  await unloadModel(modelId);
  return text;
}
