/**
 * requestLogger — Log en memoria de todas las llamadas HTTP del apiClient.
 * SOLO activo en modo desarrollo (import.meta.env.DEV).
 * En producción todas las funciones son no-ops de coste cero.
 */

const IS_DEV = import.meta.env.DEV;
const MAX_ENTRIES = 200;

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface RequestLogEntry {
    id: number;
    method: HttpMethod;
    url: string;
    status?: number;
    statusText?: string;
    durationMs?: number;
    timestamp: string;      // ISO-8601
    error?: string;
}

// ── Estado interno del módulo ─────────────────────────────────────────────────
let entries: RequestLogEntry[] = [];
let counter = 0;
type Listener = () => void;
let listeners: Listener[] = [];

const notify = () => listeners.forEach(fn => fn());

// ── API pública ───────────────────────────────────────────────────────────────
export const requestLogger = {
    /**
     * Registra el inicio de una llamada. Devuelve el id asignado.
     * El id se usa luego en `update` para completar status/duración.
     */
    begin(method: HttpMethod, url: string): number {
        if (!IS_DEV) return -1;
        const id = ++counter;
        entries = [
            { id, method, url, timestamp: new Date().toISOString() },
            ...entries,
        ].slice(0, MAX_ENTRIES);
        notify();
        return id;
    },

    /** Completa una entrada con el resultado (status, duración, error). */
    complete(id: number, patch: Partial<Omit<RequestLogEntry, 'id' | 'method' | 'url' | 'timestamp'>>): void {
        if (!IS_DEV || id === -1) return;
        entries = entries.map(e => e.id === id ? { ...e, ...patch } : e);
        notify();
    },

    getAll(): RequestLogEntry[] {
        return entries;
    },

    clear(): void {
        entries = [];
        notify();
    },

    /** Suscribirse a cambios. Devuelve función de unsuscribe. */
    subscribe(fn: Listener): () => void {
        if (!IS_DEV) return () => {};
        listeners = [...listeners, fn];
        return () => { listeners = listeners.filter(l => l !== fn); };
    },
};

