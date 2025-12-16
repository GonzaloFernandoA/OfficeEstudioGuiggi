import React from 'react';

interface CheckboxGridProps {
  title: string;
  options: string[];
  selectedOptions: string[];
  onCheckboxChange: (option: string, isChecked: boolean) => void;
  className?: string;
  error?: string;
  required?: boolean;
}

const CheckboxGrid: React.FC<CheckboxGridProps> = ({ title, options, selectedOptions, onCheckboxChange, className = 'md:col-span-2 lg:col-span-3', error, required }) => {
  return (
    <div className={className}>
      <h3 className="block text-sm font-medium text-slate-700 mb-2">
        {title} {required && <span className="text-red-500">*</span>}
      </h3>
      {error && <p className="text-xs text-red-600 -mt-1 mb-2" role="alert">{error}</p>}
      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-slate-50/50 ${error ? 'border-red-500' : 'border-slate-200'}`}>
        {options.map((option) => (
          <label key={option} className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              checked={selectedOptions.includes(option)}
              onChange={(e) => onCheckboxChange(option, e.target.checked)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default CheckboxGrid;
