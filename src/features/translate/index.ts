import { loadModel, unloadModel } from "../../qvac/modelManager";
import { translate as runTranslate } from "../../qvac/translate";
import { bergamotModel } from "../../qvac/models";
import { useInterviewStore } from "../../store/interviews";

/**
 * Translates `text` from `from` to `to` using the Bergamot model(s) DERIVED
 * from the language pair (not a fixed settings.nmtModelId). Uses a direct
 * model when one exists, otherwise pivots through English. Each leg is
 * loaded, run, and unloaded sequentially via the modelManager.
 */
async function translateText(
  text: string,
  from: string,
  to: string
): Promise<string> {
  // Bergamot has no "auto" model; the source language must be concrete so we
  // can derive the model pair below.
  if (!from || from === "auto") {
    throw new Error("Select a specific source language for offline translation");
  }

  const resolution = bergamotModel(from, to);

  if ("direct" in resolution) {
    return runLeg(resolution.direct, text, from, to);
  }

  // Pivot: from -> en, then en -> to.
  const [leg1, leg2] = resolution.pivot;
  const intermediate = await runLeg(leg1, text, from, "en");
  return runLeg(leg2, intermediate, "en", to);
}

async function runLeg(
  modelKey: string,
  text: string,
  from: string,
  to: string
): Promise<string> {
  const sdkModelId = await loadModel(modelKey);
  try {
    const { text: translated } = await runTranslate(sdkModelId, text, from, to);
    return translated;
  } finally {
    await unloadModel(modelKey);
  }
}

export async function translateInterview(
  interviewId: string,
  // Deprecated: the model is now DERIVED from the language pair below, not a
  // fixed settings.nmtModelId. Kept for backwards-compatible call sites.
  _modelId: string,
  from: string,
  to: string
): Promise<string> {
  const interview = useInterviewStore.getState().getById(interviewId);
  const text = interview?.redactedTranscript || interview?.originalTranscript;
  if (!text) throw new Error("No transcript available");

  const translated = await translateText(text, from, to);

  useInterviewStore.getState().update(interviewId, {
    translatedTranscript: translated,
    sourceLanguage: from,
    targetLanguage: to,
  });

  return translated;
}
