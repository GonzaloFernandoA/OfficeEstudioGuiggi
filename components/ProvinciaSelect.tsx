import React from 'react';
import SelectField from './SelectField';

interface ProvinciaSelectProps {
    label?: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
    error?: string;
    apiUrl?: string; // se mantiene por compatibilidad, pero ya no se usa
}

// Lista hardcodeada de provincias de Argentina
const PROVINCIAS_ARGENTINA: Array<{ value: string; label: string }> = [
    { value: 'BUENOS AIRES', label: 'Buenos Aires' },
    { value: 'CABA', label: 'Ciudad Autónoma de Buenos Aires' },
    { value: 'CATAMARCA', label: 'Catamarca' },
    { value: 'CHACO', label: 'Chaco' },
    { value: 'CHUBUT', label: 'Chubut' },
    { value: 'CORDOBA', label: 'Córdoba' },
    { value: 'CORRIENTES', label: 'Corrientes' },
    { value: 'ENTRE RIOS', label: 'Entre Ríos' },
    { value: 'FORMOSA', label: 'Formosa' },
    { value: 'JUJUY', label: 'Jujuy' },
    { value: 'LA PAMPA', label: 'La Pampa' },
    { value: 'LA RIOJA', label: 'La Rioja' },
    { value: 'MENDOZA', label: 'Mendoza' },
    { value: 'MISIONES', label: 'Misiones' },
    { value: 'NEUQUEN', label: 'Neuquén' },
    { value: 'RIO NEGRO', label: 'Río Negro' },
    { value: 'SALTA', label: 'Salta' },
    { value: 'SAN JUAN', label: 'San Juan' },
    { value: 'SAN LUIS', label: 'San Luis' },
    { value: 'SANTA CRUZ', label: 'Santa Cruz' },
    { value: 'SANTA FE', label: 'Santa Fe' },
    { value: 'SANTIAGO DEL ESTERO', label: 'Santiago del Estero' },
    { value: 'TIERRA DEL FUEGO', label: 'Tierra del Fuego, Antártida e Islas del Atlántico Sur' },
    { value: 'TUCUMAN', label: 'Tucumán' },
];

const ProvinciaSelect: React.FC<ProvinciaSelectProps> = ({
    label = 'Provincia',
    name,
    value,
    onChange,
    placeholder,
    className,
    required = false,
    error,
}) => {
    return (
        <SelectField
            label={label}
            name={name}
            value={value}
            onChange={onChange}
            options={PROVINCIAS_ARGENTINA}
            placeholder={placeholder}
            className={className}
            required={required}
            error={error}
            loading={false}
        />
    );
};

export default ProvinciaSelect;

