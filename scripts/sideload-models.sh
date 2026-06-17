#!/bin/bash
set -euo pipefail

# App-accessible external files dir: readable under scoped storage WITHOUT
# MANAGE_EXTERNAL_STORAGE. The app must be installed first so this dir exists.
DEVICE_DIR="/sdcard/Android/data/io.faraday.app/files/faraday-models"

echo "=== Faraday Model Sideloader ==="
echo "Pushing models to Android device at ${DEVICE_DIR}"

if ! command -v adb &>/dev/null; then
  echo "ERROR: adb not found. Install Android platform-tools."
  exit 1
fi

adb devices | grep -q 'device$' || {
  echo "ERROR: No device connected. Connect a device with USB debugging enabled."
  exit 1
}

adb shell mkdir -p "${DEVICE_DIR}/llm" "${DEVICE_DIR}/whisper" "${DEVICE_DIR}/nmt" "${DEVICE_DIR}/embeddings" "${DEVICE_DIR}/tts" "${DEVICE_DIR}/ocr"

push_models() {
  local subdir=$1; shift
  adb shell mkdir -p "${DEVICE_DIR}/${subdir}"
  for model in "$@"; do
    local src="./assets/models/${subdir}/${model}"
    if [ -f "$src" ]; then
      echo "  Pushing ${model}..."
      adb push "$src" "${DEVICE_DIR}/${subdir}/${model}"
    else
      echo "  SKIP ${model} (not found locally at ${src})"
    fi
  done
}

push_models llm   "llama-3.2-1b-instruct-q4_0.gguf" "qwen3-600m-instruct-q4.gguf" "qwen3-1.7b-instruct-q4.gguf"
push_models whisper "whisper-tiny-q8_0.bin" "whisper-base-q8_0.bin"
push_models nmt   "bergamot-ar-en.bin" "bergamot-fa-en.bin" "bergamot-uk-en.bin" "bergamot-ru-en.bin" "bergamot-es-en.bin" \
                  "bergamot-en-ar.bin" "bergamot-en-fa.bin" "bergamot-en-uk.bin" "bergamot-en-ru.bin" "bergamot-en-es.bin"
push_models embeddings "embeddinggemma-300m-q4_0.bin"
push_models tts   "tts-en-supertonic-q8_0.bin" "tts-multilingual-supertonic2-q8_0.bin"
push_models ocr   "ocr-craft-detector.onnx" "ocr-latin-recognizer.bin" "ocr-arabic-recognizer.bin" "ocr-cyrillic-recognizer.bin"

echo ""
echo "=== Done ==="
echo "Models pushed to ${DEVICE_DIR}"
echo "Run the app with USE_SIDELOADED_MODELS=true to use these weights."
