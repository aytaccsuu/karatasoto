/**
 * sessionStorage tabanlı TTL cache yardımcısı.
 * SSR/private-mode ortamlarında try/catch ile sessizce başarısız olur.
 */
const TTL_MS = 5 * 60 * 1000; // 5 dakika

export function getCached<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    const ts  = Number(sessionStorage.getItem(`${key}__ts`) || 0);
    if (raw && Date.now() - ts < TTL_MS) return JSON.parse(raw) as T;
  } catch { /* SSR veya private mode */ }
  return null;
}

export function setCached(key: string, data: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
    sessionStorage.setItem(`${key}__ts`, String(Date.now()));
  } catch { /* ignore */ }
}

export function invalidateCache(...keys: string[]): void {
  try {
    for (const k of keys) {
      sessionStorage.removeItem(k);
      sessionStorage.removeItem(`${k}__ts`);
    }
  } catch { /* ignore */ }
}
