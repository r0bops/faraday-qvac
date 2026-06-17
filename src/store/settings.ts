import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { secureStorage } from "./secureStorage";

export type ThemeName = "system" | "dark" | "light";

interface SettingsState {
  theme: ThemeName;
  sourceLanguage: string;
  targetLanguage: string;
  llmModelId: string;
  whisperModelId: string;
  nmtModelId: string;
  embeddingsModelId: string;
  ttsModelId: string;
  ocrModelId: string;
  useSideloaded: boolean;
  setTheme: (theme: ThemeName) => void;
  setLanguage: (source: string, target: string) => void;
  setModelId: (role: string, id: string) => void;
  setUseSideloaded: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dark",
      sourceLanguage: "ar",
      targetLanguage: "en",
      llmModelId: "LLAMA_3_2_1B_INST_Q4_0",
      whisperModelId: "WHISPER_TINY_Q8_0",
      nmtModelId: "BERGAMOT_AR_EN",
      embeddingsModelId: "EMBEDDINGGEMMA_300M_Q4_0",
      ttsModelId: "TTS_EN_SUPERTONIC_Q8_0",
      ocrModelId: "OCR_LATIN_RECOGNIZER_1",
      useSideloaded: false,

      setTheme: (theme) => set({ theme }),
      setLanguage: (source, target) =>
        set({ sourceLanguage: source, targetLanguage: target }),
      setModelId: (role, id) =>
        set({ [`${role}ModelId`]: id } as Partial<SettingsState>),
      setUseSideloaded: (v) => set({ useSideloaded: v }),
    }),
    {
      name: "faraday-settings",
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
