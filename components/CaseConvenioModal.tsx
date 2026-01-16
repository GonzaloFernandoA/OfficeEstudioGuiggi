import React from 'react';

interface CaseConvenioModalProps {
  isOpen: boolean;
  convenioText: string;
  onClose: () => void;
  onCopy: () => void;
  onPrint: () => void;
  copyButtonText: string;
}

const CaseConvenioModal: React.FC<CaseConvenioModalProps> = ({
  isOpen,
  convenioText,
  onClose,
  onCopy,
  onPrint,
  copyButtonText,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">Convenio de Honorarios</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
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
        <div className="p-6 overflow-y-auto flex-grow">
          <textarea
            readOnly
            value={convenioText}
            className="w-full h-full p-4 font-mono text-sm bg-slate-50 border border-slate-200 rounded-md resize-none"
          ></textarea>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
          <button
            onClick={onPrint}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-md border border-slate-300"
          >
            Imprimir
          </button>
          <button
            onClick={onCopy}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md min-w-[120px]"
          >
            {copyButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseConvenioModal;
