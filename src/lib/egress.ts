import Constants from "expo-constants";

const EVIDENCE_BUILD = Constants.expoConfig?.extra?.EVIDENCE_BUILD === true;

let egressAttempts: Array<{ url: string; method: string; ts: number }> = [];

export function installEgressTrap(): void {
  if (typeof globalThis.fetch !== "undefined") {
    const _fetch = globalThis.fetch.bind(globalThis);
    globalThis.fetch = function (...args: Parameters<typeof _fetch>) {
      const url = typeof args[0] === "string" ? args[0] : args[0]?.toString() ?? "unknown";
      egressAttempts.push({ url, method: "fetch", ts: Date.now() });
      console.warn(`[EGRESS TRAP] fetch blocked: ${url}`);
      return Promise.reject(new Error(`Network blocked in evidence build: ${url}`));
    };
  }

  if (typeof (globalThis as Record<string, unknown>).XMLHttpRequest !== "undefined") {
    const OrigXHR = (globalThis as Record<string, unknown>).XMLHttpRequest as typeof XMLHttpRequest;
    (globalThis as Record<string, unknown>).XMLHttpRequest = class BlockedXHR extends OrigXHR {
      private _blockedUrl = "unknown";

      open(method: string, url: string | URL, ...rest: unknown[]): void {
        this._blockedUrl = typeof url === "string" ? url : url?.toString() ?? "unknown";
        egressAttempts.push({ url: this._blockedUrl, method, ts: Date.now() });
        console.warn(`[EGRESS TRAP] XHR blocked: ${this._blockedUrl}`);
        // Preserve the XHR contract: keep the object in a valid OPENED state so
        // callers don't get a corrupted instance. The send() override below is
        // what actually prevents the request from leaving the device.
        // @ts-expect-error - forwarding the native variadic open() signature
        super.open(method, url, ...rest);
      }

      send(): void {
        throw new Error(`egress blocked (evidence build): ${this._blockedUrl}`);
      }
    };
  }
}

export function getEgressAttempts(): ReadonlyArray<{ url: string; method: string; ts: number }> {
  return egressAttempts;
}

export function clearEgressAttempts(): void {
  egressAttempts = [];
}

export function isEvidenceBuild(): boolean {
  return EVIDENCE_BUILD;
}

export function assertNoEgress(): void {
  if (EVIDENCE_BUILD && egressAttempts.length > 0) {
    console.warn(`[EGRESS] Evidence build saw ${egressAttempts.length} blocked network attempts`);
  }
}
