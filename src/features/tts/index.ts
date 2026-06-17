import { loadModel, unloadModel } from "../../qvac/modelManager";
import { synthesizeToWavFile } from "../../qvac/tts";

/**
 * Synthesizes `text` for an interview to a WAV file using the given TTS model.
 * Loads the model, renders the audio to disk, unloads, and returns the file uri.
 */
export async function speakInterview(
  interviewId: string,
  modelId: string,
  text: string
): Promise<string> {
  if (!text) throw new Error("No text to synthesize");

  const sdkModelId = await loadModel(modelId);
  try {
    return await synthesizeToWavFile(sdkModelId, text);
  } finally {
    await unloadModel(modelId);
  }
}
