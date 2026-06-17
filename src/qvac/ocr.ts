import { ocr as sdkOcr } from "@qvac/sdk";
import { logPerf } from "../lib/log";
import { ocrDetectorSrc } from "./models";

export interface OCRBlock {
  text: string;
  bbox?: { x: number; y: number; w: number; h: number };
  confidence?: number;
}

/**
 * ONNX OCR is a TWO-model pipeline: a text DETECTOR locates word/line boxes,
 * then a RECOGNIZER reads each box. The app catalog now carries both — every
 * OCR recognizer entry references `OCR_CRAFT_DETECTOR` via `detectorKey`, and
 * `ocrDetectorSrc(recognizerKey)` resolves that detector's load source.
 *
 * How the detector reaches the engine depends on how the recognizer is loaded:
 *
 *  - DOWNLOAD path (default, USE_SIDELOADED_MODELS=false): `loadModel` is given
 *    the recognizer SDK constant, whose `src` is a `registry://...` URL. The
 *    SDK's onnx-ocr plugin (`deriveDetectorSource`) then auto-pairs the CRAFT
 *    detector from a `registry://`/`pear://` recognizer source on its own — so
 *    no extra config is required and OCR loads both models. (Verified against
 *    node_modules/@qvac/sdk/dist/server/bare/plugins/onnx-ocr/plugin.js.)
 *
 *  - SIDELOADED path: the recognizer `modelSrc` is a plain `/sdcard/...` file
 *    path, which the plugin CANNOT auto-pair from — it throws "Detector model
 *    required for OCR". In that case the detector must be passed explicitly as
 *    `modelConfig.detectorModelSrc` at load time, e.g.:
 *
 *      loadModel(ocrModelKey, {
 *        modelConfig: { detectorModelSrc: ocrDetectorSrc(ocrModelKey) },
 *      });
 *
 * TODO(faraday): the OCR load call lives in src/features/ocr/index.ts and
 * currently calls `loadModel(modelId)` with no overrides. To support the
 * sideloaded path, thread `modelConfig.detectorModelSrc: ocrDetectorSrc(modelId)`
 * through that call (and confirm on-device that CRAFT is the correct detector
 * for the latin/arabic/cyrillic recognizers — they belong to the EasyOCR
 * rec_512/rec_dyn family that CRAFT serves; the doctr `db_*` detectors pair
 * instead with the crnn/parseq recognizers). The download path already works.
 */
export { ocrDetectorSrc };

export async function ocr(modelId: string, image: string): Promise<{ blocks: OCRBlock[] }> {
  const t0 = Date.now();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = sdkOcr({ modelId, image } as any);
  const blockList = (await result.blocks) as Array<{
    text: string;
    bbox?: [number, number, number, number];
    confidence?: number;
  }>;

  const blocks: OCRBlock[] = blockList.map((b) => ({
    text: b.text,
    bbox: b.bbox ? { x: b.bbox[0], y: b.bbox[1], w: b.bbox[2], h: b.bbox[3] } : undefined,
    confidence: b.confidence,
  }));

  logPerf("ocr", "recognize", {
    modelId,
    blockCount: blocks.length,
    durationMs: Date.now() - t0,
    ts: Date.now(),
  });

  return { blocks };
}
