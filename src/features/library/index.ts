import { useInterviewStore } from "../../store/interviews";
import { ragSearch as runRagSearch, ragIngest as runRagIngest } from "../../qvac/rag";
import { loadModel, unloadModel } from "../../qvac/modelManager";

const WORKSPACE_ID = "faraday-library";

// Tracks the corpus signature (per workspace+model) of the last successful
// ingest so we only re-ingest when interviews actually changed, instead of
// re-ingesting the whole library on every search (which duplicated HyperDB
// entries and made search O(n) per query).
const lastIngestSignature = new Map<string, string>();

// Maps document content -> interviewId so search hits (whose ids are
// chunk/internal ids from the SDK, not interview ids) can be resolved back
// to interviews by matching the originating content.
let contentToInterviewId = new Map<string, string>();

export async function searchInterviews(
  query: string,
  embeddingsModelId: string,
  topK: number = 5
): Promise<Array<{ interviewId: string; score: number; snippet: string }>> {
  const interviews = useInterviewStore.getState().interviews;

  if (interviews.length === 0) return [];

  await loadModel(embeddingsModelId);

  const docs = interviews
    .filter((i) => i.originalTranscript)
    .map((i) => ({
      id: i.id,
      content: i.redactedTranscript || i.originalTranscript || "",
      metadata: { title: i.title, createdAt: i.createdAt },
    }));

  // Signature of the corpus: id + content marker for each doc. If it matches
  // the last ingest for this workspace/model, skip re-ingesting.
  const signature = docs
    .map((d) => `${d.id}:${d.content.length}:${d.content.slice(0, 64)}`)
    .join("|");
  const signatureKey = `${WORKSPACE_ID}::${embeddingsModelId}`;

  if (lastIngestSignature.get(signatureKey) !== signature) {
    await runRagIngest(embeddingsModelId, WORKSPACE_ID, docs);
    lastIngestSignature.set(signatureKey, signature);
  }

  // Rebuild content->interviewId map so we can resolve search hits back to
  // interviews regardless of how the SDK chunked/id'd the documents.
  contentToInterviewId = new Map(docs.map((d) => [d.content, d.id]));

  const results = await runRagSearch(embeddingsModelId, WORKSPACE_ID, query, topK);

  await unloadModel(embeddingsModelId);

  return results.map((r) => ({
    interviewId: contentToInterviewId.get(r.content) ?? r.id,
    score: r.score,
    snippet: r.content.slice(0, 200),
  }));
}
