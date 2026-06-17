# Faraday

**The reporting desk that never touches the network.**

An offline, on-device journalist's companion for war zones and unstable sites. Record an interview, transcribe it, translate it, scrub identifying details to protect sources, summarize it, and export — all on your phone, with **zero network traffic** so the OS itself guarantees no one can see what you're doing.

Built for the **QVAC Hackathon I — Unleash Edge AI**, Mobile track, solo submission.

## What Faraday does

1. **Record** — capture an interview in 16 kHz mono WAV (via `@siteed/expo-audio-studio`) or import any audio file (imported files are resampled to 16 kHz mono)
2. **Transcribe** — on-device Whisper (whisper.cpp via QVAC). The sensitive audio file never leaves the phone
3. **Translate** — Bergamot NMT: Arabic, Farsi, Ukrainian, Russian → English (or pivot through English for uncovered pairs)
4. **Redact** (hero feature) — on-device LLM with structured JSON output flags identifying details (names, places, organizations, contact info). Each span is shown in a diff view; the journalist approves/rejects each one. A hard `redactionApplied` gate blocks export until all spans are approved
5. **Summarize** — LLM generates a structured brief (summary + key points)
6. **Encrypted vault** — at-rest encryption for stored interviews
7. **Semantic search** — embed-based RAG across your stored interviews
8. **Export** — share-sheet out as plain text, JSON, or encrypted

### Explicitly OUT of scope

- Device-seizure / forensic anti-tamper, duress-wipe
- Defeating state voiceprint identification
- Deepfake-proof provenance / metadata-strip guarantees

Faraday claims only the **architectural** guarantee — zero network egress at inference time — which is provable by the OS removing the INTERNET permission.

## The existential thesis

In a war zone or under an internet shutdown, the cloud is either **gone** (no network) or **a beacon** (every request is visible metadata). So a reporter's core workflow must run entirely on the phone. Faraday proves this by running in airplane mode. The evidence build removes `android.permission.INTERNET` from the manifest — the OS physically cannot send data. The demo shows the phone in airplane mode with the network indicator off.

## Architecture

```
src/
  qvac/         Thin SDK wrappers (one per capability)
  features/     Orchestration layer (workflows across wrappers + store)
  store/        Zustand state (interviews, settings, model status)
  lib/          Utilities (crypto, perf-logging, audio, permissions, egress trap, WAV header)
  ui/           Theme, shared components
app/            Expo Router screens (Library, Record, Interview/[id], Settings, Models)
plugins/        Expo config plugin (strip-internet-permission on evidence build)
scripts/        ADB sideload script
artifacts/      Submission artifacts
```

### Feature flags (`app.config.ts` ← `.env`)

| Flag | Default | Purpose |
|---|---|---|
| `ENABLE_OCR` | true | OCR feature toggle |
| `ENABLE_TTS` | true | Text-to-speech toggle |
| `ENABLE_RAG` | true | Semantic search toggle |
| `ENABLE_P2P` | false | P2P delegation (scaffolded, untested) |
| `USE_SIDELOADED_MODELS` | false | Use sideloaded weights from `/sdcard/faraday-models/` |
| `EVIDENCE_BUILD` | false | Remove INTERNET permission, trap fetch/XHR |

## Hardware & Software Requirements

- **Physical Android device** (QVAC / llama.cpp do not run on emulators)
- `minSdkVersion 29` (Android 10+)
- Node.js ≥ 22.17, npm ≥ 10.9
- Expo SDK 54

### Recommended device

- 8+ GB RAM for the full pipeline
- 4+ GB free storage for model weights

### Model catalog (all QVAC engines)

| Capability | Default Model | Size |
|---|---|---|
| LLM (redact/summarize) | Llama 3.2 1B Instruct Q4_0 | ~700 MB |
| Whisper (transcribe) | Whisper Tiny Q8_0 | ~78 MB |
| NMT (translate) | Bergamot AR→EN, FA→EN, UK→EN, RU→EN | ~45 MB each |
| Embeddings (RAG) | EmbeddingGemma 300M Q4_0 | ~180 MB |
| TTS | Supertonic EN Q8_0 | ~100 MB |
| OCR | OCR Latin Recognizer | ~5 MB |

Models load/unload **sequentially** to stay within phone RAM limits.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (copy and edit)
cp .env.example .env

# 3. Prebuild native projects (required — Expo Go won't work with QVAC)
npx expo prebuild

# 4. Run on connected Android device
npx expo run:android --device
```

### First dev launch

On first launch, models download once from Hugging Face (open weights, no user data). Subsequent launches use the cached models. The `remote-api-disclosure.json` documents this — it's the only network call in the dev build.

### Evidence build (zero egress)

The evidence build removes `android.permission.INTERNET` from the Android manifest and installs a JS egress trap. All models must be sideloaded first.

```bash
# 1. Place model weights in assets/models/ (or download them from Hugging Face)
# 2. Sideload to device
bash scripts/sideload-models.sh

# 3. Build and run evidence build
echo "EVIDENCE_BUILD=true" >> .env
echo "USE_SIDELOADED_MODELS=true" >> .env
npm run evidence:dev
```

The evidence build **cannot access the network** — the OS denies it. Verify by:
- Putting the phone in airplane mode
- Checking the Android permission list shows no INTERNET permission
- Running the app through the full pipeline — models load from sideloaded paths only

## Reproducibility (for judges)

1. Clone this repo
2. Run `npm install && npx expo prebuild`
3. Connect a physical Android device (USB debugging enabled)
4. Run `npx expo run:android --device`
5. The app launches. Models download once. Put the phone in airplane mode.
6. Record an audio clip → Transcribe → Translate → Redact → Summarize → Export
7. The perf log auto-writes on-device to `perf-log.json` in the app **documentDirectory** (not the repo). Pull it for your submission, e.g. `adb exec-out run-as io.faraday.app cat files/perf-log.json > perf-log.json`. The repo's `artifacts/perf-log.sample.json` is an example; `artifacts/remote-api-disclosure.json` documents remote calls.

### System profiler

Record the following for your submission:
- Phone model, Android version, RAM
- Screenshot of About Phone → Android version screen
- `adb shell cat /proc/meminfo | grep MemTotal`

## Submission Artifacts

| Artifact | Location | Description |
|---|---|---|
| Demo video (≤ 5 min) | YouTube (unlisted) | Full pipeline in airplane mode, network indicator off |
| Remote API disclosure | `artifacts/remote-api-disclosure.json` | Empty in evidence build |
| Auditable perf log | `artifacts/perf-log.sample.json` (sample), runtime at `documentDirectory/perf-log.json` | Model loads, TTFT, tokens/sec |
| License | `LICENSE` | Apache 2.0 |
| Reproducibility README | `README.md` | This file |

## License

Apache 2.0 — see `LICENSE`.
