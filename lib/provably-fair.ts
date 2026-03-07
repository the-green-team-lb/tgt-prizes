/**
 * Provably Fair System
 *
 * How it works:
 * 1. Before draw: generate a random server seed
 * 2. Compute SHA-256 hash of (seed + serialized numbers)
 * 3. Show hash publicly BEFORE the draw
 * 4. After draw: reveal the server seed
 * 5. Anyone can recompute the hash to verify no tampering
 */

export interface NumberEntry {
  number: number;
  color: string;
}

/**
 * Generate a cryptographically secure random seed
 */
export function generateServerSeed(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Serialize numbers deterministically for hashing.
 * Sorted by number, then by color for stable ordering of duplicates.
 */
export function serializeNumbers(numbers: NumberEntry[]): string {
  const sorted = [...numbers].sort((a, b) => a.number - b.number);
  return sorted.map((n) => `${n.number}-${n.color}`).join("|");
}

/**
 * Pure JS SHA-256 implementation (fallback when crypto.subtle unavailable).
 */
function sha256JS(message: string): string {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let H0 = 0x6a09e667,
    H1 = 0xbb67ae85,
    H2 = 0x3c6ef372,
    H3 = 0xa54ff53a,
    H4 = 0x510e527f,
    H5 = 0x9b05688c,
    H6 = 0x1f83d9ab,
    H7 = 0x5be0cd19;

  const bytes = new TextEncoder().encode(message);
  const bitLen = bytes.length * 8;
  const padLen = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(padLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padLen - 8, 0, false);
  dv.setUint32(padLen - 4, bitLen, false);

  const rotr = (x: number, n: number) => ((x >>> n) | (x << (32 - n))) >>> 0;

  for (let off = 0; off < padLen; off += 64) {
    const W = new Uint32Array(64);
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(off + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
      const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }

    let a = H0, b = H1, c = H2, d = H3, e = H4, f = H5, g = H6, h = H7;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const t1 = (h + S1 + ch + K[i] + W[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }

    H0 = (H0 + a) >>> 0; H1 = (H1 + b) >>> 0;
    H2 = (H2 + c) >>> 0; H3 = (H3 + d) >>> 0;
    H4 = (H4 + e) >>> 0; H5 = (H5 + f) >>> 0;
    H6 = (H6 + g) >>> 0; H7 = (H7 + h) >>> 0;
  }

  return [H0, H1, H2, H3, H4, H5, H6, H7]
    .map((v) => v.toString(16).padStart(8, "0"))
    .join("");
}

/**
 * Compute SHA-256 hash of server seed + serialized numbers.
 * Uses Web Crypto API with pure JS fallback.
 */
export async function computeHash(
  serverSeed: string,
  numbers: NumberEntry[]
): Promise<string> {
  const data = serverSeed + ":" + serializeNumbers(numbers);

  // Try Web Crypto API first
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const encoder = new TextEncoder();
      const buffer = await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(data)
      );
      const hashArray = Array.from(new Uint8Array(buffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch {
    // Fall through to JS implementation
  }

  // Pure JS fallback
  return sha256JS(data);
}

/**
 * Verify that a hash matches the given seed and numbers.
 */
export async function verifyHash(
  serverSeed: string,
  numbers: NumberEntry[],
  expectedHash: string
): Promise<boolean> {
  const computed = await computeHash(serverSeed, numbers);
  return computed === expectedHash;
}
