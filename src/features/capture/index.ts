import { useCallback, useState } from "react";
import { useRecorder } from "../../lib/audio";
import { useInterviewStore } from "../../store/interviews";
import { requestAudioPermission } from "../../lib/permissions";

export function useCapture(interviewId: string) {
  const recorder = useRecorder();
  const updateInterview = useInterviewStore((s) => s.update);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setError(null);
    const granted = await requestAudioPermission();
    if (!granted) {
      setError("Microphone permission denied");
      return;
    }
    try {
      await recorder.startRecording({ sampleRate: 16000, channels: 1 });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start recording");
    }
  }, [recorder]);

  const stop = useCallback(async () => {
    try {
      const result = await recorder.stopRecording();
      if (result?.fileUri) {
        updateInterview(interviewId, { audioPath: result.fileUri });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to stop recording");
    }
  }, [recorder, interviewId, updateInterview]);

  return {
    startRecording: start,
    stopRecording: stop,
    pauseRecording: recorder.pauseRecording,
    resumeRecording: recorder.resumeRecording,
    isRecording: recorder.isRecording,
    isPaused: recorder.isPaused,
    durationMs: recorder.durationMs,
    fileUri: recorder.fileUri,
    error,
  };
}
