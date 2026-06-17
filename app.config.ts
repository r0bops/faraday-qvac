import type { ExpoConfig, ConfigContext } from "expo/config";

const ENABLE_OCR = process.env.ENABLE_OCR !== "false";
const ENABLE_TTS = process.env.ENABLE_TTS !== "false";
const ENABLE_RAG = process.env.ENABLE_RAG !== "false";
const ENABLE_P2P = process.env.ENABLE_P2P === "true";
const USE_SIDELOADED_MODELS = process.env.USE_SIDELOADED_MODELS === "true";
const EVIDENCE_BUILD = process.env.EVIDENCE_BUILD === "true";

export default ({ config }: ConfigContext): Partial<ExpoConfig> => {
  return {
    ...config,
    extra: {
      ...(config.extra as Record<string, unknown>),
      ENABLE_OCR,
      ENABLE_TTS,
      ENABLE_RAG,
      ENABLE_P2P,
      USE_SIDELOADED_MODELS,
      EVIDENCE_BUILD,
    },
  };
};
