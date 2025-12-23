import React, { useState, useEffect } from 'react';
import Section from './Section';
import InputField from './InputField';
import SelectField from './SelectField';
import { apiClient } from '../services/apiClient';
import { geographicService } from '../services/geographicService';
import { DEFAULT_GEOGRAPHIC_CONFIG } from '../config/geographicConfig';
import type { Provincia } from '../types';

interface Siniestro {
    fecha: string;
    hora: string;
    calle: string;
    localidad: string;
    provincia: string;
    descripcion: string;
}

interface Damnificado {
    nombre: string;
    apellido: string;
    dni: string;
    calle: string;
    localidad: string;
    provincia: string;
}

interface IngresoFormData {
    siniestro: Siniestro;
    damnificados: Damnificado[];
}

const emptySiniestro = (): Siniestro => ({
    fecha: '',
    hora: '',
    calle: '',
    localidad: '',
    provincia: '',
    descripcion: '',
});

const emptyDamnificado = (): Damnificado => ({
    nombre: '',
    apellido: '',
    dni: '',
    calle: '',
    localidad: '',
    provincia: '',
});

const Ingreso: React.FC = () => {
    const [formData, setFormData] = useState<IngresoFormData>({
        siniestro: emptySiniestro(),
        damnificados: [emptyDamnificado()],
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [provincias, setProvincias] = useState<Provincia[]>([]);

    // Inicializar configuración geográfica
    useEffect(() => {
        geographicService.initializeStatic(DEFAULT_GEOGRAPHIC_CONFIG);
        const provinciasList = geographicService.getProvincias();
        setProvincias(provinciasList);
    }, []);

    // Validación
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        // Validar siniestro
        if (!formData.siniestro.fecha.trim()) {
            newErrors['siniestro.fecha'] = 'La fecha es requerida';
            isValid = false;
        }
        if (!formData.siniestro.calle.trim()) {
            newErrors['siniestro.calle'] = 'La calle es requerida';
            isValid = false;
        }
        if (!formData.siniestro.localidad.trim()) {
            newErrors['siniestro.localidad'] = 'La localidad es requerida';
            isValid = false;
        }
        if (!formData.siniestro.provincia.trim()) {
            newErrors['siniestro.provincia'] = 'La provincia es requerida';
            isValid = false;
        }
        if (!formData.siniestro.descripcion.trim()) {
            newErrors['siniestro.descripcion'] = 'La descripción es requerida';
            isValid = false;
        }

        // Validar damnificados
        formData.damnificados.forEach((d, index) => {
            if (!d.nombre.trim()) {
                newErrors[`damnificados.${index}.nombre`] = 'El nombre es requerido';
                isValid = false;
            }
            if (!d.apellido.trim()) {
                newErrors[`damnificados.${index}.apellido`] = 'El apellido es requerido';
                isValid = false;
            }
            if (!d.dni.trim() || !/^\d{7,8}$/.test(d.dni)) {
                newErrors[`damnificados.${index}.dni`] = 'DNI inválido (7 u 8 dígitos)';
                isValid = false;
            }
            if (!d.calle.trim()) {
                newErrors[`damnificados.${index}.calle`] = 'La calle es requerida';
                isValid = false;
            }
            if (!d.localidad.trim()) {
                newErrors[`damnificados.${index}.localidad`] = 'La localidad es requerida';
                isValid = false;
            }
            if (!d.provincia.trim()) {
                newErrors[`damnificados.${index}.provincia`] = 'La provincia es requerida';
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    // Handlers
    const handleSiniestroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            siniestro: { ...prev.siniestro, [name]: value }
        }));
    };

    const handleDamnificadoChange = (
        index: number,
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            damnificados: prev.damnificados.map((d, i) =>
                i === index ? { ...d, [name]: value } : d
            )
        }));
    };

    const addDamnificado = () => {
        setFormData(prev => ({
            ...prev,
            damnificados: [...prev.damnificados, emptyDamnificado()]
        }));
    };

    const removeDamnificado = (index: number) => {
        if (formData.damnificados.length > 1) {
            setFormData(prev => ({
                ...prev,
                damnificados: prev.damnificados.filter((_, i) => i !== index)
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            setMessage({ type: 'error', text: 'Por favor, corrija los errores en el formulario.' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            // Preparar el JSON para enviar
            const payload = {
                siniestro: {
                    fecha: formData.siniestro.fecha.trim(),
                    hora: formData.siniestro.hora.trim(),
                    calle: formData.siniestro.calle.trim(),
                    localidad: formData.siniestro.localidad.trim(),
                    provincia: formData.siniestro.provincia.trim(),
                    descripcion: formData.siniestro.descripcion.trim(),
                },
                damnificados: formData.damnificados.map(d => ({
                    nombre: d.nombre.trim(),
                    apellido: d.apellido.trim(),
                    dni: d.dni.trim(),
                    calle: d.calle.trim(),
                    localidad: d.localidad.trim(),
                    provincia: d.provincia.trim(),
                })),
            };

            console.log('📤 Enviando payload:', payload);

            // Enviar JSON al backend via apiClient
            const response = await apiClient.post('/ingreso', payload);

            if (response.error) {
                throw new Error(response.error);
            }

            setMessage({ type: 'success', text: '✅ Ingreso guardado exitosamente.' });

            // Resetear formulario después de envío exitoso
            setFormData({
                siniestro: emptySiniestro(),
                damnificados: [emptyDamnificado()],
            });

            // Limpiar errores
            setErrors({});
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al enviar el ingreso.';
            setMessage({ type: 'error', text: `❌ ${errorMessage}` });
            console.error('Error en envío:', error);
        } finally {
            setLoading(false);
        }
    };

    // Convertir provincias a opciones para SelectField
    const provinciasOptions = provincias.map(p => p.nombre);

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <p className="font-semibold">{message.text}</p>
                </div>
            )}

            {/* SINIESTRO */}
            <Section title="Siniestro" description="Datos del accidente o siniestro">

                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                        label="Fecha"
                        name="fecha"
                        type="date"
                        value={formData.siniestro.fecha}
                        onChange={handleSiniestroChange}
                        error={errors['siniestro.fecha']}
                        required
                    />
                    <InputField
                        label="Hora"
                        name="hora"
                        type="time"
                        value={formData.siniestro.hora}
                        onChange={handleSiniestroChange}
                        error={errors['siniestro.hora']}
                    />
                </div>

                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField
                        label="Calle"
                        name="calle"
                        value={formData.siniestro.calle}
                        onChange={handleSiniestroChange}
                        error={errors['siniestro.calle']}
                        required
                    />
                    <InputField
                        label="Localidad"
                        name="localidad"
                        value={formData.siniestro.localidad}
                        onChange={handleSiniestroChange}
                        error={errors['siniestro.localidad']}
                        required
                    />
                    <SelectField
                        label="Provincia"
                        name="provincia"
                        value={formData.siniestro.provincia}
                        onChange={handleSiniestroChange}
                        options={provinciasOptions}
                        error={errors['siniestro.provincia']}
                        required
                    />
                </div>

                <InputField
                    label="Descripción"
                    name="descripcion"
                    as="textarea"
                    rows={4}
                    value={formData.siniestro.descripcion}
                    onChange={handleSiniestroChange}
                    placeholder="Describa los detalles del siniestro..."
                    error={errors['siniestro.descripcion']}
                    className="md:col-span-3 lg:col-span-3"
                    required
                />
            </Section>

            {/* DAMNIFICADOS */}
            <Section title="Damnificados" description="Personas afectadas por el siniestro">
                {formData.damnificados.map((damnificado, index) => (
                    <div key={index} className="md:col-span-3 border-t border-slate-200 pt-6 mt-6 first:mt-0 first:border-t-0">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-semibold text-slate-700">Damnificado {index + 1}</h4>
                            {formData.damnificados.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeDamnificado(index)}
                                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                                >
                                    Eliminar
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <InputField
                                label="Nombre"
                                name="nombre"
                                value={damnificado.nombre}
                                onChange={(e) => handleDamnificadoChange(index, e)}
                                error={errors[`damnificados.${index}.nombre`]}
                                required
                            />
                            <InputField
                                label="Apellido"
                                name="apellido"
                                value={damnificado.apellido}
                                onChange={(e) => handleDamnificadoChange(index, e)}
                                error={errors[`damnificados.${index}.apellido`]}
                                required
                            />
                            <InputField
                                label="DNI"
                                name="dni"
                                value={damnificado.dni}
                                onChange={(e) => handleDamnificadoChange(index, e)}
                                error={errors[`damnificados.${index}.dni`]}
                                required
                            />
                            <InputField
                                label="Calle"
                                name="calle"
                                value={damnificado.calle}
                                onChange={(e) => handleDamnificadoChange(index, e)}
                                error={errors[`damnificados.${index}.calle`]}
                                required
                            />
                            <InputField
                                label="Localidad"
                                name="localidad"
                                value={damnificado.localidad}
                                onChange={(e) => handleDamnificadoChange(index, e)}
                                error={errors[`damnificados.${index}.localidad`]}
                                required
                            />
                            <SelectField
                                label="Provincia"
                                name="provincia"
                                value={damnificado.provincia}
                                onChange={(e) => handleDamnificadoChange(index, e)}
                                options={provinciasOptions}
                                error={errors[`damnificados.${index}.provincia`]}
                                required
                            />
                        </div>
                    </div>
                ))}

                {/* Botón agregar damnificado */}
                <div className="md:col-span-3 mt-6">
                    <button
                        type="button"
                        onClick={addDamnificado}
                        className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Agregar Damnificado
                    </button>
                </div>
            </Section>

            {/* Botón submit */}
            <div className="sticky bottom-0 bg-white/80 backdrop-blur-sm py-4 -mx-8 px-8 border-t border-slate-200 z-10 flex justify-end space-x-4">
                <button
                    type="button"
                    onClick={() => {
                        setFormData({
                            siniestro: emptySiniestro(),
                            damnificados: [emptyDamnificado()],
                        });
                        setErrors({});
                        setMessage(null);
                    }}
                    className="px-6 py-3 border border-slate-300 shadow-lg text-base font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50"
                >
                    Limpiar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 border border-transparent shadow-lg text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                    {loading ? 'Guardando...' : 'Guardar Ingreso'}
                </button>
            </div>
        </form>
    );
};

export default Ingreso;