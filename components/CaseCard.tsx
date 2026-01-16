import React from 'react';
import type { FormDataState } from '../types';

interface CaseCardProps {
  caseData: FormDataState;
  onViewDetails: (caseData: FormDataState) => void;
  onEdit: (caseId: number) => void;
  onDelete: (caseData: FormDataState) => void;
}

const CaseCard: React.FC<CaseCardProps> = ({ caseData, onViewDetails, onEdit, onDelete }) => {
  return (
    <div className="bg-slate-50/80 rounded-lg p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col">
      <div className="flex-grow">
        <h3 className="text-lg font-semibold text-slate-800 truncate">
          {caseData.cliente.nombreCompleto}
        </h3>
        <p className="text-sm text-slate-500">DNI: {caseData.cliente.dni}</p>
        <p className="text-sm text-slate-500">Fecha Hecho: {caseData.siniestro.fechaHecho}</p>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-end space-x-4">
        <button
          onClick={() => onViewDetails(caseData)}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          Ver Detalles
        </button>
        <button
          onClick={() => onEdit(caseData.id!)}
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(caseData)}
          className="text-sm font-medium text-red-600 hover:text-red-800"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default CaseCard;
