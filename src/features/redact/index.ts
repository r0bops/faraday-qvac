import { loadModel, unloadModel } from "../../qvac/modelManager";
import { redact as runRedact, applyRedaction } from "../../qvac/llm";
import { useInterviewStore, type RedactionSpan } from "../../store/interviews";

export async function redactInterview(
  interviewId: string,
  modelId: string
): Promise<{ spans: RedactionSpan[] }> {
  const interview = useInterviewStore.getState().getById(interviewId);
  const text = interview?.originalTranscript;
  if (!text) throw new Error("No transcript available");

  const sdkModelId = await loadModel(modelId);

  const result = await runRedact(text, sdkModelId);

  const spans: RedactionSpan[] = result.spans.map((s) => ({
    ...s,
    approved: false,
  }));

  useInterviewStore.getState().update(interviewId, {
    redactionSpans: spans,
    redactedTranscript: result.redactedText,
  });

  await unloadModel(modelId);
  return { spans };
}

export async function approveRedactionSpan(
  interviewId: string,
  spanIndex: number
): Promise<void> {
  const interview = useInterviewStore.getState().getById(interviewId);
  if (!interview?.redactionSpans) return;

  const spans = [...interview.redactionSpans];
  if (spanIndex >= 0 && spanIndex < spans.length) {
    spans[spanIndex] = { ...spans[spanIndex], approved: true };
  }

  const allApproved = spans.every((s) => s.approved);
  const original = interview.originalTranscript ?? "";

  useInterviewStore.getState().update(interviewId, {
    redactionSpans: spans,
    redactedTranscript: applyRedaction(original, spans),
    redactionApplied: allApproved,
  });
}

export async function toggleRedactionSpan(
  interviewId: string,
  spanIndex: number
): Promise<void> {
  const interview = useInterviewStore.getState().getById(interviewId);
  if (!interview?.redactionSpans) return;

  const spans = [...interview.redactionSpans];
  if (spanIndex >= 0 && spanIndex < spans.length) {
    spans[spanIndex] = { ...spans[spanIndex], approved: !spans[spanIndex].approved };
  }

  const allApproved = spans.every((s) => s.approved);
  const original = interview.originalTranscript ?? "";

  useInterviewStore.getState().update(interviewId, {
    redactionSpans: spans,
    redactedTranscript: applyRedaction(original, spans),
    redactionApplied: allApproved,
  });
}
