import { textToSpeech as sdkTextToSpeech } from "@qvac/sdk";
import { File, Paths } from "expo-file-system";
import { logPerf } from "../lib/log";
import { prependWavHeader } from "../lib/wav";

const TTS_SAMPLE_RATE = 44100;

export async function textToSpeech(
  modelId: string,
  text: string
): Promise<number[]> {
  const t0 = Date.now();

  // textToSpeech() returns a TextToSpeechStreamResult SYNCHRONOUSLY (NOT a Promise).
  // In stream:false mode the Int16 PCM samples resolve via result.buffer.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = sdkTextToSpeech({
    modelId,
    text,
    inputType: "text",
    stream: false,
  } as any);
  const pcm = (await result.buffer) as number[];

  logPerf("tts", "synthesize", {
    modelId,
    textLength: text.length,
    durationMs: Date.now() - t0,
    ts: Date.now(),
  });

  return pcm;
}

export function makeWavBuffer(pcmData: number[], sampleRate: number = 44100): ArrayBuffer {
  const pcmBuffer = new Int16Array(pcmData).buffer;
  return prependWavHeader(pcmBuffer, sampleRate);
}

/**
 * Synthesizes `text` to speech and writes it to a WAV file on disk.
 * Returns the file uri of the written WAV (44100 Hz, mono, 16-bit PCM).
 */
export async function synthesizeToWavFile(modelId: string, text: string): Promise<string> {
  const pcm = await textToSpeech(modelId, text);
  const wavBuffer = makeWavBuffer(pcm, TTS_SAMPLE_RATE);

  const file = new File(Paths.cache, `tts-${Date.now()}.wav`);
  if (file.exists) file.delete();
  file.create();
  file.write(new Uint8Array(wavBuffer));

  logPerf("tts", "writeWav", {
    modelId,
    sampleCount: pcm.length,
    uri: file.uri,
    ts: Date.now(),
  });

  return file.uri;
}
