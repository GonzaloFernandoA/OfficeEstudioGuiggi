import React, { useState, useEffect, useMemo } from 'react';
import { getTareas, cambiarEstadoTarea } from '../services/tareasService';
import type { Tarea } from '../services/tareasService';
import CambiarEstadoModal from './ui/CambiarEstadoModal';
import type { CambiarEstadoData } from './ui/CambiarEstadoModal';

type SortKey = 'apellido' | 'nombre' | 'codigo' | 'fecha_inicio' | 'vencimiento';
type SortDir = 'asc' | 'desc';

const formatDate = (iso: string): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = d.getUTCFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

/**
 * Suma `days` días hábiles (lun–vie) a `start` y devuelve la fecha resultante.
 */
const addWorkingDays = (start: Date, days: number): Date => {
    const result = new Date(start);
    let added = 0;
    while (added < days) {
        result.setDate(result.getDate() + 1);
        const dow = result.getDay(); // 0=Dom, 6=Sáb
        if (dow !== 0 && dow !== 6) added++;
    }
    return result;
};

/**
 * Devuelve true si fecha_inicio + duracion días hábiles < hoy.
 */
const esTareaVencida = (fecha_inicio: string, duracion?: number): boolean => {
    if (!fecha_inicio || !duracion || duracion <= 0) return false;
    const inicio = new Date(fecha_inicio);
    if (isNaN(inicio.getTime())) return false;
    const vencimiento = addWorkingDays(inicio, duracion);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    vencimiento.setHours(0, 0, 0, 0);
    return vencimiento < hoy;
};

/**
 * Devuelve true si fecha_inicio + duracion días hábiles == hoy.
 */
const esTareaVenceHoy = (fecha_inicio: string, duracion?: number): boolean => {
    if (!fecha_inicio || !duracion || duracion <= 0) return false;
    const inicio = new Date(fecha_inicio);
    if (isNaN(inicio.getTime())) return false;
    const vencimiento = addWorkingDays(inicio, duracion);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    vencimiento.setHours(0, 0, 0, 0);
    return vencimiento.getTime() === hoy.getTime();
};

/**
 * Devuelve el timestamp (ms) de fecha_inicio + duracion días hábiles.
 * Si no hay fecha válida devuelve MAX para que quede al final.
 */
const calcVencimientoTs = (fecha_inicio: string, duracion?: number): number => {
    if (!fecha_inicio) return Number.MAX_SAFE_INTEGER;
    const inicio = new Date(fecha_inicio);
    if (isNaN(inicio.getTime())) return Number.MAX_SAFE_INTEGER;
    const dias = duracion && duracion > 0 ? duracion : 0;
    const venc = dias > 0 ? addWorkingDays(inicio, dias) : inicio;
    venc.setHours(0, 0, 0, 0);
    return venc.getTime();
};

// Icono de ordenamiento
const SortIcon: React.FC<{ col: SortKey; sortKey: SortKey; sortDir: SortDir }> = ({ col, sortKey, sortDir }) => {
    if (col !== sortKey) return <span className="ml-1 text-slate-300">↕</span>;
    return <span className="ml-1 text-indigo-500">{sortDir === 'asc' ? '↑' : '↓'}</span>;
};

