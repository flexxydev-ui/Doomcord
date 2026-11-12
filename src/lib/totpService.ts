import { NitroTier } from '../types';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Pure TypeScript / Web-compatible SHA-1 + HMAC-SHA1 implementation for RFC 6238 TOTP
 * Works identically in Node.js and all browsers without external dependencies.
 */
function sha1Bytes(message: Uint8Array): Uint8Array {
  const ml = message.length * 8;
  const withOne = new Uint8Array(message.length + 1);
  withOne.set(message);
  withOne[message.length] = 0x80;

  let padLen = (64 - ((withOne.length + 8) % 64)) % 64;
  const padded = new Uint8Array(withOne.length + padLen + 8);
  padded.set(withOne);

  const view = new DataView(padded.buffer);
  const highBits = Math.floor(ml / 0x100000000);
  const lowBits = ml >>> 0;
  view.setUint32(padded.length - 8, highBits, false);
  view.setUint32(padded.length - 4, lowBits, false);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  const w = new Uint32Array(80);

  for (let i = 0; i < padded.length; i += 64) {
    for (let j = 0; j < 16; j++) {
      w[j] = view.getUint32(i + j * 4, false);
    }
    for (let j = 16; j < 80; j++) {
      const n = w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16];
      w[j] = ((n << 1) | (n >>> 31)) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let j = 0; j < 80; j++) {
      let f = 0;
      let k = 0;
      if (j < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (j < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (j < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const temp = ((((a << 5) | (a >>> 27)) >>> 0) + (f >>> 0) + e + k + w[j]) >>> 0;
      e = d;
      d = c;
      c = ((b << 30) | (b >>> 2)) >>> 0;
      b = a;
      a = temp;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  const out = new Uint8Array(20);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, h0, false);
  outView.setUint32(4, h1, false);
  outView.setUint32(8, h2, false);
  outView.setUint32(12, h3, false);
  outView.setUint32(16, h4, false);
  return out;
}

function hmacSha1(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockSize = 64;
  let normalizedKey = key;
  if (normalizedKey.length > blockSize) {
    normalizedKey = sha1Bytes(normalizedKey);
  }
  const paddedKey = new Uint8Array(blockSize);
  paddedKey.set(normalizedKey);

  const oKeyPad = new Uint8Array(blockSize);
  const iKeyPad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = paddedKey[i] ^ 0x5c;
    iKeyPad[i] = paddedKey[i] ^ 0x36;
  }

  const innerInput = new Uint8Array(blockSize + message.length);
  innerInput.set(iKeyPad);
  innerInput.set(message, blockSize);
  const innerHash = sha1Bytes(innerInput);

  const outerInput = new Uint8Array(blockSize + innerHash.length);
  outerInput.set(oKeyPad);
  outerInput.set(innerHash, blockSize);
  return sha1Bytes(outerInput);
}

export function base32Decode(input: string): Uint8Array {
  const cleaned = input
    .toUpperCase()
    .replace(/=+$/, '')
    .replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

export function generateTotpSecret(length = 20): string {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += BASE32_ALPHABET[bytes[i] % 32];
  }
  return secret;
}

export function generateTotpCode(
  secret: string,
  timestampMs: number = Date.now(),
  stepSeconds = 30
): string {
  const keyBytes = base32Decode(secret);
  const counter = Math.floor(timestampMs / 1000 / stepSeconds);
  const counterBytes = new Uint8Array(8);
  const view = new DataView(counterBytes.buffer);
  view.setUint32(0, Math.floor(counter / 0x100000000), false);
  view.setUint32(4, counter >>> 0, false);

  const digest = hmacSha1(keyBytes, counterBytes);
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = binary % 1_000_000;
  return String(otp).padStart(6, '0');
}

export function verifyTotpCode(
  secret: string,
  candidateCode: string,
  timestampMs: number = Date.now(),
  windowSteps = 1
): boolean {
  const cleaned = String(candidateCode).trim().replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleaned)) return false;

  for (let w = -windowSteps; w <= windowSteps; w++) {
    const checkTime = timestampMs + w * 30_000;
    const expected = generateTotpCode(secret, checkTime);
    if (expected === cleaned) {
      return true;
    }
  }
  return false;
}

