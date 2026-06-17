import { File, Paths } from "expo-file-system";
import type { StateStorage } from "zustand/middleware";

import { decryptString, encryptString } from "../lib/crypto";

// Async StateStorage adapter backed by the expo-file-system File API. Each store
// is persisted to a single file in the document directory, encrypted at rest with
// the secret vault key (AES-256-GCM) via crypto.encryptString/decryptString.
export const secureStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const file = new File(Paths.document, name);
      if (!file.exists) return null;
      const ciphertext = file.textSync();
      if (!ciphertext) return null;
      return await decryptString(ciphertext);
    } catch {
      // Corrupt/undecryptable data should not crash hydration.
      return null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    const file = new File(Paths.document, name);
    if (!file.exists) file.create();
    const ciphertext = await encryptString(value);
    file.write(ciphertext);
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      const file = new File(Paths.document, name);
      if (file.exists) file.delete();
    } catch {
      // Ignore deletion errors (e.g. file already gone).
    }
  },
};
