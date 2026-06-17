import { ragIngest as sdkRagIngest, ragSearch as sdkRagSearch } from "@qvac/sdk";
import { logPerf } from "../lib/log";

export async function ragIngest(
  modelId: string,
  workspaceId: string,
  documents: Array<{ id: string; content: string; metadata?: Record<string, unknown> }>
): Promise<void> {
  const t0 = Date.now();

  // SDK `documents` is string | string[] and does not accept per-doc ids;
  // send all document texts in a single call (ids are resolved by the caller
  // via content/order, since ragSearch returns ids/scores).
  const texts = documents.map((doc) => doc.content);

  if (texts.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await sdkRagIngest({
      modelId,
      documents: texts,
      workspace: workspaceId,
      chunk: true,
    } as any);
  }

  logPerf("rag", "ingest", {
    modelId,
    workspaceId,
    docCount: documents.length,
    durationMs: Date.now() - t0,
    ts: Date.now(),
  });
}

export async function ragSearch(
  modelId: string,
  workspaceId: string,
  query: string,
  topK: number = 5
): Promise<Array<{ id: string; score: number; content: string }>> {
  const t0 = Date.now();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = await sdkRagSearch({
    modelId,
    workspace: workspaceId,
    query,
    topK,
  } as any);

  const hits: Array<Record<string, unknown>> = results && Array.isArray(results) ? results as unknown as Array<Record<string, unknown>> : [];

  logPerf("rag", "search", {
    modelId,
    workspaceId,
    resultCount: hits.length,
    durationMs: Date.now() - t0,
    ts: Date.now(),
  });

  return hits.map((h) => ({
    id: (h.id as string) ?? "",
    score: (h.score as number) ?? 0,
    content: (h.content as string) ?? "",
  }));
}
