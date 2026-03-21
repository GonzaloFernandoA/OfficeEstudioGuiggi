import React, { useState, useEffect } from 'react';

/** Datos mínimos que el modal necesita para funcionar.
 *  Tanto ActividadesCaso (TareaFlow) como Actividades (Tarea) mapean
 *  su tipo propio a esta interfaz antes de abrir el modal.
 */
export interface CambiarEstadoData {
    taskId: string;
    codigoDisplay: string;
    estadoActual: string;
    comentarioActual?: string;
}

interface CambiarEstadoModalProps {
    /** null = modal cerrado */
    data: CambiarEstadoData | null;
    onClose: () => void;
    /** El padre decide qué hacer con los nuevos valores. Debe lanzar error si falla. */
    onGuardar: (estado: string, comentario: string) => Promise<void>;
}

const ESTADOS = ['PENDIENTE', 'EN_CURSO', 'COMPLETADA'] as const;

const CambiarEstadoModal: React.FC<CambiarEstadoModalProps> = ({ data, onClose, onGuardar }) => {
    const [estado, setEstado]         = useState('');
    const [comentario, setComentario] = useState('');
    const [isSaving, setIsSaving]     = useState(false);
    const [saveError, setSaveError]   = useState<string | null>(null);

    // Sincronizar valores cada vez que se abre con una tarea nueva
    useEffect(() => {
        if (data) {
            setEstado(data.estadoActual);
            setComentario(data.comentarioActual ?? '');
            setSaveError(null);
        }
    }, [data]);

    if (!data) return null;

    const handleGuardar = async () => {
        setIsSaving(true);
        setSaveError(null);
        try {
            await onGuardar(estado, comentario);
            onClose();
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Error al guardar');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-2xl max-w-md w-full"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Cambiar Estado</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 text-xl leading-none"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-4">
                    <div className="text-sm text-slate-600">
                        <span className="font-medium">Tarea:</span>{' '}
                        {data.codigoDisplay.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">{data.taskId}</div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Nuevo Estado
                        </label>
                        <select
                            value={estado}
                            onChange={e => setEstado(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {ESTADOS.map(e => (
                                <option key={e} value={e}>
                                    {e.replace(/_/g, ' ')}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Comentario
                        </label>
                        <textarea
                            value={comentario}
                            onChange={e => setComentario(e.target.value)}
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

                {/* Footer */}
                <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
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
    );
};

export default CambiarEstadoModal;

