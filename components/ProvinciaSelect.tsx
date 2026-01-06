import React, { useState, useCallback } from 'react';
import SelectField from './SelectField';
import { geographicService } from '../services/geographicService';
import { DEFAULT_GEOGRAPHIC_CONFIG } from '../config/geographicConfig';

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
  allowStaticFallback?: boolean;
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
  allowStaticFallback = true,   //Con False se puede deshabilitar el fallback estático
}) => {
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchIfNeeded = useCallback(async () => {
    if (loaded) return;
    // If service already has provincias, use them — but only when static fallback allowed
    const existing = geographicService.getProvincias();
    if (allowStaticFallback && existing && existing.length > 0) {
      setOptions(existing.map(p => p.nombre));
      setLoaded(true);
      return;
    }

    setLoading(true);
    try {
      if (apiUrl) {
        await geographicService.initializeFromAPI(apiUrl);
      } else {
        // fallback to static config if no apiUrl
        geographicService.initializeStatic(DEFAULT_GEOGRAPHIC_CONFIG);
      }
      const provincias = geographicService.getProvincias() || [];
      setOptions(provincias.map(p => p.nombre));
    } catch (err) {
      console.error('ProvinciaSelect: error cargando provincias:', err);
      if (allowStaticFallback) {
        try {
          geographicService.initializeStatic(DEFAULT_GEOGRAPHIC_CONFIG);
          const provincias = geographicService.getProvincias() || [];
          setOptions(provincias.map(p => p.nombre));
        } catch (e) {
          console.error('ProvinciaSelect: fallback falló:', e);
          setOptions([]);
        }
      } else {
        // Static fallback disabled — leave options empty
        setOptions([]);
      }
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [apiUrl, loaded]);

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
      onFocus={() => { fetchIfNeeded(); }}
    />
  );
};

export default ProvinciaSelect;
