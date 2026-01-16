import React from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  caseToDelete: { cliente: { nombreCompleto: string } } | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  caseToDelete,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !caseToDelete) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-slate-800">Confirmar Eliminación</h3>
        <p className="mt-2 text-sm text-slate-600">
          ¿Estás seguro de que quieres eliminar el caso de{' '}
          <strong>{caseToDelete.cliente.nombreCompleto}</strong>? Esta acción no se puede
          deshacer.
        </p>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-300"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
