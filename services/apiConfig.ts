// services/apiConfig.ts
// Configuración central de la API y helpers mínimos para llamadas REST

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://69juzxafdi.execute-api.us-east-2.amazonaws.com/prod';
export const baseUrl: string = API_BASE_URL;

export const timeoutMs: number = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 15000;

export const endpoints = {
  contactos: '/contactos',
} as const;

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  // Acepta `path` absoluto o relativo. Si es relativo, lo resuelve contra baseUrl.
  try {
    // Si path ya es una URL absoluta, URL constructor preserva esa URL.
    const url = new URL(path, baseUrl);
    if (params && Object.keys(params).length) {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => search.append(k, String(v)));
      url.search = search.toString();
    }
    return url.toString();
  } catch (err) {
    // Fallback simple
    let p = path;
    if (!p.startsWith('/')) p = '/' + p;
    return baseUrl.replace(/\/$/, '') + p;
  }
}

// Helper simple para POST JSON con timeout (usa fetch y AbortController)
export async function postJson<T = any, R = any>(path: string, body: T, customTimeoutMs?: number): Promise<R> {
  const controller = new AbortController();
  const to = customTimeoutMs ?? timeoutMs;
  const timer = setTimeout(() => controller.abort(), to);

  try {
    const res = await fetch(buildUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
    }

    // Intenta parsear JSON, si falla devuelve texto crudo
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) return await res.json();
    return (await res.text()) as unknown as R;
  } finally {
    clearTimeout(timer);
  }
}

