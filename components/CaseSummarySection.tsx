import React from 'react';

interface CaseSummarySectionProps {
  summary: string;
  isSummarizing: boolean;
  summaryError: string | null;
  onGenerateSummary: () => void;
}

const CaseSummarySection: React.FC<CaseSummarySectionProps> = ({
  summary,
  isSummarizing,
  summaryError,
  onGenerateSummary,
}) => {
  return (
    <div className="space-y-4">
      <button
        onClick={onGenerateSummary}
        disabled={isSummarizing}
        className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
      >
        {isSummarizing ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Generando Resumen...
          </>
        ) : (
          'Generar Resumen con IA'
        )}
      </button>
      {summaryError && <p className="mt-2 text-sm text-red-600 text-center">{summaryError}</p>}
      {summary && (
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <h4 className="text-md font-semibold text-slate-800 mb-2">Resumen del Caso</h4>
          <div className="text-sm text-slate-700 whitespace-pre-wrap prose prose-sm max-w-none">
            {summary}
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseSummarySection;
