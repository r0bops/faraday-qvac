import { gcm } from "@noble/ciphers/aes.js";
import {
  bytesToHex,
  hexToBytes,
  utf8ToBytes,
  bytesToUtf8,
} from "@noble/ciphers/utils.js";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const VAULT_KEY_ALIAS = "faraday-vault-key";
const VAULT_PREFIX = "faraday-vault:";

const NONCE_BYTES = 12;
const KEY_BYTES = 32;

let vaultKey: Uint8Array | null = null;

// Returns the SECRET 32-byte AES-256 key. It is generated once via a CSPRNG and
// kept (hex-encoded) in the OS keystore (SecureStore), then reused. The key is
// NEVER derived from a public identifier — it is a real secret.
async function getKey(): Promise<Uint8Array> {
  if (vaultKey) return vaultKey;

  const stored = await SecureStore.getItemAsync(VAULT_KEY_ALIAS);
  if (stored) {
    vaultKey = hexToBytes(stored);
    return vaultKey;
  }

  const bytes = Crypto.getRandomBytes(KEY_BYTES);
  const key = Uint8Array.from(bytes);
  await SecureStore.setItemAsync(VAULT_KEY_ALIAS, bytesToHex(key));
  vaultKey = key;
  return vaultKey;
}

// Authenticated AES-256-GCM. Output format: hex(nonce) + ":" + hex(ciphertext+tag).
function encryptWith(key: Uint8Array, plaintext: string): string {
  const nonce = Uint8Array.from(Crypto.getRandomBytes(NONCE_BYTES));
  const ct = gcm(key, nonce).encrypt(utf8ToBytes(plaintext));
  return `${bytesToHex(nonce)}:${bytesToHex(ct)}`;
}

function decryptWith(key: Uint8Array, ciphertext: string): string {
  const sep = ciphertext.indexOf(":");
  if (sep === -1) throw new Error("Malformed ciphertext");
  const nonce = hexToBytes(ciphertext.slice(0, sep));
  const ct = hexToBytes(ciphertext.slice(sep + 1));
  const pt = gcm(key, nonce).decrypt(ct);
  return bytesToUtf8(pt);
}

export async function encryptItem(key: string, value: string): Promise<void> {
  const aesKey = await getKey();
  const encrypted = encryptWith(aesKey, value);
  await SecureStore.setItemAsync(`${VAULT_PREFIX}${key}`, encrypted);
}

export async function decryptItem(key: string): Promise<string | null> {
  const encrypted = await SecureStore.getItemAsync(`${VAULT_PREFIX}${key}`);
  if (!encrypted) return null;
  const aesKey = await getKey();
  return decryptWith(aesKey, encrypted);
}

// Encrypt/decrypt an arbitrary string with the SECRET vault key. Used both for
// the at-rest store persistence and for artifacts that LEAVE the device (e.g. the
// encrypted export). Genuine authenticated ciphertext, not base64 plaintext.
export async function encryptString(plaintext: string): Promise<string> {
  const aesKey = await getKey();
  return encryptWith(aesKey, plaintext);
}

export async function decryptString(ciphertext: string): Promise<string> {
  const aesKey = await getKey();
  return decryptWith(aesKey, ciphertext);
}

export async function removeItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(`${VAULT_PREFIX}${key}`);
}

export async function vaultExists(key: string): Promise<boolean> {
  const val = await SecureStore.getItemAsync(`${VAULT_PREFIX}${key}`);
  return val !== null;
}
