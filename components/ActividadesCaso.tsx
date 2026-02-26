import React, { useState, useEffect, useMemo } from 'react';
import iconoEdit from '../icons/IconoEdit.png';
import { getFlowsByDni, updateTarea } from '../services/tareasService';
import type { FlowTarea, TareaUpdatePayload } from '../services/tareasService';

interface ActividadesCasoProps {
    dni: string;
    nombreCompleto: string;
    onVolver: () => void;
}

const STATUS_BADGE: Record<string, string> = {
    COMPLETADA: 'bg-green-100 text-green-700',
    EN_CURSO:   'bg-blue-100 text-blue-700',
    PENDIENTE:  'bg-amber-100 text-amber-700',
};

const formatDate = (iso: string): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = d.getUTCFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

const ReadOnlyField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 border-b border-slate-100 last:border-0">
        <dt className="text-sm font-medium text-slate-500">{label}</dt>
        <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">{value || '—'}</dd>
    </div>
);

const ActividadesCaso: React.FC<ActividadesCasoProps> = ({ dni, nombreCompleto, onVolver }) => {
    const [tareas, setTareas] = useState<FlowTarea[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedTarea, setSelectedTarea] = useState<FlowTarea | null>(null);
    const [editStatus, setEditStatus] = useState('');
    const [editComments, setEditComments] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        const cargar = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getFlowsByDni(dni);
                setTareas(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al cargar las actividades');
            } finally {
                setIsLoading(false);
            }
        };
        cargar();
    }, [dni]);

    // Agrupar por flow_id y ordenar cada grupo por step
    const grupos = useMemo(() => {
        const map: Record<string, FlowTarea[]> = {};
        for (const t of tareas) {
            if (!map[t.flow_id]) map[t.flow_id] = [];
            map[t.flow_id].push(t);
        }
        for (const key of Object.keys(map)) {
            map[key].sort((a, b) => a.step - b.step);
        }
        return map;
    }, [tareas]);

    const handleEdit = (tarea: FlowTarea) => {
        setSelectedTarea(tarea);
        setEditStatus(tarea.status);
        setEditComments(tarea.comments);
        setSaveError(null);
    };

    const handleCloseModal = () => {
        setSelectedTarea(null);
        setEditStatus('');
        setEditComments('');
        setSaveError(null);
    };

    const handleGuardar = async () => {
        if (!selectedTarea) return;
        setIsSaving(true);
        setSaveError(null);
        const payload: TareaUpdatePayload = { status: editStatus, comments: editComments };
        const result = await updateTarea(selectedTarea, payload);
        setIsSaving(false);
        if (!result.success) {
            setSaveError(result.error ?? 'Error al guardar');
            return;
        }
        setTareas(prev =>
            prev.map(t =>
                t.flow_id === selectedTarea.flow_id && t.code === selectedTarea.code
                    ? { ...t, status: editStatus, comments: editComments }
                    : t
            )
        );
        handleCloseModal();
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">
                    Tablero de Actividades — <span className="text-indigo-700">{nombreCompleto}</span>
                </h2>
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

            {!isLoading && !error && Object.keys(grupos).length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    No hay actividades para este caso
                </div>
            )}

            {!isLoading && !error && Object.keys(grupos).map(flowId => (
                <div key={flowId} className="mb-8">
                    {/* Cabecera del grupo */}
                    <div className="bg-indigo-50 border border-indigo-200 rounded-t-lg px-4 py-2">
                        <span className="text-sm font-semibold text-indigo-800">Flow: {flowId}</span>
                    </div>

                    <div className="overflow-hidden rounded-b-lg border border-t-0 border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-10">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Code</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha Inicio</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Editar</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {grupos[flowId].map((tarea, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-slate-400">{tarea.step}</td>
                                        <td className="px-4 py-3 text-sm text-slate-900">{tarea.code}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[tarea.status] ?? 'bg-slate-100 text-slate-700'}`}>
                                                {tarea.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{formatDate(tarea.fecha_inicio)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleEdit(tarea)}
                                                title="Editar"
                                                className="inline-flex items-center justify-center hover:opacity-70 transition-opacity"
                                            >
                                                <img src={iconoEdit} alt="Editar" className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}

            {/* Modal de edición */}
            {selectedTarea && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-4"
                    onClick={handleCloseModal}
                >
                    <div
                        className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800">Editar Actividad</h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            <h4 className="text-md font-semibold text-indigo-700 mb-2 border-b border-slate-200 pb-1">Datos Actividad</h4>
                            <dl className="mb-6">
                                <ReadOnlyField label="Flow ID" value={selectedTarea.flow_id} />
                                <ReadOnlyField label="Código" value={selectedTarea.code} />
                                <ReadOnlyField label="Step" value={String(selectedTarea.step)} />
                                <ReadOnlyField label="Descripción" value={selectedTarea.description} />
                                <ReadOnlyField label="Fecha Inicio" value={formatDate(selectedTarea.fecha_inicio)} />
                                <ReadOnlyField label="Fecha Fin" value={formatDate(selectedTarea.fecha_fin)} />
                                <ReadOnlyField label="Completado" value={selectedTarea.is_completed ? 'Sí' : 'No'} />
                            </dl>

                            <h4 className="text-md font-semibold text-indigo-700 mb-2 border-b border-slate-200 pb-1">Editar</h4>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    value={editStatus}
                                    onChange={e => setEditStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="PENDIENTE">PENDIENTE</option>
                                    <option value="EN_CURSO">EN_CURSO</option>
                                    <option value="COMPLETADA">COMPLETADA</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Comentarios</label>
                                <textarea
                                    value={editComments}
                                    onChange={e => setEditComments(e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                />
                            </div>

                            {saveError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                                    {saveError}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex-shrink-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                disabled={isSaving}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 focus:outline-none disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleGuardar}
                                disabled={isSaving}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
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
