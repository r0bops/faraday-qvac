import { useAudioRecorder, extractAudioData, type RecordingConfig } from "@siteed/audio-studio";
import type { AudioRecording } from "@siteed/audio-studio";
import { useCallback, useRef, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import { prependWavHeader } from "./wav";

const TARGET_SAMPLE_RATE = 16000;
const TARGET_CHANNELS = 1;
const TARGET_BIT_DEPTH = 16;

export interface ImportAudioResult {
  audioPath: string;
  canceled: boolean;
}

/**
 * Lets the user pick an audio file, then resamples it to 16kHz mono 16-bit PCM
 * (the format whisper requires) and writes it out as a WAV file. Returns the uri
 * of that 16kHz wav as `audioPath`. If resampling is unavailable or fails, falls
 * back to the originally picked uri.
 */
export async function importAudioFile(): Promise<ImportAudioResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["audio/*"],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    return { audioPath: "", canceled: true };
  }

  const originalUri = result.assets[0].uri;

  try {
    if (typeof extractAudioData !== "function") {
      throw new Error("extractAudioData is unavailable");
    }

    const extracted = await extractAudioData({
      fileUri: originalUri,
      includeWavHeader: false,
      decodingOptions: {
        targetSampleRate: TARGET_SAMPLE_RATE,
        targetChannels: TARGET_CHANNELS,
        targetBitDepth: TARGET_BIT_DEPTH,
      },
    });

    const pcm = extracted.pcmData;
    // Copy into a tight ArrayBuffer so prependWavHeader sees exactly the PCM bytes.
    const pcmBuffer = pcm.buffer.slice(
      pcm.byteOffset,
      pcm.byteOffset + pcm.byteLength
    ) as ArrayBuffer;
    const wavBuffer = prependWavHeader(
      pcmBuffer,
      TARGET_SAMPLE_RATE,
      TARGET_CHANNELS,
      TARGET_BIT_DEPTH
    );

    const outFile = new File(Paths.cache, `import-${Date.now()}.wav`);
    if (outFile.exists) {
      outFile.delete();
    }
    outFile.create();
    outFile.write(new Uint8Array(wavBuffer));

    return { audioPath: outFile.uri, canceled: false };
  } catch (e) {
    console.warn(
      "[importAudioFile] Failed to resample imported audio to 16kHz mono; " +
        "passing original file to whisper unchanged (may produce poor results).",
      e
    );
    return { audioPath: originalUri, canceled: false };
  }
}

export interface RecordingController {
  startRecording: (config?: Partial<RecordingConfig>) => Promise<void>;
  stopRecording: () => Promise<AudioRecording | null>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  isRecording: boolean;
  isPaused: boolean;
  durationMs: number;
  size: number;
  fileUri: string | null;
}

export function useRecorder(): RecordingController {
  const { startRecording: start, stopRecording: stop, pauseRecording: pause, resumeRecording: resume, isRecording, isPaused, durationMs, size } = useAudioRecorder();
  const [fileUri, setFileUri] = useState<string | null>(null);

  const defaultConfig: RecordingConfig = {
    sampleRate: 16000,
    channels: 1,
    encoding: "pcm_16bit",
  };

  const handleStart = useCallback(async (config?: Partial<RecordingConfig>) => {
    await start({ ...defaultConfig, ...config });
  }, [start]);

  const handleStop = useCallback(async () => {
    const result = await stop();
    if (result?.fileUri) {
      setFileUri(result.fileUri);
    }
    return result;
  }, [stop]);

  return {
    startRecording: handleStart,
    stopRecording: handleStop,
    pauseRecording: pause,
    resumeRecording: resume,
    isRecording,
    isPaused,
    durationMs,
    size,
    fileUri,
  };
}
