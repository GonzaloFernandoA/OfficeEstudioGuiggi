import React, { useState, useEffect, useMemo } from 'react';
import iconoEdit from '../icons/IconoEdit.png';
import { getTareasFlow } from '../services/tareasService';
import type { TareasFlowResponse, TareaFlow } from '../services/tareasService';

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

    // Estado para el modal de edición de estado
    const [editingTarea, setEditingTarea] = useState<{ flujo: string; tarea: TareaFlow } | null>(null);
    const [editEstado, setEditEstado]         = useState('');
    const [editComentario, setEditComentario] = useState('');
    const [isSaving, setIsSaving]             = useState(false);
    const [saveError, setSaveError]           = useState<string | null>(null);

    useEffect(() => {
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
        if (dni) cargar();
    }, [dni]);

    const flujosEntries = Object.entries(flujos);
    const totalTareas   = flujosEntries.reduce((acc, [, tareas]) => acc + tareas.length, 0);

    const handleOpenEdit = (flujoNombre: string, tarea: TareaFlow) => {
        setEditingTarea({ flujo: flujoNombre, tarea });
        setEditEstado(tarea.estado);
        setEditComentario(tarea.comentario ?? '');
        setSaveError(null);
    };

    const handleCloseModal = () => {
        setEditingTarea(null);
        setEditEstado('');
        setEditComentario('');
        setSaveError(null);
    };

    const handleGuardar = async () => {
        if (!editingTarea) return;
        setIsSaving(true);
        setSaveError(null);
        try {
            // Actualizar localmente (el endpoint de update puede agregarse después)
            setFlujos(prev => {
                const updated = { ...prev };
                updated[editingTarea.flujo] = (updated[editingTarea.flujo] as TareaFlow[]).map(t =>
                    t.taskId === editingTarea.tarea.taskId ? { ...t, estado: editEstado, comentario: editComentario } : t
                );
                return updated;
            });
            handleCloseModal();
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Error al guardar');
        } finally {
            setIsSaving(false);
        }
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

            {/* Modal de edición de estado */}
            {editingTarea && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-4"
                    onClick={handleCloseModal}
                >
                    <div
                        className="bg-white rounded-lg shadow-2xl max-w-md w-full"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">Cambiar Estado</h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <div className="px-6 py-4 space-y-4">
                            <div className="text-sm text-slate-600">
                                <span className="font-medium">Tarea:</span> {editingTarea.tarea.codigo.replace(/_/g, ' ')}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">{editingTarea.tarea.taskId}</div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nuevo Estado</label>
                                <select
                                    value={editEstado}
                                    onChange={e => setEditEstado(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="PENDIENTE">PENDIENTE</option>
                                    <option value="EN_CURSO">EN CURSO</option>
                                    <option value="COMPLETADO">COMPLETADO</option>
                                    <option value="CANCELADO">CANCELADO</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Comentario</label>
                                <textarea
                                    value={editComentario}
                                    onChange={e => setEditComentario(e.target.value)}
                                    rows={4}
                                    placeholder="Ingrese un comentario sobre esta tarea..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                />
                            </div>

                            {saveError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                                    {saveError}
                                </div>
                            )}
                        </div>

                        <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={handleCloseModal}
                                disabled={isSaving}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleGuardar}
                                disabled={isSaving}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {isSaving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActividadesCaso;
