import type { AuthTokens } from '@sitebank/types';

const ACCESS_TOKEN_KEY = 'sb_access_token';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return true;
    const payload = JSON.parse(atob(parts[1])) as { exp?: number };
    if (!payload.exp) return true;
    return Date.now() / 1000 > payload.exp - 30; // 30s buffer
  } catch {
    return true;
  }
}

export function handleAuthResponse(tokens: AuthTokens & { user: unknown }): void {
  setAccessToken(tokens.accessToken);
}
