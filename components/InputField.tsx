import React from 'react';

interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  as?: 'input' | 'textarea';
  rows?: number;
  required?: boolean;
  helpText?: string;
  error?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  type = 'text',
  className = '',
  as = 'input',
  rows = 4,
  required = false,
  helpText,
  error,
}) => {
  const commonProps = {
    name,
    value,
    onChange,
    onBlur,
    placeholder,
    // Fix: Cast the value to a boolean to satisfy the type requirements for the 'aria-invalid' attribute.
    'aria-invalid': !!error,
    className: `w-full px-3 py-2 bg-slate-50 border rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 sm:text-sm ${
      error
        ? 'border-red-500 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
        : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
    }`,
  };

  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {as === 'textarea' ? (
        <textarea {...commonProps} rows={rows}></textarea>
      ) : (
        <input {...commonProps} type={type} id={name} />
      )}
      {helpText && !error && <p className="mt-1 text-xs text-slate-500">{helpText}</p>}
      {error && <p className="mt-1 text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
};

export default InputField;