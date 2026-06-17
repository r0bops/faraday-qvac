import { loadModel, unloadModel } from "../../qvac/modelManager";
import { summarize as runSummarize } from "../../qvac/llm";
import { useInterviewStore } from "../../store/interviews";

export async function summarizeInterview(
  interviewId: string,
  modelId: string
): Promise<{ summary: string; keyPoints: string[] }> {
  const interview = useInterviewStore.getState().getById(interviewId);
  const text = interview?.redactedTranscript || interview?.originalTranscript;
  if (!text) throw new Error("No transcript available");

  const sdkModelId = await loadModel(modelId);

  const result = await runSummarize(text, sdkModelId);

  useInterviewStore.getState().update(interviewId, {
    summary: result.summary,
    keyPoints: result.keyPoints,
  });

  await unloadModel(modelId);
  return result;
}
