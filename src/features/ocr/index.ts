import { loadModel, unloadModel } from "../../qvac/modelManager";
import { ocr as runOcr } from "../../qvac/ocr";
import { useInterviewStore } from "../../store/interviews";
import { useSettingsStore } from "../../store/settings";

/**
 * Runs OCR over a captured/selected document image, joins the recognized
 * text blocks, and appends the result to the interview's `docsText`.
 * Returns the extracted text.
 */
export async function ocrDocument(
  interviewId: string,
  imageUri: string
): Promise<string> {
  const modelId = useSettingsStore.getState().ocrModelId;

  const sdkModelId = await loadModel(modelId);
  let extracted: string;
  try {
    const { blocks } = await runOcr(sdkModelId, imageUri);
    extracted = blocks
      .map((b) => b.text)
      .filter((t) => t && t.trim().length > 0)
      .join("\n")
      .trim();
  } finally {
    await unloadModel(modelId);
  }

  const interview = useInterviewStore.getState().getById(interviewId);
  const prior = interview?.docsText;
  const combined = prior ? `${prior}\n\n${extracted}` : extracted;

  useInterviewStore.getState().update(interviewId, { docsText: combined });

  return combined;
}
