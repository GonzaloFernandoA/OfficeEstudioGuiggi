import React, { useState, useEffect } from 'react';
import SelectField from './SelectField';
import { geographicService } from '../services/geographicService';

interface ProvinciaSelectProps {
    label?: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
    error?: string;
    apiUrl?: string;
}

const DEFAULT_API = 'https://ra8knaldjd.execute-api.us-east-2.amazonaws.com/prod/provincias';

const ProvinciaSelect: React.FC<ProvinciaSelectProps> = ({
    label = 'Provincia',
    name,
    value,
    onChange,
    placeholder,
    className,
    required = false,
    error,
    apiUrl = DEFAULT_API,
}) => {
    const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let mounted = true;

        const loadData = async () => {
            // Verificar si ya están en memoria para evitar parpadeo de "Cargando..."
            const enMemoria = geographicService.getProvincias();
            if (enMemoria && enMemoria.length > 0) {
                setOptions(enMemoria.map(p => ({ value: p.id, label: p.nombre })));
                return;
            }

            // Si no están, llamamos al loadProvincias (que chequea localStorage o hace fetch)
            setLoading(true);
            try {
                const provincias = await geographicService.loadProvincias(apiUrl);
                if (mounted) {
                    setOptions(provincias.map(p => ({ value: p.id, label: p.nombre })));
                }
            } catch (error) {
                console.error('Error cargando combo provincias', error);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadData();

        return () => { mounted = false; };
    }, [apiUrl]);

    return (
        <SelectField
            label={label}
            name={name}
            value={value}
            onChange={onChange}
            options={options}
            placeholder={placeholder}
            className={className}
            required={required}
            error={error}
            loading={loading}
        />
    );
};

export default ProvinciaSelect;