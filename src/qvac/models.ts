import Constants from "expo-constants";
import {
  LLAMA_3_2_1B_INST_Q4_0,
  QWEN3_600M_INST_Q4,
  QWEN3_1_7B_INST_Q4,
  WHISPER_TINY_Q8_0,
  WHISPER_BASE_Q8_0,
  EMBEDDINGGEMMA_300M_Q4_0,
  TTS_EN_SUPERTONIC_Q8_0,
  TTS_MULTILINGUAL_SUPERTONIC2_Q8_0,
  OCR_CRAFT_DETECTOR,
  OCR_LATIN_RECOGNIZER_1,
  OCR_ARABIC_RECOGNIZER,
  OCR_CYRILLIC_RECOGNIZER,
  BERGAMOT_AR_EN,
  BERGAMOT_FA_EN,
  BERGAMOT_UK_EN,
  BERGAMOT_RU_EN,
  BERGAMOT_ES_EN,
  BERGAMOT_EN_AR,
  BERGAMOT_EN_FA,
  BERGAMOT_EN_UK,
  BERGAMOT_EN_RU,
  BERGAMOT_EN_ES,
} from "@qvac/sdk";

const cfgExtra = (Constants.expoConfig as unknown as { extra?: Record<string, unknown> })
  ?.extra;
const USE_SIDELOADED_MODELS = cfgExtra?.USE_SIDELOADED_MODELS === true;

export interface ModelEntry {
  key: string;
  name: string;
  modelType: string;
  sizeBytes: number;
  sideloadPath?: string;
  tags: string[];
  /**
   * OCR only: catalog key of the text DETECTOR this recognizer pairs with.
   * The ONNX OCR engine needs a detector + a recognizer; this lets the load
   * path resolve the matching detector for the chosen recognizer.
   */
  detectorKey?: string;
}

export interface ModelPreset {
  llm: string;
  whisper: string;
  nmt: string;
  embeddings: string;
  tts: string;
  ocr: string;
}

