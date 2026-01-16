import React from 'react';
import type { FormDataState } from '../types';
import CaseSummarySection from './CaseSummarySection';

interface DetailItemProps {
  label: string;
  value?: string | string[] | null;
}

interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
}

interface CaseDetailsModalProps {
  isOpen: boolean;
  selectedCase: FormDataState | null;
  summary: string;
  isSummarizing: boolean;
  summaryError: string | null;
  onClose: () => void;
  onGenerateSummary: () => void;
  onGenerateConvenio: () => void;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value }) => {
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

const DetailSection: React.FC<DetailSectionProps> = ({ title, children }) => (
  <div className="my-4">
    <h4 className="text-md font-semibold text-indigo-700 mb-2 border-b border-slate-200 pb-1">
      {title}
    </h4>
    {children}
  </div>
);

const CaseDetailsModal: React.FC<CaseDetailsModalProps> = ({
  isOpen,
  selectedCase,
  summary,
  isSummarizing,
  summaryError,
  onClose,
  onGenerateSummary,
  onGenerateConvenio,
}) => {
  if (!isOpen || !selectedCase) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10">
          <h3 className="text-xl font-bold text-slate-800">Detalles del Caso</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
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
            <DetailItem
              label="Domicilio"
              value={`${selectedCase.cliente.domicilio}, ${selectedCase.cliente.localidad}`}
            />
            <DetailItem label="Ocupación" value={selectedCase.cliente.ocupacion} />
            <DetailItem label="Rol en Accidente" value={selectedCase.cliente.rolAccidente} />
          </DetailSection>

          <DetailSection title="Datos del Siniestro">
            <DetailItem
              label="Fecha y Hora"
              value={`${selectedCase.siniestro.fechaHecho} a las ${selectedCase.siniestro.horaHecho}hs`}
            />
            <DetailItem label="Lugar" value={selectedCase.siniestro.lugarHecho} />
            <DetailItem
              label="Mecánica"
              value={
                selectedCase.siniestro.mecanicaAccidente === 'Otros'
                  ? selectedCase.siniestro.otraMecanica
                  : selectedCase.siniestro.mecanicaAccidente
              }
            />
            <DetailItem label="Narración" value={selectedCase.siniestro.narracionHechos} />
          </DetailSection>

          <DetailSection title={`Lesiones de ${selectedCase.cliente.nombreCompleto}`}>
            <DetailItem label="Tipo de Lesión" value={selectedCase.cliente.lesiones.tipoLesion} />
            <DetailItem
              label="Zonas Afectadas"
              value={selectedCase.cliente.lesiones.zonasAfectadas}
            />
            <DetailItem
              label="Otras Zonas"
              value={selectedCase.cliente.lesiones.otrasZonasAfectadas}
            />
            <DetailItem
              label="Atención Médica"
              value={selectedCase.cliente.lesiones.centroMedico1}
            />
            <DetailItem
              label="Modo de Traslado"
              value={selectedCase.cliente.lesiones.modoTraslado}
            />
          </DetailSection>

          <DetailSection title="Clasificación Final">
            <DetailItem
              label="Área Policial"
              value={selectedCase.clasificacionFinal.areaPolicial}
            />
            <DetailItem
              label="Lesiones"
              value={selectedCase.clasificacionFinal.lesiones.toUpperCase()}
            />
            <DetailItem label="Reclamo" value={selectedCase.clasificacionFinal.reclamo} />
          </DetailSection>

          <div className="mt-6 space-y-4">
            <button
              onClick={onGenerateConvenio}
              className="inline-flex items-center justify-center w-full px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Generar Convenio de Honorarios
            </button>
            <CaseSummarySection
              summary={summary}
              isSummarizing={isSummarizing}
              summaryError={summaryError}
              onGenerateSummary={onGenerateSummary}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetailsModal;
