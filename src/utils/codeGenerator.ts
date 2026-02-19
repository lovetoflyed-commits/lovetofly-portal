import crypto from 'crypto';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DEFAULT_PREFIX = 'LTF';
const DEFAULT_GROUP_SIZE = 4;
const DEFAULT_GROUP_COUNT = 3;

interface GenerateCodeOptions {
  prefix?: string;
  groupSize?: number;
  groups?: number;
}

export interface GeneratedCode {
  code: string;
  normalized: string;
  hash: string;
  hint: string;
  mask: string;
}

function randomChar() {
  const idx = crypto.randomInt(0, CODE_ALPHABET.length);
  return CODE_ALPHABET[idx];
}

function buildRandomSegment(length: number) {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += randomChar();
  }
  return out;
}

export function normalizeCode(raw: string) {
  return raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export function hashCode(normalized: string) {
  const pepper = process.env.CODE_HASH_PEPPER || 'lovetofly-code-pepper';
  return crypto.createHash('sha256').update(`${pepper}:${normalized}`).digest('hex');
}

export function generateCode(options: GenerateCodeOptions = {}): GeneratedCode {
  const prefix = (options.prefix || DEFAULT_PREFIX).toUpperCase();
  const groupSize = options.groupSize || DEFAULT_GROUP_SIZE;
  const groups = options.groups || DEFAULT_GROUP_COUNT;

  const randomGroups = Array.from({ length: groups }, () => buildRandomSegment(groupSize));
  const code = [prefix, ...randomGroups].join('-');
  const normalized = normalizeCode(code);
  const hash = hashCode(normalized);
  const hint = normalized.slice(-groupSize);
  const mask = `${prefix}-${'X'.repeat(groupSize)}-${hint}`;

  return { code, normalized, hash, hint, mask };
}
