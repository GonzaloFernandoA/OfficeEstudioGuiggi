import React, { useState, useMemo, useEffect } from 'react';
import type { FormDataState } from '../types';
import { ACTUACIONES_PENALES_OPTIONS, CLASIFICACION_LESIONES_OPTIONS, TIPO_RECLAMO_OPTIONS } from '../constants';
import { generateCaseSummary } from '../services/geminiService';
import { generateConvenioDeHonorarios } from '../services/documentService';

interface DashboardProps {
  cases: FormDataState[];
  onEdit: (caseId: number) => void;
  onDelete: (caseId: number) => void;
}

const DetailItem: React.FC<{ label: string; value?: string | string[] | null }> = ({ label, value }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
        return null;
    }
    const displayValue = Array.isArray(value) ? value.join(', ') : value;
    return (
        <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-slate-500">{label}</dt>
            <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">{displayValue}</dd>
        </div>
    );
};

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="my-4">
        <h4 className="text-md font-semibold text-indigo-700 mb-2 border-b border-slate-200 pb-1">{title}</h4>
        {children}
    </div>
);


const Dashboard: React.FC<DashboardProps> = ({ cases, onEdit, onDelete }) => {
  const [selectedCase, setSelectedCase] = useState<FormDataState | null>(null);
  const [caseToDelete, setCaseToDelete] = useState<FormDataState | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    areaPolicial: '',
    lesiones: '',
    reclamo: '',
  });

  // Summary State
  const [summary, setSummary] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Convenio State
  const [convenioText, setConvenioText] = useState('');
  const [isConvenioVisible, setIsConvenioVisible] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('Copiar Texto');

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      // Datos simples de API no tienen clasificacionFinal
      const clasificacionFinal = c.clasificacionFinal || {};
      const { areaPolicial = '', lesiones = '', reclamo = '' } = clasificacionFinal;
      
      if (filters.areaPolicial && areaPolicial !== filters.areaPolicial) return false;
      if (filters.lesiones && lesiones !== filters.lesiones) return false;
      if (filters.reclamo && reclamo !== filters.reclamo) return false;
      
      const searchLower = searchQuery.toLowerCase();
      const nombreCompleto = c.cliente?.nombreCompleto || c.nombreCompleto || '';
      const dni = c.cliente?.dni || c.dni || '';
      
      if (searchQuery && 
          !nombreCompleto.toLowerCase().includes(searchLower) && 
          !dni.toLowerCase().includes(searchLower)) {
          return false;
      }
      return true;
    }).sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  }, [cases, filters, searchQuery]);
  
  const resetFilters = () => {
      setFilters({ areaPolicial: '', lesiones: '', reclamo: '' });
      setSearchQuery('');
  };

  useEffect(() => {
    if (selectedCase) {
        setSummary('');
        setSummaryError(null);
        setIsSummarizing(false);
    }
  }, [selectedCase]);

  const handleGenerateSummary = async () => {
      if (!selectedCase) return;
      setIsSummarizing(true);
      setSummaryError(null);
      setSummary('');
      try {
          const result = await generateCaseSummary(selectedCase);
          setSummary(result);
      } catch (err) {
          setSummaryError(err instanceof Error ? err.message : 'Ocurrió un error desconocido.');
      } finally {
          setIsSummarizing(false);
      }
  };

  const handleGenerateConvenio = () => {
    if (!selectedCase) return;
    const text = generateConvenioDeHonorarios(selectedCase);
    setConvenioText(text);
    setIsConvenioVisible(true);
  };

  const handleCopyConvenio = () => {
    navigator.clipboard.writeText(convenioText).then(() => {
        setCopyButtonText('¡Copiado!');
        setTimeout(() => setCopyButtonText('Copiar Texto'), 2000);
    });
  };

  const handlePrintConvenio = () => {
    const printableArea = document.createElement('iframe');
    printableArea.style.position = 'absolute';
    printableArea.style.width = '0';
    printableArea.style.height = '0';
    printableArea.style.border = '0';
    document.body.appendChild(printableArea);

    const doc = printableArea.contentWindow?.document;
    if (doc) {
        doc.open();
        doc.write(`
          <html>
            <head>
              <title>Convenio de Honorarios</title>
              <style>
                body { font-family: serif; line-height: 1.6; margin: 40px; }
                pre { white-space: pre-wrap; word-wrap: break-word; font-family: serif; }
              </style>
            </head>
            <body>
              <pre>${convenioText}</pre>
            </body>
          </html>
        `);
        doc.close();
        printableArea.contentWindow?.focus();
        printableArea.contentWindow?.print();
    }
    
    // Clean up the iframe after printing
    setTimeout(() => {
        document.body.removeChild(printableArea);
    }, 1000);
  };

  const handleDeleteConfirm = () => {
      if (caseToDelete?.id) {
          onDelete(caseToDelete.id);
      }
      setCaseToDelete(null);
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Tablero de Casos</h2>
      
      <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-1">Buscar</label>
            <input 
                id="search"
                type="text"
                placeholder="Buscar por nombre o DNI..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Área Policial</label>
            <select name="areaPolicial" value={filters.areaPolicial} onChange={handleFilterChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <option value="">Todos</option>
              {ACTUACIONES_PENALES_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Lesiones</label>
            <select name="lesiones" value={filters.lesiones} onChange={handleFilterChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <option value="">Todas</option>
              {CLASIFICACION_LESIONES_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reclamo</label>
            <select name="reclamo" value={filters.reclamo} onChange={handleFilterChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <option value="">Todos</option>
              {TIPO_RECLAMO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="lg:col-start-5">
             <button onClick={resetFilters} className="w-full px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Limpiar
            </button>
          </div>
        </div>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCases.length > 0 ? (
          filteredCases.map(c => {
            // Manejar ambos formatos: API simple y FormDataState completo
            const nombreCompleto = c.cliente?.nombreCompleto || c.nombreCompleto || 'Sin nombre';
            const dni = c.cliente?.dni || c.dni || 'Sin DNI';
            const fechaHecho = c.siniestro?.fechaHecho || c.fechaHecho || 'N/A';
            
            return (
              <div key={c.id} className="bg-slate-50/80 rounded-lg p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col">
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-slate-800 truncate">{nombreCompleto}</h3>
                  <p className="text-sm text-slate-500">DNI: {dni}</p>
                  <p className="text-sm text-slate-500">Fecha Hecho: {fechaHecho}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-end space-x-4">
                   <button onClick={() => setSelectedCase(c)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                     Ver Detalles
                   </button>
                   <button onClick={() => onEdit(c.id!)} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                     Editar
                   </button>
                   <button onClick={() => setCaseToDelete(c)} className="text-sm font-medium text-red-600 hover:text-red-800">
                     Eliminar
                   </button>
                </div>
              </div>
            );
          })
        ) : (
             <div className="md:col-span-2 lg:col-span-3 text-center py-12 bg-slate-50 rounded-lg">
                <h3 className="text-lg font-medium text-slate-700">No se encontraron casos</h3>
                <p className="text-sm text-slate-500 mt-1">
                    {cases.length === 0 ? "Aún no has ingresado ningún caso." : "Prueba a cambiar o limpiar los filtros."}
                </p>
            </div>
        )}
      </div>

      {selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4" onClick={() => setSelectedCase(null)}>
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-xl font-bold text-slate-800">Detalles del Caso</h3>
              <button onClick={() => setSelectedCase(null)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
               <DetailSection title="Datos del Cliente">
                    <DetailItem label="Nombre" value={selectedCase.cliente.nombreCompleto} />
                    <DetailItem label="DNI" value={selectedCase.cliente.dni} />
                    <DetailItem label="Fecha de Nacimiento" value={selectedCase.cliente.fechaNacimiento} />
                    <DetailItem label="Teléfono" value={selectedCase.cliente.telefono} />
                    <DetailItem label="Email" value={selectedCase.cliente.mail} />
                    <DetailItem label="Domicilio" value={`${selectedCase.cliente.domicilio}, ${selectedCase.cliente.localidad}`} />
                    <DetailItem label="Ocupación" value={selectedCase.cliente.ocupacion} />
                    <DetailItem label="Rol en Accidente" value={selectedCase.cliente.rolAccidente} />
               </DetailSection>

               <DetailSection title="Datos del Siniestro">
                    <DetailItem label="Fecha y Hora" value={`${selectedCase.siniestro.fechaHecho} a las ${selectedCase.siniestro.horaHecho}hs`} />
                    <DetailItem label="Lugar" value={selectedCase.siniestro.lugarHecho} />
                    <DetailItem label="Mecánica" value={selectedCase.siniestro.mecanicaAccidente === 'Otros' ? selectedCase.siniestro.otraMecanica : selectedCase.siniestro.mecanicaAccidente} />
                    <DetailItem label="Narración" value={selectedCase.siniestro.narracionHechos} />
               </DetailSection>
               
               <DetailSection title={`Lesiones de ${selectedCase.cliente.nombreCompleto}`}>
                    <DetailItem label="Tipo de Lesión" value={selectedCase.cliente.lesiones.tipoLesion} />
                    <DetailItem label="Zonas Afectadas" value={selectedCase.cliente.lesiones.zonasAfectadas} />
                    <DetailItem label="Otras Zonas" value={selectedCase.cliente.lesiones.otrasZonasAfectadas} />
                    <DetailItem label="Atención Médica" value={selectedCase.cliente.lesiones.centroMedico1} />
                    <DetailItem label="Modo de Traslado" value={selectedCase.cliente.lesiones.modoTraslado} />
               </DetailSection>
               
               <DetailSection title="Clasificación Final">
                    <DetailItem label="Área Policial" value={selectedCase.clasificacionFinal.areaPolicial} />
                    <DetailItem label="Lesiones" value={selectedCase.clasificacionFinal.lesiones.toUpperCase()} />
                    <DetailItem label="Reclamo" value={selectedCase.clasificacionFinal.reclamo} />
               </DetailSection>
               
                <div className="mt-6 space-y-4">
                    <button
                        onClick={handleGenerateSummary}
                        disabled={isSummarizing}
                        className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                    >
                        {isSummarizing ? (
                             <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generando Resumen...
                            </>
                        ) : 'Generar Resumen con IA'}
                    </button>
                    <button
                        onClick={handleGenerateConvenio}
                        className="inline-flex items-center justify-center w-full px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Generar Convenio de Honorarios
                    </button>
                    {summaryError && <p className="mt-2 text-sm text-red-600 text-center">{summaryError}</p>}
                    {summary && (
                        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                            <h4 className="text-md font-semibold text-slate-800 mb-2">Resumen del Caso</h4>
                            <div className="text-sm text-slate-700 whitespace-pre-wrap prose prose-sm max-w-none">{summary}</div>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
      )}

      {isConvenioVisible && (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={() => setIsConvenioVisible(false)}>
            <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                 <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">Convenio de Honorarios</h3>
                    <button onClick={() => setIsConvenioVisible(false)} className="text-slate-400 hover:text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-grow">
                    <textarea
                        readOnly
                        value={convenioText}
                        className="w-full h-full p-4 font-mono text-sm bg-slate-50 border border-slate-200 rounded-md resize-none"
                    ></textarea>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
                    <button onClick={handlePrintConvenio} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-md border border-slate-300">
                        Imprimir
                    </button>
                    <button onClick={handleCopyConvenio} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md min-w-[120px]">
                        {copyButtonText}
                    </button>
                </div>
            </div>
         </div>
      )}

      {caseToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-800">Confirmar Eliminación</h3>
            <p className="mt-2 text-sm text-slate-600">
                ¿Estás seguro de que quieres eliminar el caso de <strong>{caseToDelete.cliente?.nombreCompleto || caseToDelete.nombreCompleto || 'este caso'}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setCaseToDelete(null)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-300">
                Cancelar
              </button>
              <button onClick={handleDeleteConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