const Actividades: React.FC = () => {
    const [tareas, setTareas]       = useState<Tarea[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError]         = useState<string | null>(null);
    const [modalData, setModalData] = useState<CambiarEstadoData | null>(null);
    const [selectedDni, setSelectedDni] = useState<string>('');
    const [sortKey, setSortKey]     = useState<SortKey>('vencimiento');
    const [sortDir, setSortDir]     = useState<SortDir>('asc');

    const cargarTareas = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getTareas('EN_CURSO');
            setTareas(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar las tareas');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        cargarTareas();
    }, []);

    const handleSort = (col: SortKey) => {
        if (col === sortKey) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(col);
            setSortDir('asc');
        }
    };

    const tareasSorted = useMemo(() => {
        return [...tareas].sort((a, b) => {
            let cmp = 0;
            if (sortKey === 'vencimiento') {
                cmp = calcVencimientoTs(a.fecha_inicio, a.duracion) - calcVencimientoTs(b.fecha_inicio, b.duracion);
            } else if (sortKey === 'fecha_inicio') {
                const va = a.fecha_inicio ?? '';
                const vb = b.fecha_inicio ?? '';
                cmp = va < vb ? -1 : va > vb ? 1 : 0;
            } else {
                const va = (a[sortKey] ?? '').toLowerCase();
                const vb = (b[sortKey] ?? '').toLowerCase();
                cmp = va < vb ? -1 : va > vb ? 1 : 0;
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [tareas, sortKey, sortDir]);

    const handleOpenDetalles = (tarea: Tarea) => {
        setSelectedDni(tarea.dni);
        setModalData({
            taskId:           tarea.taskId,
            codigoDisplay:    tarea.codigo || tarea.code || '',
            estadoActual:     tarea.estado ?? tarea.status ?? '',
            comentarioActual: tarea.comments ?? '',
            duracion:         tarea.duracion ?? 0,
        });
    };

    const handleGuardar = async (nuevoEstado: string, comentario: string, duracion: number) => {
        if (!modalData) return;
        const result = await cambiarEstadoTarea(modalData.taskId, comentario, nuevoEstado, duracion);
        if (!result.success) {
            throw new Error(result.error ?? 'Error al actualizar la tarea');
        }
        // Refrescar el listado desde la API para reflejar el nuevo estado
        await cargarTareas();
    };

    // Clases del th clicable
    const thClass = 'px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 transition-colors';

    return (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Actividades En Curso</h2>

            {isLoading && (
                <div className="flex justify-center items-center py-12">
                    <p className="text-slate-500">Cargando tareas...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {!isLoading && !error && tareas.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    No hay actividades en curso.
                </div>
            )}

            {!isLoading && !error && tareas.length > 0 && (
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className={thClass} onClick={() => handleSort('apellido')}>
                                    Apellido <SortIcon col="apellido" sortKey={sortKey} sortDir={sortDir} />
                                </th>
                                <th className={thClass} onClick={() => handleSort('nombre')}>
                                    Nombre <SortIcon col="nombre" sortKey={sortKey} sortDir={sortDir} />
                                </th>
                                <th className={thClass} onClick={() => handleSort('codigo')}>
                                    Código <SortIcon col="codigo" sortKey={sortKey} sortDir={sortDir} />
                                </th>
                                <th className={thClass} onClick={() => handleSort('vencimiento')}>
                                    Fecha Inicio / Venc. <SortIcon col="vencimiento" sortKey={sortKey} sortDir={sortDir} />
                                </th>
                                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Detalles
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {tareasSorted.map((tarea, idx) => (
                                <tr
                                    key={`${tarea.dni}-${tarea.codigo}-${idx}`}
                                    className="hover:bg-slate-50 transition-colors"
                                >
                                    <td className="px-5 py-3 text-sm font-medium text-slate-800">
                                        {tarea.apellido || '—'}
                                    </td>
                                    <td className="px-5 py-3 text-sm text-slate-700">
                                        {tarea.nombre || '—'}
                                    </td>
                                    <td className="px-5 py-3 text-sm font-mono text-indigo-700">
                                        {tarea.codigo || '—'}
                                    </td>
                                    <td className="px-5 py-3 text-sm text-slate-600">
                                        {formatDate(tarea.fecha_inicio)}
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <button
                                            onClick={() => handleOpenDetalles(tarea)}
                                            className={`px-3 py-1.5 text-xs font-semibold text-white rounded-md transition-colors ${
                                                esTareaVencida(tarea.fecha_inicio, tarea.duracion)
                                                    ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                                                    : esTareaVenceHoy(tarea.fecha_inicio, tarea.duracion)
                                                        ? 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                                            }`}
                                        >
                                            Detalles
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <CambiarEstadoModal
                data={modalData}
                onClose={() => setModalData(null)}
                onGuardar={handleGuardar}
            />
        </div>
    );
};

export default Actividades;
