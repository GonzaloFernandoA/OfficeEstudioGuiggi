import React, { useState, useEffect } from 'react';
import iconoEdit from '../icons/IconoEdit.png';
import { getTareas, updateTarea } from '../services/tareasService';
import type { Tarea } from '../services/tareasService';

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

const Actividades: React.FC = () => {
    const [tareas, setTareas] = useState<Tarea[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTarea, setSelectedTarea] = useState<Tarea | null>(null);
    const [editStatus, setEditStatus] = useState('');
    const [editComments, setEditComments] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        const cargarTareas = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getTareas();
                setTareas(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al cargar las tareas');
            } finally {
                setIsLoading(false);
            }
        };
        cargarTareas();
    }, []);

    const handleEdit = (tarea: Tarea) => {
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
        const result = await updateTarea(selectedTarea, { status: editStatus, comments: editComments });
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
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Tablero de Actividades</h2>

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

            {!isLoading && !error && (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Nombre
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Flow ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Fecha Fin
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Editar
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {tareas.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                        No hay tareas en progreso
                                    </td>
                                </tr>
                            ) : (
                                tareas.map((tarea, index) => (
                                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {tarea.apellido} {tarea.nombre}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                            {tarea.flow_id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                            {tarea.fecha_fin}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => handleEdit(tarea)}
                                                title="Editar"
                                                className="inline-flex items-center justify-center hover:opacity-70 transition-opacity"
                                            >
                                                <img src={iconoEdit} alt="Editar" className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

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
                            {/* Campos de solo lectura */}
                            <h4 className="text-md font-semibold text-indigo-700 mb-2 border-b border-slate-200 pb-1">Datos Actividad</h4>
                            <dl className="mb-6">
                                <ReadOnlyField label="DNI" value={selectedTarea.dni} />
                                <ReadOnlyField label="Apellido y Nombre" value={`${selectedTarea.apellido} ${selectedTarea.nombre}`} />
                                <ReadOnlyField label="Flow ID" value={selectedTarea.flow_id} />
                                <ReadOnlyField label="Código" value={selectedTarea.code} />
                                <ReadOnlyField label="Descripción" value={selectedTarea.description} />
                                <ReadOnlyField label="Fecha Inicio" value={selectedTarea.fecha_inicio} />
                                <ReadOnlyField label="Fecha Fin" value={selectedTarea.fecha_fin} />
                                <ReadOnlyField label="Completado" value={selectedTarea.is_completed ? 'Sí' : 'No'} />
                                <ReadOnlyField label="Última actualización" value={formatDate(selectedTarea.updated_at)} />
                            </dl>

                            {/* Campos editables */}
                            <h4 className="text-md font-semibold text-indigo-700 mb-2 border-b border-slate-200 pb-1">Editar</h4>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Status
                                </label>
                                <input
                                    type="text"
                                    value={editStatus}
                                    onChange={e => setEditStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Comentarios
                                </label>
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

export default Actividades;
