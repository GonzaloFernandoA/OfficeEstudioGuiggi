import React, { useState, useEffect } from 'react';
import Section from './Section';
import InputField from './InputField';
import ProvinciaSelect from './ProvinciaSelect';
import AddressRow from './AddressRow';
import { geographicService } from '../services/geographicService';
import { apiClient } from '../services/apiClient';
import AudioRecorder from './AudioRecorder';
import type { IngresoFormData } from '../types';
import { CLASIFICACION_LESIONES_OPTIONS, TIPO_RECLAMO_OPTIONS, ACTUACIONES_PENALES_OPTIONS } from '../constants';
import SelectField from './SelectField';
import { toast } from 'react-toastify';

// Estado inicial helpers
const emptySiniestro = () => ({
    fecha: '',
    hora: '',
    calle: '',
    localidad: '',
    provincia: '',
    descripcion: '',
});

const emptyDamnificado = () => ({
    nombre: '',
    apellido: '',
    dni: '',
    calle: '',
    localidad: '',
    provincia: '',
});

const emptyClasificacionFinal = () => ({
    areaPolicial: '',
    lesiones: '',
    reclamo: '',
});

const Ingreso: React.FC = () => {
    const [formData, setFormData] = useState<IngresoFormData>({
        siniestro: emptySiniestro(),
        damnificados: [emptyDamnificado()],
        clasificacionFinal: emptyClasificacionFinal(),
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    // Estado para mostrar el convenio generado en modal
    const [convenioText, setConvenioText] = useState<string | null>(null);
    const [showConvenioModal, setShowConvenioModal] = useState(false);

    // Estado para el botón "Convenio" (habilitado/deshabilitado)
    const [isSaved, setIsSaved] = useState(false);

    // Porcentaje de honorarios editable (default 30)
    const [porcentajeConvenio, setPorcentajeConvenio] = useState<string>('30');
    const [currentConvenioIndex, setCurrentConvenioIndex] = useState<number>(0);

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
        // La descripción NO es obligatoria (se permite vacía)

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
        setIsSaved(false);
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
        setIsSaved(false); // Resetear estado al cambiar datos
        setFormData(prev => ({
            ...prev,
            damnificados: prev.damnificados.map((d, i) =>
                i === index ? { ...d, [name]: value } : d
            )
        }));
    };

    const handleClasificacionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setIsSaved(false);
        setFormData(prev => ({
            ...prev,
            clasificacionFinal: { ...prev.clasificacionFinal, [name]: value },
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

    // Helper para escapar HTML al imprimir
    const escapeHtml = (unsafe: string) => {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    // Helper: convertir número del día (1-31) a palabras en español (minúsculas)
    const dayNumberToSpanish = (n: number): string => {
        const map: Record<number, string> = {
            1: 'uno', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco', 6: 'seis', 7: 'siete', 8: 'ocho', 9: 'nueve', 10: 'diez',
            11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce', 15: 'quince', 16: 'dieciséis', 17: 'diecisiete', 18: 'dieciocho', 19: 'diecinueve', 20: 'veinte',
            21: 'veintiuno', 22: 'veintidós', 23: 'veintitrés', 24: 'veinticuatro', 25: 'veinticinco', 26: 'veintiséis', 27: 'veintisiete', 28: 'veintiocho', 29: 'veintinueve', 30: 'treinta', 31: 'treinta y uno'
        };
        return map[n] || String(n);
    };

    const monthNumberToSpanish = (m: number): string => {
        const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        return months[(m - 1) >= 0 && (m - 1) < 12 ? (m - 1) : 0];
    };

    // Formatea una fecha en ISO (yyyy-mm-dd) u otros formatos a dd/mm/yyyy
    const formatDateInputToDDMMYYYY = (dateStr: string): string => {
        if (!dateStr) return '';
        // Manejar formato yyyy-mm-dd
        const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
            const [, y, m, d] = isoMatch;
            return `${d}/${m}/${y}`;
        }
        // Intentar parsear con Date como fallback
        const dt = new Date(dateStr);
        if (!isNaN(dt.getTime())) {
            const dd = String(dt.getDate()).padStart(2, '0');
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const yyyy = dt.getFullYear();
            return `${dd}/${mm}/${yyyy}`;
        }
        return dateStr; // si no se puede formatear, devolver original
    };

    // Función que abre una nueva ventana con el convenio listo para imprimir
    const handlePrintConvenio = (text: string) => {
        const w = window.open('', '_blank');
        if (!w) {
            alert('No se pudo abrir la ventana de impresión. Revisa el bloqueador de pop-ups.');
            return;
        }
        const html = `<!doctype html><html><head><meta charset="utf-8"><title>Convenio</title><style>
            body {
                font-family: "Courier New", Courier, monospace;
                font-size: 12pt;
                padding: 20px;
                text-align: justify;
                line-height: 1.2;
            }
            pre {
                white-space: pre-wrap;
                font-family: "Courier New", Courier, monospace;
                font-size: 12pt;
                text-align: justify;
                line-height: 1.2;
            }
        </style></head><body><pre>${escapeHtml(text)}</pre></body></html>`;
        w.document.open();
        w.document.write(html);
        w.document.close();
        w.focus();
        // Llamamos a print; el usuario puede cancelar
        w.print();
    };

    // Genera el texto del convenio para un damnificado y un porcentaje dado
    const generarConvenioText = (index: number, porcentaje: string): string => {
        const d = formData.damnificados[index] || emptyDamnificado();

        const template = `\t\t\t\tCONVENIO DE HONORARIOS

Entre MAXIMILIANO MARCELO GUIGGI, abogado, (Tº X Fº 29 CAM)y  NARDO JUAN FRANCO ( Tª xv Fª 319 CAM),  con estudio jurídico en la calle Alte. Brown 929 5º "A" de la localidad y partido de Morón, Pcia. de Buenos Aires, en adelante denominado "EL PROFESIONAL", y por la otra parte _Apellido_ _Nombre_ dni _dni_ con domicilio en la calle _domicilio_ de la Localidad de _localidad_, provincia de _provincia_; en adelante denominado "el cliente" convienen en celebrar el presente convenio de honorarios profesionales, que se regirá por las siguientes cláusulas y condiciones:
PRIMERA: EL CLIENTE encomienda al PROFESIONAL la gestión judicial y/o extrajudicial del cobro de de los daños y perjuicios del accidente de tránsito de fecha _fechaAccidente_ en la calle _domicilioAccidente_ de la localidad de _localidadAccidente_, Provincia de _provinciaAccidente_, en donde resultara víctima el cliente
SEGUNDA: El honorario del profesional será del _porcentaje_% de la indemnización total percibida por el cliente. En caso de que el CLIENTE no perciba indemnización alguna producto del siniestro reclamado, nada tendrá que abonar al PROFESIONAL, en concepto de honorarios. Los gastos que abonare el PROFESIONAL, serán deducidos de la indemnización percibida por el cliente.
TERCERA: La revocación del poder, sustitución del patrocinio o rescisión unilateral por el cliente no anulará el presente convenio, con la excepción de que mediare culpa del profesional
CUARTA: Para todos los efectos del presente las partes constituyen domicilios especiales en los consignados más arriba, lugares en los que se tendrá por válida y eficaz toda notificación que fuera menester y se someten a la competencia de los tribunales Ordinarios del Departamento Judicial de Morón renunciando a todo otro fuero y/o jurisdicción.
En prueba de conformidad, firman el presente en dos ejemplares de idéntico tenor y a un solo efecto, en Morón a los _fechaHoy_.-
`;

        // Generar la fecha en palabras
        const now = new Date();
        const day = now.getDate();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const dayWords = dayNumberToSpanish(day);
        const monthName = monthNumberToSpanish(month);
        const rawFechaHoy = `a los ${dayWords} días del mes de ${monthName} de ${year}`;
        const fechaHoyFormatted = (rawFechaHoy && (rawFechaHoy as string).toLocaleUpperCase)
            ? rawFechaHoy.toLocaleUpperCase('es-AR')
            : rawFechaHoy.toUpperCase();

        // Resolver nombres de provincia desde los ids almacenados
        const damnificadoProvinciaNombre = geographicService.getProvinciaById(d.provincia || '')?.nombre || d.provincia || '';
        const siniestroProvinciaNombre = geographicService.getProvinciaById(formData.siniestro.provincia || '')?.nombre || formData.siniestro.provincia || '';

        const values: Record<string, string> = {
            '_Apellido_': d.apellido || '',
            '_Nombre_': d.nombre || '',
            '_dni_': d.dni || '',
            '_domicilio_': d.calle || '',
            '_localidad_': d.localidad || '',
            '_provincia_': damnificadoProvinciaNombre,
            '_fechaAccidente_': formatDateInputToDDMMYYYY(formData.siniestro.fecha || ''),
            '_domicilioAccidente_': formData.siniestro.calle || '',
            '_localidadAccidente_': formData.siniestro.localidad || '',
            '_provinciaAccidente_': siniestroProvinciaNombre,
            '_fechaHoy_': fechaHoyFormatted,
            '_porcentaje_': porcentaje,
        };

        let finalText = template;
        Object.keys(values).forEach(key => {
            const re = new RegExp(key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
            finalText = finalText.replace(re, values[key]);
        });

        return finalText;
    };

    // Generar convenio para un damnificado específico: sustituye placeholders y abre modal
    const handleGenerarConvenio = (index: number) => {
        const porcentajeDefault = '30';
        setCurrentConvenioIndex(index);
        setPorcentajeConvenio(porcentajeDefault);
        setConvenioText(generarConvenioText(index, porcentajeDefault));
        setShowConvenioModal(true);
    };

    // Handler para cambio de porcentaje: valida formato (solo dígitos enteros, hasta 2 dígitos)
    const handlePorcentajeChange = (value: string) => {
        const cleaned = value.replace(/[^0-9]/g, '');
        if (/^\d{0,2}$/.test(cleaned)) {
            setPorcentajeConvenio(cleaned);
            const porcentajeParaTexto = cleaned || '0';
            setConvenioText(generarConvenioText(currentConvenioIndex, porcentajeParaTexto));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error('Por favor, corrija los errores en el formulario.', { autoClose: 3000 });
            return;
        }

        setLoading(true);

        try {
            // Helper: dado un valor que puede ser id o nombre, devolver siempre el NOMBRE de la provincia
            const resolveProvinciaNombre = (val: string): string => {
                const v = (val || '').trim();
                if (!v) return '';

                // 1) Si coincide con un ID conocido, devolver el nombre
                const byId = geographicService.getProvinciaById(v);
                if (byId?.nombre) return String(byId.nombre);

                // 2) Si coincide por nombre (case-insensitive), devolver el nombre normalizado
                const lower = v.toLowerCase();
                const byName = (geographicService.getProvincias() || []).find(p =>
                    String(p.nombre || '').toLowerCase() === lower
                );
                if (byName?.nombre) return String(byName.nombre);

                // 3) Fallback: devolver tal cual (ya es un nombre libre)
                return v;
            };

            const siniestroPayload = {
                fecha: formData.siniestro.fecha.trim(),
                hora: formData.siniestro.hora.trim(),
                calle: formData.siniestro.calle.trim(),
                localidad: formData.siniestro.localidad.trim(),
                // Provincia como NOMBRE único (string), no array
                provincia: resolveProvinciaNombre(formData.siniestro.provincia),
                descripcion: formData.siniestro.descripcion.trim(),
            };

            const damnificadosPayload = formData.damnificados.map(d => ({
                nombre: d.nombre.trim(),
                apellido: d.apellido.trim(),
                dni: d.dni.trim(),
                calle: d.calle.trim(),
                localidad: d.localidad.trim(),
                // Provincia como NOMBRE único (string), no array
                provincia: resolveProvinciaNombre(d.provincia),
            }));

            const payload = {
                ...siniestroPayload,
                damnificados: damnificadosPayload,
                clasificacion: {
                    areaPolicial: formData.clasificacionFinal.areaPolicial.trim(),
                    lesiones: formData.clasificacionFinal.lesiones.trim(),
                    reclamo: formData.clasificacionFinal.reclamo.trim(),
                },
                clasificacionFinal: {
                    areaPolicial: formData.clasificacionFinal.areaPolicial.trim(),
                    lesiones: formData.clasificacionFinal.lesiones.trim(),
                    reclamo: formData.clasificacionFinal.reclamo.trim(),
                },
            };

            console.log('[Ingreso] Payload completo enviado a /siniestro =', payload);
            console.log('[Ingreso] Payload JSON string =', JSON.stringify(payload));

            const response = await apiClient.post('/siniestro', payload);

            if (response.error) {
                throw new Error(response.error);
            }

            setIsSaved(true);
            setErrors({});

            toast.success('El siniestro y los damnificados fueron grabados correctamente.', { autoClose: 3000 });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al enviar el ingreso.';
            console.error('Error en envío:', error);
            toast.error(`No se pudo grabar el siniestro. Detalle: ${errorMessage}`, { autoClose: 3000 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Modal del Convenio */}
            {showConvenioModal && convenioText && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black opacity-50" onClick={() => setShowConvenioModal(false)} />
                    <div className="relative bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6 z-10">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Convenio Generado</h3>
                        <div className="flex items-center mb-4 gap-2">
                            <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Porcentaje de honorarios:</label>
                            <input
                                type="text"
                                value={porcentajeConvenio}
                                onChange={(e) => handlePorcentajeChange(e.target.value)}
                                className="w-14 px-1 py-1 border border-slate-300 rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                maxLength={2}
                            />
                            <span className="text-sm font-medium text-slate-700">%</span>
                        </div>
                        <div className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-md mb-4" style={{ whiteSpace: 'pre-wrap' }}>
                            {convenioText}
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button onClick={() => setShowConvenioModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-md border border-slate-300">Cerrar</button>
                            <button type="button" onClick={() => convenioText && handlePrintConvenio(convenioText)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md">Imprimir</button>
                        </div>
                    </div>
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

                <AddressRow
                    calleValue={formData.siniestro.calle}
                    onCalleChange={handleSiniestroChange}
                    calleError={errors['siniestro.calle']}

                    localidadValue={formData.siniestro.localidad}
                    onLocalidadChange={handleSiniestroChange}
                    localidadError={errors['siniestro.localidad']}

                    provinciaValue={formData.siniestro.provincia}
                    onProvinciaChange={handleSiniestroChange}
                    provinciaError={errors['siniestro.provincia']}
                />

                {/* Descripción del siniestro con grabación y transcripción de audio */}
                <div className="md:col-span-3 lg:col-span-3 mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Descripción
                    </label>
                    <p className="text-xs text-slate-500 mb-2">
                        Puede escribir la descripción o grabar un audio y se transcribirá automáticamente.
                    </p>
                    <AudioRecorder
                        name="descripcion"
                        value={formData.siniestro.descripcion}
                        onChange={handleSiniestroChange}
                    />
                    {errors['siniestro.descripcion'] && (
                        <p className="mt-1 text-sm text-red-600">{errors['siniestro.descripcion']}</p>
                    )}
                </div>
            </Section>

            {/* DAMNIFICADOS */}
            <Section title="Damnificados" description="Personas afectadas por el siniestro">
                {formData.damnificados.map((damnificado, index) => (
                    <div key={index} className="md:col-span-3 border-t border-slate-200 pt-6 mt-6 first:mt-0 first:border-t-0">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-semibold text-slate-700">Damnificado {index + 1}</h4>
                            <div className="flex items-center space-x-3">
                                <button
                                    type="button"
                                    onClick={() => handleGenerarConvenio(index)}
                                    disabled={!isSaved}
                                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
                                >
                                    Convenio
                                </button>
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
                            <AddressRow
                                calleValue={damnificado.calle}
                                onCalleChange={(e) => handleDamnificadoChange(index, e)}
                                calleError={errors[`damnificados.${index}.calle`]}

                                localidadValue={damnificado.localidad}
                                onLocalidadChange={(e) => handleDamnificadoChange(index, e)}
                                localidadError={errors[`damnificados.${index}.localidad`]}

                                provinciaValue={damnificado.provincia}
                                onProvinciaChange={(e) => handleDamnificadoChange(index, e)}
                                provinciaError={errors[`damnificados.${index}.provincia`]}
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

            {/* Clasificación Final del Caso (debajo de Damnificados) */}
            <Section title="Clasificación Final del Caso" description="Resumen de la calificación final del siniestro">
                <SelectField
                    label="Clasificación Área Policial"
                    name="areaPolicial"
                    value={formData.clasificacionFinal.areaPolicial}
                    onChange={handleClasificacionChange as any}
                    options={ACTUACIONES_PENALES_OPTIONS}
                    className="md:col-span-1"
                />
                <SelectField
                    label="Clasificación de Lesiones"
                    name="lesiones"
                    value={formData.clasificacionFinal.lesiones}
                    onChange={handleClasificacionChange as any}
                    options={CLASIFICACION_LESIONES_OPTIONS}
                    className="md:col-span-1"
                />
                <SelectField
                    label="Tipo de Reclamo"
                    name="reclamo"
                    value={formData.clasificacionFinal.reclamo}
                    onChange={handleClasificacionChange as any}
                    options={TIPO_RECLAMO_OPTIONS}
                    className="md:col-span-1"
                />
            </Section>

            {/* Botón submit */}
            <div className="sticky bottom-0 bg-white/80 backdrop-blur-sm py-4 -mx-8 px-8 border-t border-slate-200 z-10 flex justify-end space-x-4">
                <button
                    type="button"
                    onClick={() => {
                        setFormData({
                            siniestro: emptySiniestro(),
                            damnificados: [emptyDamnificado()],
                            clasificacionFinal: emptyClasificacionFinal(),
                        });
                        setErrors({});
                        setIsSaved(false); // Deshabilitar convenio al limpiar
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

