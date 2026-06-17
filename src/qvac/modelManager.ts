import {
  loadModel as sdkLoadModel,
} from "@qvac/sdk";
import { getModelEntry, resolveSrc, type ModelEntry } from "./models";
import { logPerf } from "../lib/log";
import { useModelStatus } from "../store/modelStatus";
import { isInitialized } from "./client";

let loadedModels = new Map<string, { modelId: string; entry: ModelEntry }>();
let loadingId: string | null = null;

export async function loadModel(
  modelKey: string,
  overrides?: Record<string, unknown>,
  sideloadPath?: string
): Promise<string> {
  const entry = getModelEntry(modelKey);

  if (loadedModels.has(modelKey)) return loadedModels.get(modelKey)!.modelId;

  // Single-resident: free any other loaded model before loading a new one so two
  // large models are never co-resident on a phone (RAM). unloadModel is hoisted.
  for (const otherKey of Array.from(loadedModels.keys())) {
    if (otherKey !== modelKey) await unloadModel(otherKey);
  }

  if (loadingId && loadingId !== modelKey) {
    throw new Error(`Another model is loading: ${loadingId}. Load/unload sequentially.`);
  }

  loadingId = modelKey;
  useModelStatus.getState().setLoading(modelKey, true);

  // When sideloaded -> local /sdcard path; otherwise the imported SDK
  // constant the SDK can download. Never the bare catalog key.
  const modelSrc = resolveSrc(modelKey, sideloadPath);
  const options: Record<string, unknown> = {
    modelSrc,
    modelType: entry.modelType,
    ...overrides,
  };

  const t0 = Date.now();
  let loadedId: string;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loadedId = await sdkLoadModel(options as any);
  } catch (err) {
    // GPU load failed: never leave the loading state stuck (the UI would
    // wedge), then retry once on CPU.
    loadingId = null;
    useModelStatus.getState().setLoading(modelKey, false);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      loadedId = await sdkLoadModel(withCpuFallback(options, entry) as any);
    } catch (retryErr) {
      // CPU retry also failed: clear state and surface the error.
      loadingId = null;
      useModelStatus.getState().setLoading(modelKey, false);
      throw retryErr;
    }
    // Mark loading again so the success path below clears it consistently.
    loadingId = modelKey;
    useModelStatus.getState().setLoading(modelKey, true);
  }
  const loadMs = Date.now() - t0;

  loadedModels.set(modelKey, { modelId: loadedId, entry });
  loadingId = null;
  useModelStatus.getState().setLoading(modelKey, false);
  useModelStatus.getState().setLoaded(modelKey, true);

  logPerf("modelManager", "load", {
    modelId: modelKey,
    modelType: entry.modelType,
    sizeBytes: entry.sizeBytes,
    loadMs,
    ts: Date.now(),
  });

  return loadedId;
}

/**
 * Returns a copy of the load options forcing CPU execution. Whisper uses
 * `contextParams.use_gpu`; the other engines use `modelConfig.device`.
 */
function withCpuFallback(
  options: Record<string, unknown>,
  entry: ModelEntry
): Record<string, unknown> {
  const next = { ...options };
  if (entry.modelType === "whisper") {
    const contextParams = {
      ...((next.contextParams as Record<string, unknown>) || {}),
      use_gpu: false,
    };
    next.contextParams = contextParams;
  } else {
    const modelConfig = {
      ...((next.modelConfig as Record<string, unknown>) || {}),
      device: "cpu",
    };
    next.modelConfig = modelConfig;
  }
  return next;
}

export async function unloadModel(modelKey: string): Promise<void> {
  const { unloadModel: sdkUnload } = await import("@qvac/sdk");
  const lm = loadedModels.get(modelKey);
  if (!lm) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await sdkUnload({ modelId: lm.modelId } as any);
  loadedModels.delete(modelKey);
  useModelStatus.getState().setLoaded(modelKey, false);
  logPerf("modelManager", "unload", { modelId: modelKey, ts: Date.now() });
}

export function isModelLoaded(modelKey: string): boolean {
  return loadedModels.has(modelKey);
}

export function getLoadedModelIds(): string[] {
  return Array.from(loadedModels.keys());
}
