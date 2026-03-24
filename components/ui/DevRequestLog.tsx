import React, { useState, useEffect, useCallback } from 'react';
import { requestLogger } from '../../services/requestLogger';
import type { RequestLogEntry } from '../../services/requestLogger';

// ── Helpers visuales ──────────────────────────────────────────────────────────

const METHOD_COLOR: Record<string, string> = {
    GET:    'bg-blue-100  text-blue-800',
    POST:   'bg-green-100 text-green-800',
    PATCH:  'bg-amber-100 text-amber-800',
    DELETE: 'bg-red-100   text-red-800',
};

const statusColor = (status?: number): string => {
    if (!status)        return 'text-slate-400';
    if (status < 300)   return 'text-green-600';
    if (status < 400)   return 'text-amber-600';
    return 'text-red-600';
};

const formatTime = (iso: string): string => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}.${String(d.getMilliseconds()).padStart(3,'0')}`;
};

// Trunca la URL para mostrarla compacta, manteniendo solo path+query
const shortUrl = (url: string): string => {
    try {
        const u = new URL(url);
        return `${u.pathname}${u.search}`;
    } catch {
        return url;
    }
};

// ── Componente ────────────────────────────────────────────────────────────────

const DevRequestLog: React.FC = () => {
    const [entries, setEntries]   = useState<RequestLogEntry[]>(() => requestLogger.getAll());
    const [isOpen, setIsOpen]     = useState(false);
    const [filter, setFilter]     = useState('');
    const [expanded, setExpanded] = useState<number | null>(null);

    // Suscribirse a cambios del logger
    useEffect(() => {
        return requestLogger.subscribe(() => setEntries([...requestLogger.getAll()]));
    }, []);

    const filtered = filter.trim()
        ? entries.filter(e =>
            e.url.toLowerCase().includes(filter.toLowerCase()) ||
            e.method.toLowerCase().includes(filter.toLowerCase())
          )
        : entries;

    const handleClear = useCallback(() => {
        requestLogger.clear();
        setExpanded(null);
    }, []);

    const toggleRow = (id: number) =>
        setExpanded(prev => prev === id ? null : id);

    return (
        <>
            {/* ── Botón flotante ── */}
            <button
                onClick={() => setIsOpen(o => !o)}
                title="Dev Request Log"
                className="fixed bottom-4 right-4 z-[9999] flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-900 text-white text-xs font-mono shadow-lg hover:bg-slate-700 transition-colors"
            >
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                API log
                {entries.length > 0 && (
                    <span className="ml-1 bg-indigo-500 text-white rounded-full px-1.5 py-0.5 text-[10px] leading-none">
                        {entries.length}
                    </span>
                )}
            </button>

            {/* ── Panel ── */}
            {isOpen && (
                <div className="fixed bottom-14 right-4 z-[9998] w-[680px] max-w-[calc(100vw-2rem)] max-h-[70vh] flex flex-col rounded-xl border border-slate-700 bg-slate-950 text-white shadow-2xl overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700 shrink-0">
                        <span className="text-xs font-bold text-slate-200 tracking-wider uppercase">
                            🛠 Dev · Request Log
                        </span>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                                placeholder="Filtrar URL / método…"
                                className="text-xs px-2 py-1 rounded bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-500 w-44 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                                onClick={handleClear}
                                className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-red-700 border border-slate-600 transition-colors"
                            >
                                Limpiar
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-white text-base leading-none px-1"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Tabla */}
                    <div className="overflow-y-auto flex-1 text-xs font-mono">
                        {filtered.length === 0 ? (
                            <p className="text-slate-500 text-center py-10">Sin registros.</p>
                        ) : (
                            <table className="w-full border-collapse">
                                <thead className="sticky top-0 bg-slate-900">
                                    <tr className="text-slate-500 text-[10px] uppercase tracking-wider">
                                        <th className="px-3 py-2 text-left w-24">Hora</th>
                                        <th className="px-2 py-2 text-left w-16">Método</th>
                                        <th className="px-2 py-2 text-left">URL</th>
                                        <th className="px-2 py-2 text-center w-16">Status</th>
                                        <th className="px-2 py-2 text-right w-16">ms</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(entry => (
                                        <React.Fragment key={entry.id}>
                                            <tr
                                                onClick={() => toggleRow(entry.id)}
                                                className={`border-t border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors ${entry.error ? 'bg-red-950/40' : ''}`}
                                            >
                                                <td className="px-3 py-1.5 text-slate-500 whitespace-nowrap">
                                                    {formatTime(entry.timestamp)}
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${METHOD_COLOR[entry.method] ?? 'bg-slate-700 text-slate-200'}`}>
                                                        {entry.method}
                                                    </span>
                                                </td>
                                                <td className="px-2 py-1.5 text-slate-300 truncate max-w-[280px]" title={entry.url}>
                                                    {shortUrl(entry.url)}
                                                </td>
                                                <td className={`px-2 py-1.5 text-center font-bold ${statusColor(entry.status)}`}>
                                                    {entry.status ?? (entry.error ? 'ERR' : '…')}
                                                </td>
                                                <td className="px-2 py-1.5 text-right text-slate-400">
                                                    {entry.durationMs != null ? `${entry.durationMs}` : '—'}
                                                </td>
                                            </tr>

                                            {/* Fila expandida con detalle */}
                                            {expanded === entry.id && (
                                                <tr className="bg-slate-900 border-t border-slate-700">
                                                    <td colSpan={5} className="px-4 py-3 text-slate-400 break-all">
                                                        <div className="space-y-1">
                                                            <div><span className="text-slate-500">URL completa: </span><span className="text-slate-200">{entry.url}</span></div>
                                                            <div><span className="text-slate-500">Status: </span><span className={statusColor(entry.status)}>{entry.status} {entry.statusText}</span></div>
                                                            <div><span className="text-slate-500">Duración: </span>{entry.durationMs != null ? `${entry.durationMs} ms` : '—'}</div>
                                                            {entry.error && (
                                                                <div className="mt-1 text-red-400 bg-red-950/50 rounded p-2 whitespace-pre-wrap">
                                                                    {entry.error}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-1.5 bg-slate-900 border-t border-slate-700 text-[10px] text-slate-500 shrink-0">
                        {filtered.length} de {entries.length} entradas · solo visible en desarrollo
                    </div>
                </div>
            )}
        </>
    );
};

export default DevRequestLog;

