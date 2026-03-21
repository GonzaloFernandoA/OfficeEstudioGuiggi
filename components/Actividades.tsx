import React, { useState, useEffect } from 'react';
import { getTareas, cambiarEstadoTarea } from '../services/tareasService';
import type { Tarea } from '../services/tareasService';
import CambiarEstadoModal from './ui/CambiarEstadoModal';
import type { CambiarEstadoData } from './ui/CambiarEstadoModal';

const formatDate = (iso: string): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = d.getUTCFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

const Actividades: React.FC = () => {
    const [tareas, setTareas] = useState<Tarea[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalData, setModalData] = useState<CambiarEstadoData | null>(null);
    const [selectedDni, setSelectedDni] = useState<string>('');

    useEffect(() => {
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
        cargarTareas();
    }, []);

    const handleOpenDetalles = (tarea: Tarea) => {
        setSelectedDni(tarea.dni);
        setModalData({
            taskId:           tarea.taskId,
            codigoDisplay:    tarea.codigo || tarea.code,
            estadoActual:     tarea.status,
            comentarioActual: tarea.comments ?? '',
        });
    };

    const handleGuardar = async (nuevoEstado: string, comentario: string) => {
        if (!modalData) return;

        const result = await cambiarEstadoTarea(modalData.taskId, comentario, nuevoEstado);
        if (!result.success) {
            throw new Error(result.error ?? 'Error al actualizar la tarea');
        }

        // Actualizar estado local tras confirmar éxito en la API
        setTareas(prev =>
            prev.map(t =>
                t.dni === selectedDni && (t.codigo || t.code) === modalData.codigoDisplay
                    ? { ...t, status: nuevoEstado, comments: comentario }
                    : t
            )
        );
    };

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
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Apellido
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Nombre
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Código
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Fecha Inicio
                                </th>
                                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Detalles
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {tareas.map((tarea, idx) => (
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
                                            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
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
