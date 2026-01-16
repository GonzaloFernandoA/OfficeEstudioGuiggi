import React from 'react';
import { ACTUACIONES_PENALES_OPTIONS, CLASIFICACION_LESIONES_OPTIONS, TIPO_RECLAMO_OPTIONS } from '../constants';

interface CaseFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: {
    areaPolicial: string;
    lesiones: string;
    reclamo: string;
  };
  onFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onResetFilters: () => void;
}

const CaseFilters: React.FC<CaseFiltersProps> = ({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  onResetFilters,
}) => {
  return (
    <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div className="lg:col-span-2">
          <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-1">
            Buscar
          </label>
          <input
            id="search"
            type="text"
            placeholder="Buscar por nombre o DNI..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Área Policial
          </label>
          <select
            name="areaPolicial"
            value={filters.areaPolicial}
            onChange={onFilterChange}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Todos</option>
            {ACTUACIONES_PENALES_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Lesiones
          </label>
          <select
            name="lesiones"
            value={filters.lesiones}
            onChange={onFilterChange}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Todas</option>
            {CLASIFICACION_LESIONES_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Reclamo
          </label>
          <select
            name="reclamo"
            value={filters.reclamo}
            onChange={onFilterChange}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Todos</option>
            {TIPO_RECLAMO_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="lg:col-start-5">
          <button
            onClick={onResetFilters}
            className="w-full px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseFilters;
