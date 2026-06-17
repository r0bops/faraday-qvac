import {
  completion as sdkCompletion,
  loadModel as sdkLoadModel,
  unloadModel as sdkUnloadModel,
  embed as sdkEmbed,
  transcribe as sdkTranscribe,
  transcribeStream as sdkTranscribeStream,
  translate as sdkTranslate,
  textToSpeech as sdkTextToSpeech,
  ocr as sdkOcr,
  ragIngest as sdkRagIngest,
  ragSearch as sdkRagSearch,
  startQVACProvider,
  type CompletionRun,
  type CompletionFinal,
} from "@qvac/sdk";
import { logPerf } from "../lib/log";

// Re-export SDK functions
export { sdkLoadModel as loadModel, sdkUnloadModel as unloadModel };
export { sdkEmbed as embed };
export { sdkTranscribe as transcribe };
export { sdkTranscribeStream as transcribeStream };
export { sdkTranslate as translate };
export { sdkTextToSpeech as textToSpeech };
export { sdkRagIngest as ragIngest };
export { sdkRagSearch as ragSearch };
export { sdkOcr as ocr };
export { startQVACProvider };

let clientReady = false;

export function isInitialized(): boolean {
  return clientReady;
}

export function initQVAC(): void {
  if (clientReady) return;
  clientReady = true;
  logPerf("client", "init", { ts: Date.now() });
}