export const MODEL_CATALOG: Record<string, ModelEntry> = {
  LLAMA_3_2_1B_INST_Q4_0: {
    key: "LLAMA_3_2_1B_INST_Q4_0",
    name: "Llama 3.2 1B Q4_0",
    modelType: "llm",
    sizeBytes: 700_000_000,
    sideloadPath: "/sdcard/Android/data/io.faraday.app/files/faraday-models/llm/llama-3.2-1b-instruct-q4_0.gguf",
    tags: ["llm", "lightweight", "default"],
  },
  QWEN3_600M_INST_Q4: {
    key: "QWEN3_600M_INST_Q4",
    name: "Qwen3 600M Q4",
    modelType: "llm",
    sizeBytes: 400_000_000,
    sideloadPath: "/sdcard/Android/data/io.faraday.app/files/faraday-models/llm/qwen3-600m-instruct-q4.gguf",
    tags: ["llm", "tiny", "fallback"],
  },
  QWEN3_1_7B_INST_Q4: {
    key: "QWEN3_1_7B_INST_Q4",
    name: "Qwen3 1.7B Q4",
    modelType: "llm",
    sizeBytes: 1_200_000_000,
    sideloadPath: "/sdcard/Android/data/io.faraday.app/files/faraday-models/llm/qwen3-1.7b-instruct-q4.gguf",
    tags: ["llm", "high-ram"],
  },
  WHISPER_TINY_Q8_0: {
    key: "WHISPER_TINY_Q8_0",
    name: "Whisper Tiny Q8_0",
    modelType: "whisper",
    sizeBytes: 78_000_000,
    sideloadPath: "/sdcard/Android/data/io.faraday.app/files/faraday-models/whisper/whisper-tiny-q8_0.bin",
    tags: ["whisper", "tiny", "default"],
  },
  WHISPER_BASE_Q8_0: {
    key: "WHISPER_BASE_Q8_0",
    name: "Whisper Base Q8_0",
    modelType: "whisper",
    sizeBytes: 140_000_000,
    sideloadPath: "/sdcard/Android/data/io.faraday.app/files/faraday-models/whisper/whisper-base-q8_0.bin",
    tags: ["whisper", "base", "accurate"],
  },
  BERGAMOT_AR_EN: {
    key: "BERGAMOT_AR_EN",
    name: "Bergamot AR→EN",
    modelType: "nmt",
    sizeBytes: 45_000_000,
    sideloadPath: "/sdcard/Android/data/io.faraday.app/files/faraday-models/nmt/bergamot-ar-en.bin",
    tags: ["nmt", "arabic"],
  },
  BERGAMOT_FA_EN: {
    key: "BERGAMOT_FA_EN",
    name: "Bergamot FA→EN",
    modelType: "nmt",
    sizeBytes: 45_000_000,
    sideloadPath: "/sdcard/Android/data/io.faraday.app/files/faraday-models/nmt/bergamot-fa-en.bin",
    tags: ["nmt", "farsi"],
  },
  BERGAMOT_UK_EN: {
    key: "BERGAMOT_UK_EN",
    name: "Bergamot UK→EN",
    modelType: "nmt",
    sizeBytes: 45_000_000,
    sideloadPath: "/sdcard/Android/data/io.faraday.app/files/faraday-models/nmt/bergamot-uk-en.bin",
    tags: ["nmt", "ukrainian"],
  },
  BERGAMOT_RU_EN: {
    key: "BERGAMOT_RU_EN",
    name: "Bergamot RU→EN",
    modelType: "nmt",
    sizeBytes: 45_000_000,
    sideloadPath: "/sdcard/Android/data/io.faraday.app/files/faraday-models/nmt/bergamot-ru-en.bin",
    tags: ["nmt", "russian"],
  },
  BERGAMOT_ES_EN: {
    key: "BERGAMOT_ES_EN",
    name: "Bergamot ES→EN",
    modelType: "nmt",
    sizeBytes: 45_000_000,
    sideloadPath: "/sdcard/Android/data/io.faraday.app/files/faraday-models/nmt/bergamot-es-en.bin",
    tags: ["nmt", "spanish"],
  },
  BERGAMOT_EN_AR: {
    key: "BERGAMOT_EN_AR",
    name: "Bergamot EN→AR",
    modelType: "nmt",
    sizeBytes: 45_000_000,
    sideloadPath: "/sdcard/Android/data/io.faraday.app/files/faraday-models/nmt/bergamot-en-ar.bin",
    tags: ["nmt", "arabic"],
  },
  BERGAMOT_EN_FA: {
    key: "BERGAMOT_EN_FA",
    name: "Bergamot EN→FA",
    modelType: "nmt",
    sizeBytes: 45_000_000,
    sideloadPath: "/sdcard/Android/data/io.faraday.app/files/faraday-models/nmt/bergamot-en-fa.bin",
    tags: ["nmt", "farsi"],
  },
  BERGAMOT_EN_UK: {
    key: "BERGAMOT_EN_UK",
    name: "Bergamot EN→UK",
    modelType: "nmt",
    sizeBytes: 45_000_000,
    sideloadPath: "/sdcard/Android/data/io.faraday.app/files/faraday-models/nmt/bergamot-en-uk.bin",
    tags: ["nmt", "ukrainian"],
  },
  BERGAMOT_EN_RU: {
    key: "BERGAMOT_EN_RU",
    name: "Bergamot EN→RU",
    modelType: "nmt",
    sizeBytes: 45_000_000,
    sideloadPath: "/sdcard/Android/data/io.faraday.app/files/faraday-models/nmt/bergamot-en-ru.bin",
    tags: ["nmt", "russian"],
  },
  BERGAMOT_EN_ES: {
    key: "BERGAMOT_EN_ES",
    name: "Bergamot EN→ES",
    modelType: "nmt",
    sizeBytes: 45_000_000,
    sideloadPath: "/sdcard/Android/data/io.faraday.app/files/faraday-models/nmt/bergamot-en-es.bin",
    tags: ["nmt", "spanish"],
  },
  EMBEDDINGGEMMA_300M_Q4_0: {
    key: "EMBEDDINGGEMMA_300M_Q4_0",
    name: "EmbeddingGemma 300M Q4_0",
    modelType: "embeddings",
    sizeBytes: 180_000_000,
    sideloadPath: "/sdcard/Android/data/io.faraday.app/files/faraday-models/embeddings/embeddinggemma-300m-q4_0.bin",
    tags: ["embeddings", "default"],
  },
  TTS_EN_SUPERTONIC_Q8_0: {
    key: "TTS_EN_SUPERTONIC_Q8_0",
    name: "TTS Supertonic EN Q8_0",
    modelType: "tts",
    sizeBytes: 100_000_000,
    sideloadPath: "/sdcard/Android/data/io.faraday.app/files/faraday-models/tts/tts-en-supertonic-q8_0.bin",
    tags: ["tts", "english", "default"],
  },
  TTS_MULTILINGUAL_SUPERTONIC2_Q8_0: {
    key: "TTS_MULTILINGUAL_SUPERTONIC2_Q8_0",
    name: "TTS Supertonic2 Multilingual Q8_0",
    modelType: "tts",
    sizeBytes: 130_000_000,
    sideloadPath: "/sdcard/Android/data/io.faraday.app/files/faraday-models/tts/tts-multilingual-supertonic2-q8_0.bin",
    tags: ["tts", "multilingual"],
  },
  // ONNX OCR is a two-model pipeline: a text DETECTOR finds the boxes, then a
  // RECOGNIZER reads each box. CRAFT is the shared detector for the EasyOCR-style
  // latin/arabic/cyrillic recognizers used below (they live under the same
  // `rec_512`/`rec_dyn` model family). Each recognizer references this via
  // `detectorKey`; `ocrDetectorSrc()` resolves it for the load path.
  OCR_CRAFT_DETECTOR: {
    key: "OCR_CRAFT_DETECTOR",
    name: "OCR CRAFT Detector",
    modelType: "ocr",
    sizeBytes: 83_058_594,
    sideloadPath: "/sdcard/Android/data/io.faraday.app/files/faraday-models/ocr/ocr-craft-detector.onnx",
    tags: ["ocr", "detector"],
  },
  OCR_LATIN_RECOGNIZER_1: {
    key: "OCR_LATIN_RECOGNIZER_1",
    name: "OCR Latin Recognizer",
    modelType: "ocr",
    sizeBytes: 5_000_000,
    sideloadPath: "/sdcard/Android/data/io.faraday.app/files/faraday-models/ocr/ocr-latin-recognizer.bin",
    tags: ["ocr", "latin", "default"],
    detectorKey: "OCR_CRAFT_DETECTOR",
  },
  OCR_ARABIC_RECOGNIZER: {
    key: "OCR_ARABIC_RECOGNIZER",
    name: "OCR Arabic Recognizer",
    modelType: "ocr",
    sizeBytes: 5_000_000,
    sideloadPath: "/sdcard/Android/data/io.faraday.app/files/faraday-models/ocr/ocr-arabic-recognizer.bin",
    tags: ["ocr", "arabic"],
    detectorKey: "OCR_CRAFT_DETECTOR",
  },
  OCR_CYRILLIC_RECOGNIZER: {
    key: "OCR_CYRILLIC_RECOGNIZER",
    name: "OCR Cyrillic Recognizer",
    modelType: "ocr",
    sizeBytes: 5_000_000,
    sideloadPath: "/sdcard/Android/data/io.faraday.app/files/faraday-models/ocr/ocr-cyrillic-recognizer.bin",
    tags: ["ocr", "cyrillic"],
    detectorKey: "OCR_CRAFT_DETECTOR",
  },
};

