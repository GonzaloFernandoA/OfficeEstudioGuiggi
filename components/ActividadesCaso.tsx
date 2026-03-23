import React, { useState, useEffect } from 'react';
import { getTareasFlow, cambiarEstadoTarea } from '../services/tareasService';
import type { TareasFlowResponse, TareaFlow } from '../services/tareasService';
import CambiarEstadoModal from './ui/CambiarEstadoModal';
import type { CambiarEstadoData } from './ui/CambiarEstadoModal';

interface ActividadesCasoProps {
    dni: string;
    nombreCompleto: string;
    onVolver: () => void;
}

const STATUS_BADGE: Record<string, string> = {
    COMPLETADO: 'bg-green-100 text-green-700',
    COMPLETADA: 'bg-green-100 text-green-700',
    EN_CURSO:   'bg-blue-100 text-blue-700',
    PENDIENTE:  'bg-amber-100 text-amber-700',
    CANCELADO:  'bg-red-100 text-red-700',
};

const formatDate = (iso: string): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const dd  = String(d.getUTCDate()).padStart(2, '0');
    const mm  = String(d.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = d.getUTCFullYear();
    const hh  = String(d.getUTCHours()).padStart(2, '0');
    const min = String(d.getUTCMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

const ActividadesCaso: React.FC<ActividadesCasoProps> = ({ dni, nombreCompleto, onVolver }) => {
    const [flujos, setFlujos] = useState<TareasFlowResponse>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError]   = useState<string | null>(null);

    // Estado para el modal de edición
    const [modalData, setModalData]               = useState<CambiarEstadoData | null>(null);
    const [editingFlujo, setEditingFlujo]         = useState<string>('');

    const cargar = async () => {
        setIsLoading(true);
        setError(null);
        try {
            console.log(`[ActividadesCaso] Cargando tareas para DNI: ${dni}`);
            const data = await getTareasFlow(dni);
            console.log('[ActividadesCaso] Datos recibidos:', data);
            setFlujos(data);
        } catch (err) {
            console.error('[ActividadesCaso] Error:', err);
            setError(err instanceof Error ? err.message : 'Error al cargar las actividades');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (dni) cargar();
    }, [dni]);

    const flujosEntries = Object.entries(flujos);
    const totalTareas   = flujosEntries.reduce((acc, [, tareas]) => acc + tareas.length, 0);

    const handleOpenEdit = (flujoNombre: string, tarea: TareaFlow) => {
        setEditingFlujo(flujoNombre);
        setModalData({
            taskId:           tarea.taskId,
            codigoDisplay:    tarea.codigo,
            estadoActual:     tarea.estado,
            comentarioActual: tarea.comentario ?? '',
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
        await cargar();
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        Tablero de Actividades — <span className="text-indigo-700">{nombreCompleto}</span>
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">DNI: {dni} · {totalTareas} tarea{totalTareas !== 1 ? 's' : ''}</p>
                </div>
                <button
                    onClick={onVolver}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50"
                >
                    ← Volver
                </button>
            </div>

            {isLoading && (
                <div className="flex justify-center items-center py-12">
                    <p className="text-slate-500">Cargando actividades...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {!isLoading && !error && flujosEntries.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    No hay actividades registradas para este caso.
                </div>
            )}

            {!isLoading && !error && flujosEntries.length > 0 && (
                <div className="space-y-8">
                    {flujosEntries.map(([flujoNombre, tareas]) => (
                        <div key={flujoNombre} className="rounded-lg border border-slate-200 overflow-hidden">
                            {/* Cabecera del flujo */}
                            <div className="bg-indigo-50 px-6 py-3 border-b border-indigo-100 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wider">
                                    Flujo: {flujoNombre}
                                </h3>
                                <span className="text-xs text-indigo-500">{(tareas as TareaFlow[]).length} pasos</span>
                            </div>

                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-12">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Código</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha Inicio</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha Fin</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {(tareas as TareaFlow[]).map((tarea) => (
                                        <tr key={tarea.taskId} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-slate-400 text-center">{tarea.orden}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-slate-800">
                                                {tarea.codigo.replace(/_/g, ' ')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[tarea.estado] ?? 'bg-slate-100 text-slate-700'}`}>
                                                    {tarea.estado.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{formatDate(tarea.fecha_inicio)}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{formatDate(tarea.fecha_fin ?? '')}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleOpenEdit(flujoNombre, tarea)}
                                                    disabled={tarea.estado === 'PENDIENTE'}
                                                    className={`px-3 py-1 text-xs font-medium border rounded transition-colors
                                                        ${tarea.estado === 'PENDIENTE'
                                                            ? 'text-slate-400 border-slate-200 bg-slate-50 cursor-not-allowed opacity-50'
                                                            : 'text-indigo-600 border-indigo-300 hover:bg-indigo-50 cursor-pointer'
                                                        }`}
                                                >
                                                    Modificar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal extraído a ui/ */}
            <CambiarEstadoModal
                data={modalData}
                onClose={() => setModalData(null)}
                onGuardar={handleGuardar}
            />
        </div>
    );
};

export default ActividadesCaso;
