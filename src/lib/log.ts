// SDK 54 expo-file-system: the new synchronous File/Paths API.
// (The old documentDirectory/writeAsStringAsync helpers moved to the unstable "/legacy" subpath.)
import { File, Paths } from "expo-file-system";

const LOG_FILE = new File(Paths.document, "perf-log.json");
const MAX_ENTRIES = 1000;

export interface PerfEntry {
  capability: string;
  model?: string;
  event: string;
  promptTokens?: number;
  generatedTokens?: number;
  ttftMs?: number;
  tokensPerSec?: number;
  backendDevice?: string;
  durationMs?: number;
  ts: number;
  [key: string]: unknown;
}

const AUTO_FLUSH_DELAY_MS = 3000;

let entries: PerfEntry[] = [];
let dirty = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush(): void {
  if (flushTimer !== null) return; // single pending timer
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushPerfLog();
  }, AUTO_FLUSH_DELAY_MS);
}

export function logPerf(
  capability: string,
  event: string,
  data: Partial<Omit<PerfEntry, "capability" | "event" | "ts">> = {},
): void {
  const entry: PerfEntry = { capability, event, ts: Date.now(), ...data };
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.shift();
  dirty = true;
  scheduleFlush();
}

export function getPerfEntries(): ReadonlyArray<PerfEntry> {
  return entries;
}

export async function flushPerfLog(): Promise<void> {
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (!dirty) return;
  try {
    if (!LOG_FILE.exists) LOG_FILE.create();
    LOG_FILE.write(JSON.stringify(entries, null, 2));
    dirty = false;
  } catch (err) {
    console.warn("Failed to flush perf log:", err);
  }
}

export async function loadPerfLog(): Promise<void> {
  try {
    if (LOG_FILE.exists) {
      entries = JSON.parse(LOG_FILE.textSync());
    }
  } catch (err) {
    console.warn("Failed to load perf log:", err);
  }
}
