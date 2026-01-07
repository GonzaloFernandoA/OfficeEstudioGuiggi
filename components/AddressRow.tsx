import React from 'react';
import InputField from './InputField';
import ProvinciaSelect from './ProvinciaSelect';

interface AddressRowProps {
  calleName?: string;
  calleValue: string;
  onCalleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  calleError?: string;
  calleRequired?: boolean;

  localidadName?: string;
  localidadValue: string;
  onLocalidadChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  localidadError?: string;
  localidadRequired?: boolean;

  provinciaName?: string;
  provinciaValue: string;
  onProvinciaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  provinciaError?: string;
  provinciaRequired?: boolean;

  className?: string;
  labelSuffix?: string;
}

const AddressRow: React.FC<AddressRowProps> = ({
  calleName = 'calle',
  calleValue,
  onCalleChange,
  calleError,
  calleRequired = false,

  localidadName = 'localidad',
  localidadValue,
  onLocalidadChange,
  localidadError,
  localidadRequired = false,

  provinciaName = 'provincia',
  provinciaValue,
  onProvinciaChange,
  provinciaError,
  provinciaRequired = false,

  className = '',
  labelSuffix = '',
}) => {
  // Forzar 3 columnas y ocupar toda la línea (igual que el layout anterior)
  const gridClass = 'md:col-span-3 grid grid-cols-3 gap-4';

  return (
    <div className={`${gridClass} ${className}`.trim()}>
      <InputField
        label={`Calle${labelSuffix}`}
        name={calleName}
        value={calleValue}
        onChange={onCalleChange}
        error={calleError}
        required={calleRequired}
      />

      <InputField
        label={`Localidad${labelSuffix}`}
        name={localidadName}
        value={localidadValue}
        onChange={onLocalidadChange}
        error={localidadError}
        required={localidadRequired}
      />

      <ProvinciaSelect
        name={provinciaName}
        value={provinciaValue}
        onChange={onProvinciaChange}
        error={provinciaError}
        required={provinciaRequired}
        label={`Provincia${labelSuffix}`}
      />
    </div>
  );
};

export default AddressRow;