export function buildOtpAuthUri(accountEmail: string, secret: string, issuer = 'Doomcord'): string {
  const label = encodeURIComponent(`${issuer}:${accountEmail}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

export function generateBackupCodes(count = 8): string[] {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = new Uint8Array(8);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let j = 0; j < 8; j++) bytes[j] = Math.floor(Math.random() * 256);
    }
    let part1 = '';
    let part2 = '';
    for (let j = 0; j < 4; j++) {
      part1 += chars[bytes[j] % chars.length];
      part2 += chars[bytes[j + 4] % chars.length];
    }
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

// --- FILE UPLOAD SECURITY VALIDATION ---

const ALLOWED_MIME_PREFIXES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'application/pdf',
  'text/plain',
  'application/zip',
  'application/json',
];

const BLOCKED_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.msi',
  '.scr',
  '.vbs',
  '.js',
  '.ps1',
  '.dll',
];

export function sanitizeFileName(rawName: string): string {
  const base = rawName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_');
  return base.slice(0, 80) || 'attachment_file';
}

export function getMaxUploadLimitMB(
  tier: NitroTier,
  isOwner = false,
  serverBoostLevel = 0
): number {
  const userBase = isOwner || tier === 'nitro' ? 500 : tier === 'basic' ? 50 : 25;
  const serverBase =
    serverBoostLevel >= 3 ? 500 : serverBoostLevel === 2 ? 150 : serverBoostLevel === 1 ? 50 : 25;
  return Math.max(userBase, serverBase);
}

export function validateFileUpload(
  file: { name: string; size: number; type: string },
  tier: NitroTier,
  isOwner = false,
  serverBoostLevel = 0
): { valid: boolean; error?: string; sanitizedName: string; maxLimitMB: number } {
  const sanitizedName = sanitizeFileName(file.name);
  const lowerName = file.name.toLowerCase();
  const maxLimitMB = getMaxUploadLimitMB(tier, isOwner, serverBoostLevel);
  const maxBytes = maxLimitMB * 1024 * 1024;

  for (const ext of BLOCKED_EXTENSIONS) {
    if (lowerName.endsWith(ext)) {
      return {
        valid: false,
        error: `Security block: Executable file extension (${ext}) is not permitted on Doomcord.`,
        sanitizedName,
        maxLimitMB,
      };
    }
  }

  if (file.size <= 0) {
    return {
      valid: false,
      error: 'Cannot upload an empty (0-byte) file.',
      sanitizedName,
      maxLimitMB,
    };
  }

  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File exceeds your ${maxLimitMB}MB upload limit. Upgrade to DOOMCORD APEX+ for 500MB uploads.`,
      sanitizedName,
      maxLimitMB,
    };
  }

  const normalizedMime = (file.type || '').toLowerCase();
  const mimeAllowed =
    !normalizedMime ||
    ALLOWED_MIME_PREFIXES.some((prefix) => normalizedMime.startsWith(prefix));

  if (!mimeAllowed) {
    return {
      valid: false,
      error: `Unsupported file type (${file.type}). Allowed: images, MP4/WebM video, audio, PDF, TXT, JSON, ZIP.`,
      sanitizedName,
      maxLimitMB,
    };
  }

  return {
    valid: true,
    sanitizedName,
    maxLimitMB,
  };
}

// --- AUTOMOD & COMMUNITY SAFETY ENGINE ---

export interface AutoModEvaluation {
  allowed: boolean;
  reason?: string;
  ruleTriggered?: 'keyword' | 'invite_link' | 'mention_spam' | 'caps_spam';
}

export interface AutoModRuleConfig {
  enabled: boolean;
  blockInviteLinks: boolean;
  blockExcessiveCaps: boolean;
  maxMentionsPerMessage: number;
  blockedKeywords: string[];
}

export const DEFAULT_AUTOMOD_CONFIG: AutoModRuleConfig = {
  enabled: true,
  blockInviteLinks: false,
  blockExcessiveCaps: false,
  maxMentionsPerMessage: 5,
  blockedKeywords: ['free nitro scam', 'phishing-link', 'malware-drop'],
};

export function evaluateAutoModMessage(
  content: string,
  config?: AutoModRuleConfig,
  isBypassAdmin = false
): AutoModEvaluation {
  if (isBypassAdmin || !config || !config.enabled) {
    return { allowed: true };
  }

  const lower = content.toLowerCase();

  // 1. Blocked Keywords check
  for (const kw of config.blockedKeywords || []) {
    const trimmed = kw.trim().toLowerCase();
    if (trimmed && lower.includes(trimmed)) {
      return {
        allowed: false,
        reason: `AutoMod blocked this message because it contains a restricted keyword ("${kw}").`,
        ruleTriggered: 'keyword',
      };
    }
  }

  // 2. Unauthorized Invite Links check
  if (config.blockInviteLinks) {
    if (
      lower.includes('discord.gg/') ||
      lower.includes('doomcord.com/?invite=') ||
      /\?invite=comm_/i.test(content)
    ) {
      return {
        allowed: false,
        reason: 'AutoMod blocked this message: External server invite links are disabled in this community.',
        ruleTriggered: 'invite_link',
      };
    }
  }

  // 3. Mention Spam check
  const maxMentions = config.maxMentionsPerMessage || 5;
  const mentions = content.match(/@[a-zA-Z0-9_.-]+/g) || [];
  if (mentions.length > maxMentions) {
    return {
      allowed: false,
      reason: `AutoMod blocked this message: Exceeded maximum allowed mentions (${maxMentions}) per message.`,
      ruleTriggered: 'mention_spam',
    };
  }

  // 4. Excessive Caps Spam check
  if (config.blockExcessiveCaps && content.length >= 20) {
    const letters = content.replace(/[^a-zA-Z]/g, '');
    const upper = content.replace(/[^A-Z]/g, '');
    if (letters.length >= 12 && upper.length / letters.length > 0.8) {
      return {
        allowed: false,
        reason: 'AutoMod blocked this message: Excessive ALL-CAPS formatting detected.',
        ruleTriggered: 'caps_spam',
      };
    }
  }

  return { allowed: true };
}