export const MOBILE_PRESET: ModelPreset = {
  llm: "LLAMA_3_2_1B_INST_Q4_0",
  whisper: "WHISPER_TINY_Q8_0",
  nmt: "BERGAMOT_AR_EN",
  embeddings: "EMBEDDINGGEMMA_300M_Q4_0",
  tts: "TTS_EN_SUPERTONIC_Q8_0",
  ocr: "OCR_LATIN_RECOGNIZER_1",
};

export function getModelEntry(key: string): ModelEntry {
  const entry = MODEL_CATALOG[key];
  if (!entry) throw new Error(`Unknown model: ${key}`);
  return entry;
}

export function getModelPreset(): ModelPreset {
  return { ...MOBILE_PRESET };
}

export function getModelsByTag(tag: string): ModelEntry[] {
  return Object.values(MODEL_CATALOG).filter((m) => m.tags.includes(tag));
}

/**
 * Maps each catalog key to its imported SDK model constant (the value the
 * SDK can resolve/download). When not sideloading, `resolveSrc` returns these
 * constants; only when sideloading do we hand the SDK a local /sdcard path.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MODEL_CONSTANTS: Record<string, any> = {
  LLAMA_3_2_1B_INST_Q4_0,
  QWEN3_600M_INST_Q4,
  QWEN3_1_7B_INST_Q4,
  WHISPER_TINY_Q8_0,
  WHISPER_BASE_Q8_0,
  EMBEDDINGGEMMA_300M_Q4_0,
  TTS_EN_SUPERTONIC_Q8_0,
  TTS_MULTILINGUAL_SUPERTONIC2_Q8_0,
  OCR_CRAFT_DETECTOR,
  OCR_LATIN_RECOGNIZER_1,
  OCR_ARABIC_RECOGNIZER,
  OCR_CYRILLIC_RECOGNIZER,
  BERGAMOT_AR_EN,
  BERGAMOT_FA_EN,
  BERGAMOT_UK_EN,
  BERGAMOT_RU_EN,
  BERGAMOT_ES_EN,
  BERGAMOT_EN_AR,
  BERGAMOT_EN_FA,
  BERGAMOT_EN_UK,
  BERGAMOT_EN_RU,
  BERGAMOT_EN_ES,
};

/**
 * Returns the value to pass as `modelSrc` to the SDK's `loadModel`.
 *
 * - When sideloaded: a local /sdcard path string (explicit override, the
 *   catalog `sideloadPath`, in that order).
 * - When NOT sideloaded: the imported SDK model CONSTANT, which `loadModel`
 *   can download. Passing the catalog KEY string here would fail because the
 *   SDK cannot resolve a bare key.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveSrc(modelKey: string, sideloadPath?: string): any {
  const entry = getModelEntry(modelKey);
  if (USE_SIDELOADED_MODELS) {
    return sideloadPath || entry.sideloadPath || modelKey;
  }
  const constant = MODEL_CONSTANTS[modelKey];
  if (!constant) {
    throw new Error(`No SDK model constant mapped for: ${modelKey}`);
  }
  return constant;
}

/**
 * Resolves the `modelSrc` for the text DETECTOR that pairs with an OCR
 * recognizer, suitable for the OCR engine's `modelConfig.detectorModelSrc`.
 *
 * The ONNX OCR plugin needs both a detector and a recognizer. When the
 * recognizer's `modelSrc` is a `registry://`/`pear://` source the plugin
 * auto-derives the CRAFT detector itself, but for a plain sideloaded file
 * path it CANNOT, and load fails unless `detectorModelSrc` is passed
 * explicitly. This returns the same kind of value `resolveSrc` does:
 *   - sideloaded -> the detector's local /sdcard path
 *   - otherwise  -> the detector SDK constant (download source)
 *
 * Returns `undefined` for recognizers that declare no `detectorKey`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ocrDetectorSrc(recognizerKey: string): any {
  const entry = getModelEntry(recognizerKey);
  if (!entry.detectorKey) return undefined;
  return resolveSrc(entry.detectorKey);
}

function bergamotKey(from: string, to: string): string {
  return `BERGAMOT_${from.toUpperCase()}_${to.toUpperCase()}`;
}

function hasBergamot(from: string, to: string): boolean {
  return Boolean(MODEL_CATALOG[bergamotKey(from, to)]);
}

export type BergamotResolution =
  | { direct: string }
  | { pivot: [string, string] };

/**
 * Resolves which Bergamot catalog key(s) to use for a given language pair.
 *
 * Returns `{ direct }` when a direct model exists, otherwise `{ pivot }`
 * routing through English (from->en then en->to). Throws when neither a
 * direct model nor both pivot legs are available in the catalog.
 */
export function bergamotModel(from: string, to: string): BergamotResolution {
  const src = from.toLowerCase();
  const tgt = to.toLowerCase();
  if (src === tgt) {
    throw new Error(`Source and target languages are identical: ${from}`);
  }

  if (hasBergamot(src, tgt)) {
    return { direct: bergamotKey(src, tgt) };
  }

  // Pivot through English.
  if (src === "en" || tgt === "en") {
    // One leg is English but the direct model is missing entirely.
    throw new Error(`No Bergamot model available for ${from} -> ${to}`);
  }
  const leg1 = bergamotKey(src, "en"); // from -> en
  const leg2 = bergamotKey("en", tgt); // en -> to
  if (!MODEL_CATALOG[leg1] || !MODEL_CATALOG[leg2]) {
    throw new Error(
      `No Bergamot model or pivot path available for ${from} -> ${to}`
    );
  }
  return { pivot: [leg1, leg2] };
}
