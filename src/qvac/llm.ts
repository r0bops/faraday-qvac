import { completion as sdkCompletion } from "@qvac/sdk";
import { logPerf } from "../lib/log";

export interface CompletionOpts {
  modelId: string;
  history: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  stream?: boolean;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
}

/**
 * Maps app-level CompletionOpts to the SDK's llama.cpp generationParams
 * ({temp, top_p, predict}). Omits undefined keys so the SDK's z.strict
 * schema never sees stray/unknown values. Returns undefined when nothing
 * was provided, so the caller can omit the key entirely.
 */
function buildGenerationParams(
  opts: CompletionOpts
): { temp?: number; top_p?: number; predict?: number } | undefined {
  const params: { temp?: number; top_p?: number; predict?: number } = {};
  if (opts.temperature !== undefined) params.temp = opts.temperature;
  if (opts.topP !== undefined) params.top_p = opts.topP;
  if (opts.maxTokens !== undefined) params.predict = opts.maxTokens;
  return Object.keys(params).length > 0 ? params : undefined;
}

export async function completion(opts: CompletionOpts): Promise<{
  text: string;
  stats?: Record<string, unknown>;
}> {
  const generationParams = buildGenerationParams(opts);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const run = sdkCompletion({
    modelId: opts.modelId,
    history: opts.history,
    stream: opts.stream ?? true,
    ...(generationParams ? { generationParams } : {}),
  } as any);

  let text = "";
  for await (const token of run.tokenStream) {
    text += token;
  }

  const final = await run.final;

  logPerf("llm", "completion", {
    modelId: opts.modelId,
    promptTokens: final.stats?.promptTokens,
    generatedTokens: final.stats?.generatedTokens,
    ttftMs: final.stats?.timeToFirstToken,
    tokensPerSec: final.stats?.tokensPerSecond,
    ts: Date.now(),
  });

  return { text, stats: final.stats };
}

export async function completionStructured<T>(
  opts: CompletionOpts & { jsonSchema: Record<string, unknown> }
): Promise<T> {
  const generationParams = buildGenerationParams(opts);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const run = sdkCompletion({
    modelId: opts.modelId,
    history: opts.history,
    stream: true,
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "response",
        schema: opts.jsonSchema,
      },
    },
    ...(generationParams ? { generationParams } : {}),
  } as any);

  let text = "";
  for await (const token of run.tokenStream) {
    text += token;
  }

  const final = await run.final;

  logPerf("llm", "completionStructured", {
    modelId: opts.modelId,
    promptTokens: final.stats?.promptTokens,
    generatedTokens: final.stats?.generatedTokens,
    ttftMs: final.stats?.timeToFirstToken,
    tokensPerSec: final.stats?.tokensPerSecond,
    ts: Date.now(),
  });

  return parseStructured<T>(text);
}

/**
 * Safely parse a model's structured (JSON) output. The model can drift and
 * emit prose, a fenced block, or truncated JSON; a bare JSON.parse() would
 * throw an opaque SyntaxError and crash redact/summarize. We first try a
 * direct parse, then a best-effort extraction of the first {...} block, and
 * finally throw a clear Error with a snippet of the raw text.
 */
function parseStructured<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    // Best-effort: extract the first balanced-looking {...} block and retry.
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(text.slice(first, last + 1)) as T;
      } catch {
        // fall through to the error below
      }
    }
    const snippet = text.slice(0, 200);
    throw new Error(
      `Failed to parse structured model output as JSON. Raw output (truncated): ${snippet}`
    );
  }
}

export async function redact(
  transcript: string,
  modelId: string
): Promise<{
  spans: Array<{ text: string; type: string; reason: string; start: number; end: number }>;
  redactedText: string;
}> {
  const raw = await completionStructured<{
    spans: Array<{ text: string; type: string; reason: string }>;
  }>({
    modelId,
    history: [
      {
        role: "system",
        content:
          "You are a source-protection redaction tool for journalists. Identify and flag identifying details in interview transcripts. Types: NAME, PLACE, ORGANIZATION, IDENTIFYING_DETAIL, CONTACT_INFO, DATE_SPECIFIC. Be aggressive — flag anything that could identify a source. Include the exact text to redact.",
      },
      {
        role: "user",
        content: `Redact identifying details from this transcript:\n\n${transcript}`,
      },
    ],
    jsonSchema: {
      type: "object",
      properties: {
        spans: {
          type: "array",
          items: {
            type: "object",
            properties: {
              text: { type: "string" },
              type: { type: "string" },
              reason: { type: "string" },
            },
            required: ["text", "type", "reason"],
          },
        },
      },
      required: ["spans"],
    },
    temperature: 0.1,
  });

  const resolvedSpans = raw.spans.map((span) => {
    const start = transcript.indexOf(span.text);
    const end = start >= 0 ? start + span.text.length : -1;
    // Initial result: nothing approved yet, so the masked text equals the
    // original. Approval happens during review (see features/redact).
    return { ...span, start, end, approved: false };
  });

  const redactedText = applyRedaction(transcript, resolvedSpans);

  return { spans: resolvedSpans, redactedText };
}

/**
 * Produce a redacted copy of `originalTranscript` by masking ONLY the spans
 * that have been approved. Each approved span's text is replaced (all
 * occurrences, regex-escaped) with `[TYPE]`. Spans that are not approved are
 * left untouched, so with zero approvals the output equals the input.
 */
export function applyRedaction(
  originalTranscript: string,
  spans: Array<{ text: string; type: string; approved?: boolean }>
): string {
  let redacted = originalTranscript;
  for (const span of spans) {
    if (!span.approved || !span.text) continue;
    const escaped = span.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    redacted = redacted.replace(new RegExp(escaped, "g"), `[${span.type}]`);
  }
  return redacted;
}

export async function summarize(
  text: string,
  modelId: string
): Promise<{ summary: string; keyPoints: string[] }> {
  const raw = await completionStructured<{
    summary: string;
    keyPoints: string[];
  }>({
    modelId,
    history: [
      {
        role: "system",
        content:
          "Summarize the following text for a journalist's brief. Provide a concise summary and 3-5 key points.",
      },
      { role: "user", content: text },
    ],
    jsonSchema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        keyPoints: { type: "array", items: { type: "string" } },
      },
      required: ["summary", "keyPoints"],
    },
    temperature: 0.3,
  });

  return raw;
}
