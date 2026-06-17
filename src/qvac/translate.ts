import { translate as sdkTranslate } from "@qvac/sdk";
import { logPerf } from "../lib/log";

export async function translate(
  modelId: string,
  text: string,
  from: string,
  to: string
): Promise<{ text: string }> {
  const t0 = Date.now();

  let resultText = "";
  try {
    // sdkTranslate returns synchronously. For nmt the param schema is
    // {modelId,text,stream,modelType} ONLY (z.strict rejects extras such as
    // from/to). Bergamot bakes the direction into the model, so from/to are
    // used by callers to pick the model upstream but are NOT sent to the SDK.
    // Bergamot emits the whole text, so await result.text rather than streaming.
    const result = sdkTranslate({
      modelId,
      text,
      stream: true,
      modelType: "nmt",
    });

    resultText = await result.text;
  } catch (err) {
    logPerf("nmt", "translate-error", {
      modelId,
      from,
      to,
      message: err instanceof Error ? err.message : String(err),
      ts: Date.now(),
    });
    throw err;
  }

  logPerf("nmt", "translate", {
    modelId,
    from,
    to,
    inputLength: text.length,
    outputLength: resultText.length,
    durationMs: Date.now() - t0,
    ts: Date.now(),
  });

  return { text: resultText };
}
