import Constants from "expo-constants";

// process.env is undefined under Hermes; read flags from the app config's
// `extra` block instead (populated via app.config/app.json -> expo-constants).
const extraConfig = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

const ENABLE_OCR = extraConfig.ENABLE_OCR !== "false" && extraConfig.ENABLE_OCR !== false;
const ENABLE_TTS = extraConfig.ENABLE_TTS !== "false" && extraConfig.ENABLE_TTS !== false;
const ENABLE_RAG = extraConfig.ENABLE_RAG !== "false" && extraConfig.ENABLE_RAG !== false;
const ENABLE_P2P = extraConfig.ENABLE_P2P === "true" || extraConfig.ENABLE_P2P === true;
const USE_SIDELOADED_MODELS =
  extraConfig.USE_SIDELOADED_MODELS === "true" || extraConfig.USE_SIDELOADED_MODELS === true;
const EVIDENCE_BUILD =
  extraConfig.EVIDENCE_BUILD === "true" || extraConfig.EVIDENCE_BUILD === true;

export const extra = {
  ENABLE_OCR,
  ENABLE_TTS,
  ENABLE_RAG,
  ENABLE_P2P,
  USE_SIDELOADED_MODELS,
  EVIDENCE_BUILD,
};
