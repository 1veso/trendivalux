// Input validation primitives. Keep these strict and conservative —
// any time we accept user input we should reject anything that doesn't
// match an expected shape rather than try to sanitize it.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
// Reject angle brackets and common control whitespace to defang basic
// HTML/header injection attempts. Spaces are allowed.
const FORBIDDEN_CHARS = /[<>\n\r\t]/;

export function validateString(val: unknown, maxLength: number): string | null {
  if (typeof val !== 'string') return null;
  if (val.length === 0 || val.length > maxLength) return null;
  if (FORBIDDEN_CHARS.test(val)) return null;
  return val.trim();
}

export function validateEmail(val: unknown): string | null {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return null;
  if (!EMAIL_RE.test(trimmed)) return null;
  return trimmed.toLowerCase();
}

export function validateUuid(val: unknown): string | null {
  if (typeof val !== 'string') return null;
  if (!UUID_RE.test(val)) return null;
  return val.toLowerCase();
}

export function validateBoolean(val: unknown): boolean | null {
  if (typeof val !== 'boolean') return null;
  return val;
}

export function validateEnum<T extends string>(val: unknown, allowed: readonly T[]): T | null {
  if (typeof val !== 'string') return null;
  if (!allowed.includes(val as T)) return null;
  return val as T;
}

export function validatePlainObject(val: unknown): Record<string, unknown> | null {
  if (val === null || typeof val !== 'object') return null;
  if (Array.isArray(val)) return null;
  return val as Record<string, unknown>;
}
