import Constants from "expo-constants";

const cfgExtra = (Constants.expoConfig as unknown as { extra?: Record<string, unknown> })?.extra;
const P2P_ENABLED = cfgExtra?.ENABLE_P2P === true;

let providerPublicKey: string | null = null;

export async function startP2PProvider(): Promise<{ publicKey: string }> {
  if (!P2P_ENABLED) throw new Error("P2P is disabled (ENABLE_P2P=false)");

  const { startQVACProvider } = await import("@qvac/sdk");
  const result = await startQVACProvider();
  providerPublicKey = result.publicKey ?? null;

  return { publicKey: result.publicKey! };
}

export async function connectP2PConsumer(
  providerPubKey: string,
  modelSrc: string
): Promise<void> {
  if (!P2P_ENABLED) throw new Error("P2P is disabled (ENABLE_P2P=false)");

  const { loadModel } = await import("@qvac/sdk");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (loadModel as any)({
    modelSrc,
    modelType: "llm",
    delegate: {
      providerPublicKey: providerPubKey,
      fallbackToLocal: true,
    },
  });
}

export function isP2PEnabled(): boolean {
  return P2P_ENABLED;
}

export function getProviderPublicKey(): string | null {
  return providerPublicKey;
}
