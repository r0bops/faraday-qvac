import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { secureStorage } from "./secureStorage";

export interface RedactionSpan {
  text: string;
  type: string;
  reason: string;
  start: number;
  end: number;
  approved: boolean;
}

export interface Interview {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  audioPath?: string;
  originalTranscript?: string;
  translatedTranscript?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  redactedTranscript?: string;
  redactionSpans?: RedactionSpan[];
  redactionApplied: boolean;
  docsText?: string;
  summary?: string;
  keyPoints?: string[];
  exportPath?: string;
  tags: string[];
  notes: string;
}

interface InterviewState {
  interviews: Interview[];
  activeId: string | null;
  setActive: (id: string | null) => void;
  create: (title?: string) => Interview;
  update: (id: string, patch: Partial<Interview>) => void;
  remove: (id: string) => void;
  getById: (id: string) => Interview | undefined;
}

let nextId = 1;

export const useInterviewStore = create<InterviewState>()(
  persist(
    (set, get) => ({
      interviews: [],
      activeId: null,

      setActive: (id) => set({ activeId: id }),

      create: (title) => {
        const id = `int-${Date.now()}-${nextId++}`;
        const interview: Interview = {
          id,
          title: title ?? `Interview ${new Date().toLocaleDateString()}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          redactionApplied: false,
          tags: [],
          notes: "",
        };
        set((s) => ({
          interviews: [...s.interviews, interview],
          activeId: id,
        }));
        return interview;
      },

      update: (id, patch) =>
        set((s) => ({
          interviews: s.interviews.map((i) =>
            i.id === id ? { ...i, ...patch, updatedAt: Date.now() } : i
          ),
        })),

      remove: (id) =>
        set((s) => ({
          interviews: s.interviews.filter((i) => i.id !== id),
          activeId: s.activeId === id ? null : s.activeId,
        })),

      getById: (id) => get().interviews.find((i) => i.id === id),
    }),
    {
      name: "faraday-interviews",
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
