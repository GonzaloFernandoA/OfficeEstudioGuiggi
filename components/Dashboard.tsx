import React, { useState, useMemo, useEffect } from 'react';
import type { FormDataState } from '../types';
import { generateCaseSummary } from '../services/geminiService';
import { generateConvenioDeHonorarios } from '../services/documentService';
import CaseFilters from './CaseFilters';
import CaseCard from './CaseCard';
import CaseDetailsModal from './CaseDetailsModal';
import CaseConvenioModal from './CaseConvenioModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface DashboardProps {
  cases: FormDataState[];
  onEdit: (caseId: number) => void;
  onDelete: (caseId: number) => void;
}


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
      const { areaPolicial, lesiones, reclamo } = c.clasificacionFinal;
      if (filters.areaPolicial && areaPolicial !== filters.areaPolicial) return false;
      if (filters.lesiones && lesiones !== filters.lesiones) return false;
      if (filters.reclamo && reclamo !== filters.reclamo) return false;
      
      const searchLower = searchQuery.toLowerCase();
      if (searchQuery && 
          !c.cliente.nombreCompleto.toLowerCase().includes(searchLower) && 
          !c.cliente.dni.toLowerCase().includes(searchLower)) {
          return false;
      }
      return true;
    }).sort((a, b) => (b.id ?? 0) - (a.id ?? 0)); // Sort by newest first
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

      <CaseFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={resetFilters}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCases.length > 0 ? (
          filteredCases.map((c) => (
            <CaseCard
              key={c.id}
              caseData={c}
              onViewDetails={setSelectedCase}
              onEdit={onEdit}
              onDelete={setCaseToDelete}
            />
          ))
        ) : (
          <div className="md:col-span-2 lg:col-span-3 text-center py-12 bg-slate-50 rounded-lg">
            <h3 className="text-lg font-medium text-slate-700">No se encontraron casos</h3>
            <p className="text-sm text-slate-500 mt-1">
              {cases.length === 0
                ? 'Aún no has ingresado ningún caso.'
                : 'Prueba a cambiar o limpiar los filtros.'}
            </p>
          </div>
        )}
      </div>

      <CaseDetailsModal
        isOpen={selectedCase !== null}
        selectedCase={selectedCase}
        summary={summary}
        isSummarizing={isSummarizing}
        summaryError={summaryError}
        onClose={() => setSelectedCase(null)}
        onGenerateSummary={handleGenerateSummary}
        onGenerateConvenio={handleGenerateConvenio}
      />

      <CaseConvenioModal
        isOpen={isConvenioVisible}
        convenioText={convenioText}
        onClose={() => setIsConvenioVisible(false)}
        onCopy={handleCopyConvenio}
        onPrint={handlePrintConvenio}
        copyButtonText={copyButtonText}
      />

      <DeleteConfirmationModal
        isOpen={caseToDelete !== null}
        caseToDelete={caseToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setCaseToDelete(null)}
      />
    </div>
  );
};

export default Dashboard;
