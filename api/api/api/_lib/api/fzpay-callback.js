import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const encode = (value) => encodeURIComponent(String(value))
  .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

export function signFields(fields, secret) {
  const canonical = Object.keys(fields)
    .filter((key) => key !== 'sign' && fields[key] !== undefined && fields[key] !== null)
    .sort()
    .map((key) => `${encode(key)}=${encode(typeof fields[key] === 'boolean' ? (fields[key] ? '1' : '0') : fields[key])}`)
    .join('&');
  return createHmac('sha256', secret).update(canonical).digest('hex');
}

export function verifySignature(fields, secret) {
  if (!fields || typeof fields.sign !== 'string') return false;
  const expected = signFields(fields, secret);
  const actual = fields.sign.toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(actual)) return false;
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(actual, 'hex'));
}

export function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server environment variable: ${name}`);
  return value;
}

export function makeOrderNo() {
  // Timestamp plus cryptographically random suffix; safe for gateway order references.
  return `SL${Date.now()}${randomBytes(6).toString('hex').toUpperCase()}`;
}
