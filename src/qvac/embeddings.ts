import { embed as sdkEmbed } from "@qvac/sdk";
import { logPerf } from "../lib/log";

export async function embed(modelId: string, text: string): Promise<number[]> {
  const t0 = Date.now();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await sdkEmbed({ modelId, text: [text] } as any);
  const vec: number[] = (result.embedding as unknown as number[][])[0];

  logPerf("embeddings", "embed", {
    modelId,
    dim: vec.length,
    textLength: text.length,
    durationMs: Date.now() - t0,
    ts: Date.now(),
  });

  return vec;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("Vector dimension mismatch");
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
