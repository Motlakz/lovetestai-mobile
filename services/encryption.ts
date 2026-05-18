import * as Crypto from 'expo-crypto';

// Simple symmetric E2EE for partner sync.
// Key is derived deterministically from a shared secret (pairId + invite codes)
// that both partners already possess locally, so Firestore never sees plaintext.
// Format: base64(iv[16] || ciphertext || mac[16])
// Keystream: SHA-256(key || iv || counter32) — CTR-style.
// MAC: first 16 bytes of SHA-256("mac" || key || iv || ciphertext).

const IV_LEN = 16;
const MAC_LEN = 16;
const BLOCK_LEN = 32;
const PREFIX = 'v1:';

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, '0');
  }
  return s;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  if (typeof btoa !== 'undefined') return btoa(bin);
  // RN polyfill via global
  return (globalThis as any).btoa ? (globalThis as any).btoa(bin) : Buffer.from(bytes).toString('base64');
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = typeof atob !== 'undefined'
    ? atob(b64)
    : (globalThis as any).atob
      ? (globalThis as any).atob(b64)
      : Buffer.from(b64, 'base64').toString('binary');
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function utf8Encode(text: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(text);
  const out: number[] = [];
  for (let i = 0; i < text.length; i++) {
    let c = text.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else {
      out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
  }
  return new Uint8Array(out);
}

function utf8Decode(bytes: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') return new TextDecoder().decode(bytes);
  let s = '';
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i++];
    if (b < 0x80) s += String.fromCharCode(b);
    else if (b < 0xe0) s += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i++] & 0x3f));
    else s += String.fromCharCode(((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f));
  }
  return s;
}

// Hash raw bytes by hex-encoding them first; we still get deterministic output.
async function sha256Hex(hexInput: string): Promise<Uint8Array> {
  const digestHex = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    hexInput,
    { encoding: Crypto.CryptoEncoding.HEX },
  );
  return hexToBytes(digestHex);
}

export async function deriveKey(...parts: (string | null | undefined)[]): Promise<Uint8Array> {
  const seed = parts.filter(Boolean).join('|');
  const hex = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `lovetest-e2ee-v1|${seed}`,
    { encoding: Crypto.CryptoEncoding.HEX },
  );
  return hexToBytes(hex);
}

async function keystream(key: Uint8Array, iv: Uint8Array, length: number): Promise<Uint8Array> {
  const out = new Uint8Array(length);
  let counter = 0;
  let offset = 0;
  const keyHex = bytesToHex(key);
  const ivHex = bytesToHex(iv);
  while (offset < length) {
    const ctrHex = counter.toString(16).padStart(8, '0');
    const block = await sha256Hex(`${keyHex}${ivHex}${ctrHex}`);
    const take = Math.min(BLOCK_LEN, length - offset);
    for (let i = 0; i < take; i++) out[offset + i] = block[i];
    offset += take;
    counter++;
  }
  return out;
}

async function macFor(key: Uint8Array, iv: Uint8Array, ct: Uint8Array): Promise<Uint8Array> {
  const full = await sha256Hex(`mac|${bytesToHex(key)}|${bytesToHex(iv)}|${bytesToHex(ct)}`);
  return full.slice(0, MAC_LEN);
}

export async function encryptText(plaintext: string, key: Uint8Array): Promise<string> {
  const iv = await Crypto.getRandomBytesAsync(IV_LEN);
  const pt = utf8Encode(plaintext);
  const ks = await keystream(key, iv, pt.length);
  const ct = new Uint8Array(pt.length);
  for (let i = 0; i < pt.length; i++) ct[i] = pt[i] ^ ks[i];
  const mac = await macFor(key, iv, ct);
  const out = new Uint8Array(iv.length + ct.length + mac.length);
  out.set(iv, 0);
  out.set(ct, iv.length);
  out.set(mac, iv.length + ct.length);
  return PREFIX + bytesToBase64(out);
}

export async function decryptText(payload: string, key: Uint8Array): Promise<string | null> {
  if (!payload.startsWith(PREFIX)) return null;
  try {
    const buf = base64ToBytes(payload.slice(PREFIX.length));
    if (buf.length < IV_LEN + MAC_LEN) return null;
    const iv = buf.slice(0, IV_LEN);
    const ct = buf.slice(IV_LEN, buf.length - MAC_LEN);
    const tag = buf.slice(buf.length - MAC_LEN);
    const expected = await macFor(key, iv, ct);
    let diff = 0;
    for (let i = 0; i < MAC_LEN; i++) diff |= tag[i] ^ expected[i];
    if (diff !== 0) return null;
    const ks = await keystream(key, iv, ct.length);
    const pt = new Uint8Array(ct.length);
    for (let i = 0; i < ct.length; i++) pt[i] = ct[i] ^ ks[i];
    return utf8Decode(pt);
  } catch {
    return null;
  }
}

export function isEncrypted(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

// Helper for partner sync: derives the per-pair key from local PartnerLink fields.
export async function derivePairKey(pairId: string, inviteCode?: string | null, partnerCode?: string | null): Promise<Uint8Array> {
  const codes = [inviteCode ?? '', partnerCode ?? ''].sort().join(':');
  return deriveKey(pairId, codes);
}
