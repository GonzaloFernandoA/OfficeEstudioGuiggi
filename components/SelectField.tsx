import React from 'react';

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  required?: boolean;
  error?: string;
  loading?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  options,
  placeholder = 'Seleccione...',
  className = '',
  required = false,
  error,
  loading = false,
}) => {
  const [interacted, setInteracted] = React.useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
    setInteracted(true);
    if (onFocus) onFocus(e);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLSelectElement>) => {
    setInteracted(true);
    if (onFocus) {
      try {
        // Call onFocus so consumers can start loading options on mouse down
        onFocus(e as unknown as React.FocusEvent<HTMLSelectElement>);
      } catch (err) {
        // ignore
      }
    }
  };
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={error ? 'true' : 'false'}
        className={`w-full px-3 py-2 bg-slate-50 border rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm ${
          error
            ? 'border-red-500 text-red-900 focus:ring-red-500 focus:border-red-500'
            : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
        }`}
        onFocus={handleFocus}
        onMouseDown={handleMouseDown}
      >
        {loading && interacted ? (
          <option value="" disabled> Cargando...</option>
        ) : (
          <>
            <option value="" disabled>{placeholder}</option>
            {options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </>
        )}
      </select>
      {error && <p className="mt-1 text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
};

export default SelectField;
