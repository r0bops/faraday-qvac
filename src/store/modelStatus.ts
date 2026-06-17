import { create } from "zustand";

interface ModelStatusState {
  models: Record<string, { loaded: boolean; loading: boolean; progress?: number }>;
  setLoading: (modelId: string, v: boolean, progress?: number) => void;
  setLoaded: (modelId: string, v: boolean) => void;
  getStatus: (modelId: string) => { loaded: boolean; loading: boolean; progress?: number };
}

export const useModelStatus = create<ModelStatusState>((set, get) => ({
  models: {},

  setLoading: (modelId, v, progress) =>
    set((s) => ({
      models: {
        ...s.models,
        [modelId]: { ...(s.models[modelId] ?? { loaded: false, loading: false }), loading: v, progress },
      },
    })),

  setLoaded: (modelId, v) =>
    set((s) => ({
      models: {
        ...s.models,
        [modelId]: { ...(s.models[modelId] ?? { loaded: false, loading: false }), loaded: v, loading: false },
      },
    })),

  getStatus: (modelId) =>
    get().models[modelId] ?? { loaded: false, loading: false },
}));
