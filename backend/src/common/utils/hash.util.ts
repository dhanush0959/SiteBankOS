import { createHash } from 'crypto';

export function hashString(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function hashIp(ip: string): string {
  // One-way hash — privacy-safe
  return createHash('sha256').update(ip + (process.env['IP_HASH_SALT'] ?? 'sitebank')).digest('hex').substring(0, 16);
}
