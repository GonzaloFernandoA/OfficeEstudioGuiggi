import React, { useState, useCallback, useEffect } from 'react';
import type { FormDataState, Lesiones, DemandadosState, DemandadoPersona, Testigo } from './types';
import Section from './components/Section';
import InputField from './components/InputField';
import SelectField from './components/SelectField';
import CheckboxGrid from './components/CheckboxGrid';
import AudioRecorder from './components/AudioRecorder';
import Dashboard from './components/Dashboard';
import Contactos from './components/Contactos';
import Ingreso from './components/Ingreso';
import VersionBadge from './components/VersionBadge';
import AddressRow from './components/AddressRow';
import {
    ESTADO_CIVIL_OPTIONS,
    SI_NO_OPTIONS,
    MODO_TRASLADO_OPTIONS,
    ROL_ACCIDENTE_OPTIONS,
    ZONAS_CORPORALES,
    ZONAS_RADIOGRAFIAS,
    DANOS_VEHICULO,
    CATEGORIAS_REGISTRO_OPTIONS,
    CONDICIONES_CLIMATICAS_OPTIONS,
    ROL_PROTAGONISTAS_OPTIONS,
    MECANICA_ACCIDENTE_OPTIONS,
    ACTUACIONES_PENALES_OPTIONS,
    FUENTE_DATO_OPTIONS,
    ROL_TESTIGO_OPTIONS,
    CLASIFICACION_LESIONES_OPTIONS,
    TIPO_RECLAMO_OPTIONS,
    VIVIENDA_OPTIONS,
    TIPO_LESION_OPTIONS,
} from './constants';

import { geographicService } from './services/geographicService';
import ProvinciaSelect from './components/ProvinciaSelect';


const PROVINCIAS_API_URL = 'https://ra8knaldjd.execute-api.us-east-2.amazonaws.com/prod/provincias';
const CLIENTE_API_URL = 'https://ra8knaldjd.execute-api.us-east-2.amazonaws.com/prod/cliente';
const CASOS_API_URL = 'https://ra8knaldjd.execute-api.us-east-2.amazonaws.com/prod/caso';

const initialLesionesState: Lesiones = {
    centroMedico1: '', centroMedico2: '', modoTraslado: '', fueOperado: '', estuvoInternado: '',
    zonasAfectadas: [], otrasZonasAfectadas: '', zonasRadiografias: [], otrasZonasRadiografias: '', tipoLesion: []
};

const initialPersonState = {
    nombreCompleto: '', dni: '', fechaNacimiento: '', estadoCivil: '', nombrePadre: '',
    nombreMadre: '', nombreConyuge: '', domicilio: '', localidad: '', telefono: '',
    ocupacion: '', sueldo: '', lugarTrabajo: '', art: '', vivienda: '', composicionFamiliar: '', hijosACargo: '',
    mail: '', ig: '',
    poseeRegistro: '', vigenciaRegistro: '', categoriasRegistro: '', rolAccidente: '',
    lesiones: { ...initialLesionesState },
};

const initialVehiculoState = { vehiculo: '', dominio: '', companiaSeguros: '', sumaAsegurada: '', franquicia: '', numeroPoliza: '', color: '' };
const initialTitularState = { nombre: '', dni: '', domicilio: '', localidad: '', fechaNacimiento: '', estadoCivil: '', nombrePadre: '', nombreMadre: '', nombreConyuge: '' };

const initialDemandadoPersonaState: DemandadoPersona = {
    nombreApellido: '', dni: '', telefono: '', domicilio: '', localidad: '', partido: '', fuenteDato: '', fuenteDatoOtro: ''
};

const initialDemandadosState: DemandadosState = {
    conductor: { ...initialDemandadoPersonaState },
    titular: { ...initialDemandadoPersonaState },
    asegurado: { ...initialDemandadoPersonaState },
    companiaSeguros: { nombre: '', numeroPoliza: '', numeroSiniestro: '' },
    vehiculo: { marcaModelo: '', dominio: '', color: '' },
    danosMateriales: { zonas: [], otro: '' },
};

const initialTestigoState: Testigo = {
    nombreApellido: '', dni: '', domicilio: '', rol: ''
};

const initialState: FormDataState = {
    cliente: { ...initialPersonState, recomienda: '' },
    vehiculoCliente: { ...initialVehiculoState },
    titularCliente: { ...initialTitularState },
    coActor1: { ...initialPersonState },
    siniestro: {
        lugarHecho: '', fechaHecho: '', horaHecho: '', calles: '', localidad: '', partido: '',
        condicionesClimaticas: '', rolProtagonistas: '', mecanicaAccidente: '', otraMecanica: '',
        narracionHechos: '', actuacionesPenales: '', comisaria: '', causaPenal: ''
    },
    demandados: initialDemandadosState,
    danosMateriales: { zonas: [], otro: '' },
    testigos: {
        testigo1: { ...initialTestigoState },
        testigo2: { ...initialTestigoState },
    },
    clasificacionFinal: {
        areaPolicial: '',
        lesiones: '',
        reclamo: ''
    }
};

type View = 'form' | 'dashboard' | 'setup' | 'ingreso';

// --- Validation Logic ---
type DeepPartialWithString<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartialWithString<T[P]> : string;
};
type ValidationErrors = DeepPartialWithString<FormDataState>;

const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const setNestedValue = (obj: any, path: string, value: any) => {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = current[keys[i]] || {};
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    return obj;
};

// --- DNI Autofill (Cliente / Co-Actor) ---
const isValidDni = (dni: string) => /^\d{7,8}$/.test((dni || '').trim());

// Airtable-style response: { records: [{ fields: { ... } }] }
const getClienteFieldsFromApi = (apiData: any) => apiData?.records?.[0]?.fields ?? null;

const toISODateInput = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        const [dd, mm, yyyy] = value.split('/');
        return `${yyyy}-${mm}-${dd}`;
    }

    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const yyyy = String(d.getFullYear()).padStart(4, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const normalizeRecordId = (val: any): string => {
    if (Array.isArray(val)) return String(val[0] ?? '');
    return String(val ?? '');
};

const applyAutofillFromClienteApi = (draft: any, basePath: 'cliente' | 'coActor1' | 'titularCliente', fields: any) => {
    const nombre = String(fields?.nombre ?? '').trim();
    const apellido = String(fields?.apellido ?? '').trim();
    const nombreCompleto = [nombre, apellido].filter(Boolean).join(' ').trim();

    if (basePath === 'titularCliente') {
        setNestedValue(draft, `${basePath}.nombre`, nombreCompleto);
    } else {
        setNestedValue(draft, `${basePath}.nombreCompleto`, nombreCompleto);
    }

    // Campos comunes (cuando existan)
    setNestedValue(draft, `${basePath}.domicilio`, String(fields?.calle ?? fields?.domicilio ?? fields?.direccion ?? ''));
    setNestedValue(draft, `${basePath}.localidad`, String(fields?.localidad ?? fields?.ciudad ?? ''));

    // Solo Cliente / Co-actor: teléfono y mail
    if (basePath !== 'titularCliente') {
        setNestedValue(draft, `${basePath}.telefono`, String(fields?.telefono ?? ''));
        setNestedValue(draft, `${basePath}.mail`, String(fields?.['Correo electrónico'] ?? fields?.mail ?? fields?.email ?? ''));
    }

    // Estado civil: preferimos el "Name (from Estados Civiles)" si existe
    const estadoCivilLabel = Array.isArray(fields?.['Name (from Estados Civiles)'])
        ? fields['Name (from Estados Civiles)'][0]
        : (fields?.estadoCivil ?? fields?.estado_civil ?? '');
    if (estadoCivilLabel) setNestedValue(draft, `${basePath}.estadoCivil`, String(estadoCivilLabel));

    // Fecha nacimiento: si el backend la expone (si no, no pisa nada)
    const fn = fields?.fechaNacimiento ?? fields?.fecha_nacimiento;
    if (fn) setNestedValue(draft, `${basePath}.fechaNacimiento`, toISODateInput(fn));

    // Otros posibles campos (si el API los trae)
    if (fields?.nombrePadre) setNestedValue(draft, `${basePath}.nombrePadre`, String(fields.nombrePadre));
    if (fields?.nombreMadre) setNestedValue(draft, `${basePath}.nombreMadre`, String(fields.nombreMadre));
    if (fields?.nombreConyuge) setNestedValue(draft, `${basePath}.nombreConyuge`, String(fields.nombreConyuge));

    // Provincia: NO se cambia la lógica de "retrieve" del front.
    // Solo seteamos el record-id si viene del JSON (ej: fields.provincia = ["rec..."])
    if (fields?.provincia) setNestedValue(draft, `${basePath}.provincia`, normalizeRecordId(fields.provincia));
};

// Cuando el DNI se borra, limpiamos los campos autocompletados (dejando el DNI intacto).
// Nota: esto NO cambia la lógica de carga/retrieve de provincias; solo vacía el valor del campo.
const clearAutofilledFields = (draft: any, basePath: 'cliente' | 'coActor1' | 'titularCliente') => {
    const common = [
        'fechaNacimiento',
        'estadoCivil',
        'nombrePadre',
        'nombreMadre',
        'nombreConyuge',
        'domicilio',
        'localidad',
        'provincia',
    ];

    // En titularCliente el nombre del campo es "nombre" (no "nombreCompleto")
    const nameField = basePath === 'titularCliente' ? 'nombre' : 'nombreCompleto';

    const extra: string[] = basePath === 'titularCliente'
        ? []
        : ['telefono', 'mail'];

    const fieldsToClear = [nameField, ...common, ...extra];

    for (const f of fieldsToClear) {
        setNestedValue(draft, `${basePath}.${f}`, '');
    }
};


function useAutofillByDni(
    basePath: 'cliente' | 'coActor1' | 'titularCliente',
    formData: FormDataState,
    setFormData: React.Dispatch<React.SetStateAction<FormDataState>>,
) {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    const abortRef = React.useRef<AbortController | null>(null);
    const lastDniRef = React.useRef<string>('');

    const dni = String((formData as any)?.[basePath]?.dni ?? '').trim();

    React.useEffect(() => {
        //Si el usuario borra el DNI: cancelar request, resetear refs y limpiar autocompletado.
        if (dni === '') {
            abortRef.current?.abort();
            lastDniRef.current = '';
            setLoading(false);
            setError('');

            setFormData(prev => {
                const next = JSON.parse(JSON.stringify(prev));
                clearAutofilledFields(next, basePath);
                return next;
            });
            return;
        }

        setError('');

        if (!isValidDni(dni)) return;
        if (lastDniRef.current === dni) return;

        const timer = window.setTimeout(async () => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            setLoading(true);

            try {
                const res = await fetch(`${CLIENTE_API_URL}?dni=${encodeURIComponent(dni)}`, { signal: controller.signal });

                if (!res.ok) {
                    if (res.status === 404) {
                        lastDniRef.current = dni;
                        setError('No se encontró un cliente para ese DNI.');
                        setLoading(false);
                        return;
                    }
                    throw new Error(`HTTP ${res.status}`);
                }

                const apiData = await res.json();
                const fields = getClienteFieldsFromApi(apiData);

                lastDniRef.current = dni;

                if (!fields) {
                    //setError('Respuesta inválida del servicio de clientes.');
                    //setLoading(false);
                    lastDniRef.current = dni;
                    setError('No se encontró un cliente para ese DNI.');
                    setLoading(false);
                    return;
                }

                setFormData(prev => {
                    const next = JSON.parse(JSON.stringify(prev));
                    applyAutofillFromClienteApi(next, basePath, fields);
                    return next;
                });

                setLoading(false);
            } catch (err: any) {
                if (err?.name === 'AbortError') return;
                console.error('DNI lookup error:', err);
                setLoading(false);
                setError('Error consultando cliente por DNI.');
            }
        }, 450);

        return () => window.clearTimeout(timer);
    }, [dni, basePath, setFormData]);

    return { loading, error };
}


const requiredFields = [
    'cliente.nombreCompleto', 'cliente.dni', 'cliente.fechaNacimiento', 'cliente.domicilio',
    'cliente.localidad', 'cliente.telefono', 'cliente.mail', 'cliente.rolAccidente',
    'vehiculoCliente.vehiculo', 'vehiculoCliente.dominio',
    'siniestro.lugarHecho', 'siniestro.fechaHecho', 'siniestro.horaHecho',
];

const validateField = (name: string, value: any): string => {
    const isNotEmpty = (val: string) => val && val.trim() !== '';
    const isDNI = (val: string) => /^\d{7,8}$/.test(val);
    const isEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    const isPhoneNumber = (val: string) => /^\+?[\d\s\(\)-]{7,}$/.test(val);
    const isPastDate = (val: string) => {
        if (!val) return false;
        const inputDate = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return inputDate < today;
    };

    const requiredError = 'Este campo es obligatorio.';

    if (requiredFields.includes(name) && !isNotEmpty(value)) {
        return requiredError;
    }

    if (name.endsWith('.dni') && isNotEmpty(value) && !isDNI(value)) return 'Formato de DNI inválido (7 u 8 dígitos).';
    if (name.endsWith('.mail') && isNotEmpty(value) && !isEmail(value)) return 'Formato de email inválido.';
    if (name.endsWith('.telefono') && isNotEmpty(value) && !isPhoneNumber(value)) return 'Formato de teléfono inválido.';
    if ((name.endsWith('.fechaNacimiento') || name === 'siniestro.fechaHecho') && isNotEmpty(value) && !isPastDate(value)) {
        return 'La fecha debe ser en el pasado.';
    }

    return '';
};

const DemandadoSubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="md:col-span-3 border-t border-slate-200 pt-6 mt-6 first:mt-0 first:border-t-0">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            {children}
        </div>
    </div>
);

const TestigoSubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="md:col-span-3 lg:col-span-3 border-t border-slate-200 pt-6 mt-6 first:mt-0 first:border-t-0">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-6 gap-y-4">
            {children}
        </div>
    </div>
);


const DemandadosSectionComponent: React.FC<{
    basePath: 'demandados' | 'tercerVehiculoDemandado';
    data: DemandadosState;
    errors: ValidationErrors;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleCheckboxChange: (path: string, itemName: string, isChecked: boolean) => void;
    handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}> = ({ basePath, data, errors, handleInputChange, handleCheckboxChange, handleBlur }) => {
    return (
        <>
            <DemandadoSubSection title="Conductor del Vehículo">
                <InputField label="Nombre y Apellido" name={`${basePath}.conductor.nombreApellido`} value={data.conductor.nombreApellido} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, `${basePath}.conductor.nombreApellido`)} />
                <InputField label="D.N.I." name={`${basePath}.conductor.dni`} value={data.conductor.dni} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, `${basePath}.conductor.dni`)} />
                <InputField label="Teléfono" name={`${basePath}.conductor.telefono`} type="tel" value={data.conductor.telefono} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, `${basePath}.conductor.telefono`)} />
                <AddressRow
                    calleName={`${basePath}.conductor.domicilio`}
                    calleValue={data.conductor.domicilio || ''}
                    onCalleChange={handleInputChange}
                    calleError={getNestedValue(errors, `${basePath}.conductor.domicilio`)}

                    localidadName={`${basePath}.conductor.localidad`}
                    localidadValue={data.conductor.localidad || ''}
                    onLocalidadChange={handleInputChange}
                    localidadError={getNestedValue(errors, `${basePath}.conductor.localidad`)}

                    provinciaName={`${basePath}.conductor.provincia`}
                    provinciaValue={data.conductor.provincia || ''}
                    onProvinciaChange={handleInputChange}
                    provinciaError={getNestedValue(errors, `${basePath}.conductor.provincia`)}
                />
                <SelectField label="Fuente del Dato" name={`${basePath}.conductor.fuenteDato`} value={data.conductor.fuenteDato} onChange={handleInputChange} onBlur={handleBlur} options={FUENTE_DATO_OPTIONS} error={getNestedValue(errors, `${basePath}.conductor.fuenteDato`)} />
                {data.conductor.fuenteDato === 'Otro' && (
                    <InputField label="Aclarar Fuente" name={`${basePath}.conductor.fuenteDatoOtro`} value={data.conductor.fuenteDatoOtro} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, `${basePath}.conductor.fuenteDatoOtro`)} />
                )}
            </DemandadoSubSection>
            {/* Other demandado subsections */}
            <DemandadoSubSection title="Titular Registral del Vehículo">
                <InputField label="Nombre y Apellido" name={`${basePath}.titular.nombreApellido`} value={data.titular.nombreApellido} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, `${basePath}.titular.nombreApellido`)} />
                <InputField label="D.N.I." name={`${basePath}.titular.dni`} value={data.titular.dni} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, `${basePath}.titular.dni`)} />
                <InputField label="Teléfono" name={`${basePath}.titular.telefono`} type="tel" value={data.titular.telefono} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, `${basePath}.titular.telefono`)} />
                <AddressRow
                    calleName={`${basePath}.conductor.domicilio`}
                    calleValue={data.conductor.domicilio || ''}
                    onCalleChange={handleInputChange}
                    calleError={getNestedValue(errors, `${basePath}.conductor.domicilio`)}

                    localidadName={`${basePath}.conductor.localidad`}
                    localidadValue={data.conductor.localidad || ''}
                    onLocalidadChange={handleInputChange}
                    localidadError={getNestedValue(errors, `${basePath}.conductor.localidad`)}

                    provinciaName={`${basePath}.conductor.provincia`}
                    provinciaValue={data.conductor.provincia || ''}
                    onProvinciaChange={handleInputChange}
                    provinciaError={getNestedValue(errors, `${basePath}.conductor.provincia`)}
                />
                <SelectField label="Fuente del Dato" name={`${basePath}.titular.fuenteDato`} value={data.titular.fuenteDato} onChange={handleInputChange} onBlur={handleBlur} options={FUENTE_DATO_OPTIONS} error={getNestedValue(errors, `${basePath}.titular.fuenteDato`)} />
                {data.titular.fuenteDato === 'Otro' && (
                    <InputField label="Aclarar Fuente" name={`${basePath}.titular.fuenteDatoOtro`} value={data.titular.fuenteDatoOtro} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, `${basePath}.titular.fuenteDatoOtro`)} />
                )}
            </DemandadoSubSection>

            <DemandadoSubSection title="Asegurado / Tomador de Póliza del Vehículo">
                <InputField label="Nombre y Apellido" name={`${basePath}.asegurado.nombreApellido`} value={data.asegurado.nombreApellido} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, `${basePath}.asegurado.nombreApellido`)} />
                <InputField label="D.N.I." name={`${basePath}.asegurado.dni`} value={data.asegurado.dni} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, `${basePath}.asegurado.dni`)} />
                <InputField label="Teléfono" name={`${basePath}.asegurado.telefono`} type="tel" value={data.asegurado.telefono} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, `${basePath}.asegurado.telefono`)} />
                <AddressRow
                    calleName={`${basePath}.conductor.domicilio`}
                    calleValue={data.conductor.domicilio || ''}
                    onCalleChange={handleInputChange}
                    calleError={getNestedValue(errors, `${basePath}.conductor.domicilio`)}

                    localidadName={`${basePath}.conductor.localidad`}
                    localidadValue={data.conductor.localidad || ''}
                    onLocalidadChange={handleInputChange}
                    localidadError={getNestedValue(errors, `${basePath}.conductor.localidad`)}

                    provinciaName={`${basePath}.conductor.provincia`}
                    provinciaValue={data.conductor.provincia || ''}
                    onProvinciaChange={handleInputChange}
                    provinciaError={getNestedValue(errors, `${basePath}.conductor.provincia`)}
                />
                <SelectField label="Fuente del Dato" name={`${basePath}.asegurado.fuenteDato`} value={data.asegurado.fuenteDato} onChange={handleInputChange} onBlur={handleBlur} options={FUENTE_DATO_OPTIONS} error={getNestedValue(errors, `${basePath}.asegurado.fuenteDato`)} />
                {data.asegurado.fuenteDato === 'Otro' && (
                    <InputField label="Aclarar Fuente" name={`${basePath}.asegurado.fuenteDatoOtro`} value={data.asegurado.fuenteDatoOtro} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, `${basePath}.asegurado.fuenteDatoOtro`)} />
                )}
            </DemandadoSubSection>

            <DemandadoSubSection title="Datos del Vehículo y Compañía de Seguros">
                <InputField label="Vehículo (Marca y Modelo)" name={`${basePath}.vehiculo.marcaModelo`} value={data.vehiculo.marcaModelo} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, `${basePath}.vehiculo.marcaModelo`)} />
                <InputField label="Dominio" name={`${basePath}.vehiculo.dominio`} value={data.vehiculo.dominio} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, `${basePath}.vehiculo.dominio`)} />
                <InputField label="Color del Vehículo" name={`${basePath}.vehiculo.color`} value={data.vehiculo.color} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, `${basePath}.vehiculo.color`)} />
                <InputField label="Compañía de Seguros" name={`${basePath}.companiaSeguros.nombre`} value={data.companiaSeguros.nombre} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, `${basePath}.companiaSeguros.nombre`)} />
                <InputField label="Número de Póliza" name={`${basePath}.companiaSeguros.numeroPoliza`} value={data.companiaSeguros.numeroPoliza} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, `${basePath}.companiaSeguros.numeroPoliza`)} />
                <InputField label="Número de Siniestro" name={`${basePath}.companiaSeguros.numeroSiniestro`} value={data.companiaSeguros.numeroSiniestro} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, `${basePath}.companiaSeguros.numeroSiniestro`)} />
            </DemandadoSubSection>

            <DemandadoSubSection title="Daños Materiales del Vehículo">
                <CheckboxGrid
                    title="Especificar zona del impacto"
                    options={DANOS_VEHICULO}
                    selectedOptions={data.danosMateriales.zonas}
                    onCheckboxChange={(item, checked) => handleCheckboxChange(`${basePath}.danosMateriales.zonas`, item, checked)}
                    className="md:col-span-3"
                />
                <InputField
                    label="Otro"
                    name={`${basePath}.danosMateriales.otro`}
                    value={data.danosMateriales.otro}
                    onChange={handleInputChange}
                    className="md:col-span-3"
                    placeholder="Especifique otros daños"
                />
            </DemandadoSubSection>
        </>
    );
};

// --- App Component ---
function App() {

    // Detectar stage de build/run: soporta import.meta.env, VITE_ prefix y fallback a window.*
    const getAppStage = (): string => {
        try {
            const im = (import.meta as any)?.env;
            const candidate = im?.REACT_APP_STAGE || im?.VITE_REACT_APP_STAGE || (window as any).__REACT_APP_STAGE__ || (window as any).REACT_APP_STAGE;
            return candidate ? String(candidate).toUpperCase() : '';
        } catch (e) {
            return '';
        }
    };

    const appStage = getAppStage();
    const [cases, setCases] = useState<FormDataState[]>(() => {
        const savedCases = localStorage.getItem('casos');
        return savedCases ? JSON.parse(savedCases) : [];
    });
    const [formData, setFormData] = useState<FormDataState>(initialState);
    const clienteLookup = useAutofillByDni('cliente', formData, setFormData);
    const coActor1Lookup = useAutofillByDni('coActor1', formData, setFormData);
    const titularLookup = useAutofillByDni('titularCliente', formData, setFormData);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [editingCaseId, setEditingCaseId] = useState<number | null>(null);
    const [view, setView] = useState<View>('dashboard');

    useEffect(() => {
        localStorage.setItem('casos', JSON.stringify(cases));
    }, [cases]);

    useEffect(() => {
        geographicService.loadProvincias(PROVINCIAS_API_URL)
            .then(() => console.log('✅ Provincias listas para usar'))
            .catch(err => console.error('⚠️ Falló precarga de provincias', err));
    }, []);
    const sanitizeDniInput = (name: string, value: string): string => {
        if (name === 'cliente.dni' || name === 'coActor1.dni' || name === 'titularCliente.dni') {
            return String(value || '').replace(/\D/g, '').slice(0, 8);
        }
        return value;
    };



    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const sanitizedValue = sanitizeDniInput(name, value);

        setFormData(prev => {
            const newState = JSON.parse(JSON.stringify(prev));
            setNestedValue(newState, name, sanitizedValue);
            return newState;
        });

        if (getNestedValue(errors, name)) {
            setErrors(prev => {
                const newErrors = JSON.parse(JSON.stringify(prev));
                setNestedValue(newErrors, name, '');
                return newErrors;
            });
        }
    }, [errors]);

    const handleCheckboxChange = useCallback((path: string, itemName: string, isChecked: boolean) => {
        setFormData(prev => {
            const newState = JSON.parse(JSON.stringify(prev));
            const currentArray: string[] = getNestedValue(newState, path) || [];
            let newArray: string[];

            if (isChecked) {
                newArray = [...currentArray, itemName];
            } else {
                newArray = currentArray.filter((item: string) => item !== itemName);
            }

            setNestedValue(newState, path, newArray);
            return newState;
        });
    }, []);

    const validateForm = (): boolean => {
        const newErrors: ValidationErrors = {};
        let isValid = true;

        requiredFields.forEach(field => {
            const error = validateField(field, getNestedValue(formData, field));
            if (error) {
                isValid = false;
                setNestedValue(newErrors, field, error);
            }
        });

        if (formData.cliente.lesiones.zonasAfectadas.length === 0) {
            isValid = false;
            setNestedValue(newErrors, 'cliente.lesiones.zonasAfectadas', 'Debe seleccionar al menos una zona afectada.');
        }

        if (formData.coActor1.nombreCompleto.trim() !== '' && formData.coActor1.lesiones.zonasAfectadas.length === 0) {
            isValid = false;
            setNestedValue(newErrors, 'coActor1.lesiones.zonasAfectadas', 'Debe seleccionar al menos una zona afectada para el co-actor.');
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleEdit = (caseId: number) => {
        const caseToEdit = cases.find(c => c.id === caseId);
        if (caseToEdit) {
            setFormData(caseToEdit);
            setEditingCaseId(caseId);
            setErrors({});
            setView('form');
        }
    };

    const handleDelete = (caseId: number) => {
        setCases(prevCases => prevCases.filter(c => c.id !== caseId));
    };

    const cancelEdit = () => {
        setEditingCaseId(null);
        setFormData(initialState);
        setErrors({});
        setView('dashboard');
    }

    // New Menu Handlers
    const handleCreateCase = () => {
        setEditingCaseId(null);
        setFormData(initialState);
        setErrors({});
        setView('form');
    };

    const handleDashboard = () => {
        setEditingCaseId(null);
        setFormData(initialState);
        setErrors({});
        setView('dashboard');
    }

    // Setup handlers & state
    const [setupSection, setSetupSection] = useState<'comisaria' | 'aseguradoras' | 'contactos' | 'marcas' | null>(null);

    const openSetupSection = (section: 'comisaria' | 'aseguradoras' | 'contactos' | 'marcas') => {
        setSetupSection(section);
        setView('setup');
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validación original
        if (!validateForm()) {
            alert("Por favor, corrija los errores marcados en el formulario.");
            return;
        }

        try {
            // 2. Envío a través del PROXY (CASOS_API_URL es '/api-casos/caso')
            const response = await fetch(CASOS_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error(`Error servidor: ${response.status}`);
            }

            const result = await response.json();

            // 3. Lógica de éxito
            const newCase: FormDataState = {
                ...formData,
                id: result.id || Date.now(),
            };

            setCases(prev => [...prev, newCase]);
            setFormData(initialState);
            setErrors({});
            setEditingCaseId(null);
            alert("El caso se ha creado correctamente.");
            setView('dashboard');

        } catch (error) {
            console.error('Error al guardar:', error);
            alert("Error al conectar con el servidor a través del proxy.");
        }
    };
    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const error = validateField(name, value);
        setErrors(prev => {
            const newErrors = JSON.parse(JSON.stringify(prev));
            setNestedValue(newErrors, name, error);
            return newErrors;
        });
    }, []);

    const addThirdVehicle = () => {
        setFormData(prev => ({
            ...prev,
            tercerVehiculoDemandado: { ...initialDemandadosState }
        }));
    };

    const removeThirdVehicle = () => {
        setFormData(prev => {
            const { tercerVehiculoDemandado, ...rest } = prev;
            return rest;
        });
    };

    return (
        <div className="min-h-screen text-slate-800">
            <header className="bg-white shadow-md sticky top-0 z-50 relative">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                    <div className="flex items-center">
                        {/* Logo / Title Area */}
                        <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={handleDashboard}>
                            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Gestión de Casos</h1>
                        </div>
                        {/* Desktop Menu */}
                        <nav className="hidden md:ml-10 md:flex md:space-x-8">
                            {/* Ingreso */}
                            <button onClick={() => setView('ingreso')} className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium leading-5 transition-colors focus:outline-none ${view === 'ingreso' ? 'border-indigo-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                                Ingreso
                            </button>

                            {/* Casos Dropdown */}
                            <div className="relative group">
                                <button className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium leading-5 transition-colors focus:outline-none ${view === 'form' || view === 'dashboard' ? 'border-indigo-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                                    Casos
                                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                <div className="absolute left-0 mt-0 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform z-50 top-full">
                                    <div className="py-1">
                                        <button onClick={handleCreateCase} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Crear</button>
                                        <button onClick={handleDashboard} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Tablero</button>
                                    </div>
                                </div>
                            </div>

                            {/* Clientes Dropdown */}
                            <div className="relative group">
                                <button className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium leading-5 text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors focus:outline-none">
                                    Cliente
                                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                <div className="absolute left-0 mt-0 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform z-50 top-full">
                                    <div className="py-1">
                                        <button onClick={handleCreateCase} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Crear</button>
                                    </div>
                                </div>
                            </div>

                            {/* Setup Dropdown */}
                            <div className="relative group">
                                <button className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium leading-5 text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors focus:outline-none">
                                    Setup
                                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                <div className="absolute left-0 mt-0 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform z-50 top-full">
                                    <div className="py-1">
                                        <button onClick={() => openSetupSection('comisaria')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Comisaría</button>
                                        <button onClick={() => openSetupSection('aseguradoras')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Aseguradoras</button>
                                        <button onClick={() => openSetupSection('contactos')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Contactos</button>
                                        <button onClick={() => openSetupSection('marcas')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Marcas</button>
                                    </div>
                                </div>
                            </div>
                        </nav>
                    </div>
                    {/* Simplified mobile menu access */}
                    <div className="md:hidden flex items-center space-x-4">
                        <button onClick={() => setView('ingreso')} className="text-sm font-medium text-indigo-600">Ingreso</button>
                        <button onClick={handleCreateCase} className="text-sm font-medium text-indigo-600">Crear Caso</button>
                        <button onClick={handleDashboard} className="text-sm font-medium text-slate-600">Tablero</button>
                        {/* Mobile quick access to setup sections */}
                        <div className="flex items-center space-x-2">
                            <button onClick={() => openSetupSection('comisaria')} className="text-sm font-medium text-slate-600">Comisaría</button>
                            <button onClick={() => openSetupSection('aseguradoras')} className="text-sm font-medium text-slate-600">Aseguradoras</button>
                        </div>
                    </div>
                </div>
                <VersionBadge />
                {appStage === 'TESTING' && (
                    <div aria-hidden className="absolute right-20 top-2 text-xs text-white bg-red-600 px-2 py-0.5 rounded-md shadow-sm z-50">
                        TESTING
                    </div>
                )}
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {view === 'ingreso' ? (
                    <Ingreso />
                ) : view === 'form' ? (
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingCaseId ? `Editando caso de ${formData.cliente.nombreCompleto}` : 'Nuevo Caso'}
                            </h2>
                            <p className="text-sm text-slate-500">Los campos marcados con <span className="text-red-500">*</span> son obligatorios.</p>
                        </div>
                        {/* Actor Principal */}
                        <Section title="Datos del Cliente (Actor Principal)" description="Información personal del cliente principal">
                            <InputField label="D.N.I." name="cliente.dni" value={formData.cliente.dni} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'cliente.dni')} required />
                            <div className={`md:col-span-3 text-sm min-h-[1.25rem] ${clienteLookup.error ? 'text-red-600' : 'text-slate-500'}`}>
                                {clienteLookup.loading ? 'Buscando datos por DNI...' : (clienteLookup.error ? clienteLookup.error : '\u00A0')}
                            </div>
                            <InputField label="Nombre y Apellido" name="cliente.nombreCompleto" value={formData.cliente.nombreCompleto} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'cliente.nombreCompleto')} required />
                            <InputField label="Fecha de Nacimiento" name="cliente.fechaNacimiento" type="date" value={formData.cliente.fechaNacimiento} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'cliente.fechaNacimiento')} required />
                            <SelectField label="Estado Civil" name="cliente.estadoCivil" value={formData.cliente.estadoCivil} onChange={handleInputChange} onBlur={handleBlur} options={ESTADO_CIVIL_OPTIONS} error={getNestedValue(errors, 'cliente.estadoCivil')} />
                            <InputField label="Nombre del Padre" name="cliente.nombrePadre" value={formData.cliente.nombrePadre} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'cliente.nombrePadre')} />
                            <InputField label="Nombre de la Madre" name="cliente.nombreMadre" value={formData.cliente.nombreMadre} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'cliente.nombreMadre')} />
                            <InputField label="Nombre del Cónyuge" name="cliente.nombreConyuge" value={formData.cliente.nombreConyuge} onChange={handleInputChange} onBlur={handleBlur} helpText="Completar si es casado/a" error={getNestedValue(errors, 'cliente.nombreConyuge')} />
                            <AddressRow
                                calleName="cliente.domicilio"
                                calleValue={formData.cliente.domicilio || ''}
                                onCalleChange={handleInputChange}
                                calleError={getNestedValue(errors, 'cliente.domicilio')}

                                localidadName="cliente.localidad"
                                localidadValue={formData.cliente.localidad || ''}
                                onLocalidadChange={handleInputChange}
                                localidadError={getNestedValue(errors, 'cliente.localidad')}

                                provinciaName="cliente.provincia"
                                provinciaValue={formData.cliente.provincia || ''}
                                onProvinciaChange={handleInputChange}
                                provinciaError={getNestedValue(errors, 'cliente.provincia')}
                                className="md:col-span-3"
                            />
                            <InputField label="Teléfono" name="cliente.telefono" type="tel" value={formData.cliente.telefono} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'cliente.telefono')} required />

                            <InputField label="Ocupación" name="cliente.ocupacion" value={formData.cliente.ocupacion} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'cliente.ocupacion')} />
                            <InputField label="Sueldo Aproximado" name="cliente.sueldo" value={formData.cliente.sueldo} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'cliente.sueldo')} />
                            <InputField label="Lugar de Trabajo / Empresa" name="cliente.lugarTrabajo" value={formData.cliente.lugarTrabajo} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'cliente.lugarTrabajo')} />
                            <InputField label="ART" name="cliente.art" value={formData.cliente.art} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'cliente.art')} />
                            <SelectField label="Vivienda" name="cliente.vivienda" value={formData.cliente.vivienda} onChange={handleInputChange} onBlur={handleBlur} options={VIVIENDA_OPTIONS} error={getNestedValue(errors, 'cliente.vivienda')} />
                            <InputField label="Cantidad de Hijos a Cargo" name="cliente.hijosACargo" type="number" value={formData.cliente.hijosACargo} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'cliente.hijosACargo')} />
                            <InputField label="Composición Familiar" name="cliente.composicionFamiliar" value={formData.cliente.composicionFamiliar} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'cliente.composicionFamiliar')} as="textarea" rows={2} className="md:col-span-3" />

                            <InputField label="Mail" name="cliente.mail" type="email" value={formData.cliente.mail} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'cliente.mail')} required />
                            <InputField label="IG" name="cliente.ig" value={formData.cliente.ig} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'cliente.ig')} />
                            <InputField label="Le Recomienda" name="cliente.recomienda" value={formData.cliente.recomienda} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'cliente.recomienda')} />

                            <div className="md:col-span-2 lg:col-span-3 my-4 border-t border-slate-200"></div>
                            <SelectField label="¿Posee Registro de Conducir?" name="cliente.poseeRegistro" value={formData.cliente.poseeRegistro} onChange={handleInputChange} onBlur={handleBlur} options={SI_NO_OPTIONS} error={getNestedValue(errors, 'cliente.poseeRegistro')} />
                            <InputField label="Vigencia del Registro" name="cliente.vigenciaRegistro" type="date" value={formData.cliente.vigenciaRegistro} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'cliente.vigenciaRegistro')} />
                            <SelectField label="Categorías del Registro" name="cliente.categoriasRegistro" value={formData.cliente.categoriasRegistro} onChange={handleInputChange} options={CATEGORIAS_REGISTRO_OPTIONS} onBlur={handleBlur} error={getNestedValue(errors, 'cliente.categoriasRegistro')} />
                            <SelectField label="Rol en el Accidente" name="cliente.rolAccidente" value={formData.cliente.rolAccidente} onChange={handleInputChange} options={ROL_ACCIDENTE_OPTIONS} onBlur={handleBlur} error={getNestedValue(errors, 'cliente.rolAccidente')} required />
                        </Section>

                        {/* Lesiones Cliente */}
                        <Section title={`Lesiones y Atención Médica de ${formData.cliente.nombreCompleto || 'Cliente Principal'}`} description="Detalles de la atención médica y lesiones sufridas">
                            <InputField label="Centro Médico de Atención" name="cliente.lesiones.centroMedico1" value={formData.cliente.lesiones.centroMedico1} onChange={handleInputChange} />
                            <InputField label="Segundo Centro Médico" name="cliente.lesiones.centroMedico2" value={formData.cliente.lesiones.centroMedico2} onChange={handleInputChange} />
                            <SelectField label="Modo de Traslado" name="cliente.lesiones.modoTraslado" value={formData.cliente.lesiones.modoTraslado} onChange={handleInputChange} options={MODO_TRASLADO_OPTIONS} />
                            <SelectField label="¿Fue Operado?" name="cliente.lesiones.fueOperado" value={formData.cliente.lesiones.fueOperado} onChange={handleInputChange} options={SI_NO_OPTIONS} />
                            <SelectField label="¿Estuvo Internado?" name="cliente.lesiones.estuvoInternado" value={formData.cliente.lesiones.estuvoInternado} onChange={handleInputChange} options={SI_NO_OPTIONS} />

                            <CheckboxGrid title="Tipo de Lesión Reclamada" options={TIPO_LESION_OPTIONS} selectedOptions={formData.cliente.lesiones.tipoLesion} onCheckboxChange={(item, checked) => handleCheckboxChange('cliente.lesiones.tipoLesion', item, checked)} />

                            <CheckboxGrid title="Zonas Afectadas" options={ZONAS_CORPORALES} selectedOptions={formData.cliente.lesiones.zonasAfectadas} onCheckboxChange={(item, checked) => handleCheckboxChange('cliente.lesiones.zonasAfectadas', item, checked)} required error={getNestedValue(errors, 'cliente.lesiones.zonasAfectadas')} />
                            <InputField label="Otras Zonas" name="cliente.lesiones.otrasZonasAfectadas" value={formData.cliente.lesiones.otrasZonasAfectadas} onChange={handleInputChange} placeholder="Especifique otras zonas afectadas" className="md:col-span-2 lg:col-span-3" />
                            <CheckboxGrid title="Zonas de Radiografías" options={ZONAS_RADIOGRAFIAS} selectedOptions={formData.cliente.lesiones.zonasRadiografias} onCheckboxChange={(item, checked) => handleCheckboxChange('cliente.lesiones.zonasRadiografias', item, checked)} />
                            <InputField label="Otras Radiografías" name="cliente.lesiones.otrasZonasRadiografias" value={formData.cliente.lesiones.otrasZonasRadiografias} onChange={handleInputChange} placeholder="Especifique otras zonas con radiografías" className="md:col-span-2 lg:col-span-3" />
                        </Section>

                        {/* Vehículo Actor Principal */}
                        <Section title="Vehículo (Actor Principal)">
                            <InputField label="Vehículo" name="vehiculoCliente.vehiculo" value={formData.vehiculoCliente.vehiculo} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'vehiculoCliente.vehiculo')} required />
                            <InputField label="Dominio" name="vehiculoCliente.dominio" value={formData.vehiculoCliente.dominio} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'vehiculoCliente.dominio')} required />
                            <InputField label="Color del Auto" name="vehiculoCliente.color" value={formData.vehiculoCliente.color} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'vehiculoCliente.color')} />
                            <InputField label="Compañía de Seguros" name="vehiculoCliente.companiaSeguros" value={formData.vehiculoCliente.companiaSeguros} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'vehiculoCliente.companiaSeguros')} />
                            <InputField label="Número de Póliza" name="vehiculoCliente.numeroPoliza" value={formData.vehiculoCliente.numeroPoliza} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'vehiculoCliente.numeroPoliza')} />
                            <InputField label="Suma Asegurada" name="vehiculoCliente.sumaAsegurada" value={formData.vehiculoCliente.sumaAsegurada} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'vehiculoCliente.sumaAsegurada')} />
                            <InputField label="Franquicia" name="vehiculoCliente.franquicia" value={formData.vehiculoCliente.franquicia} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'vehiculoCliente.franquicia')} />
                        </Section>

                        {/* Daños Materiales */}
                        <Section title="Daños Materiales">
                            <CheckboxGrid title="Daños del Vehículo del actor, especificar zona del impacto" options={DANOS_VEHICULO} selectedOptions={formData.danosMateriales.zonas} onCheckboxChange={(item, checked) => handleCheckboxChange('danosMateriales.zonas', item, checked)} />
                            <InputField label="Otro" name="danosMateriales.otro" value={formData.danosMateriales.otro} onChange={handleInputChange} className="md:col-span-2 lg:col-span-3" />
                        </Section>

                        {/* Titular Registral */}
                        <Section title="Datos del Titular Registral">
                            <InputField label="D.N.I." name="titularCliente.dni" value={formData.titularCliente.dni} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'titularCliente.dni')} required />
                            <div className={`md:col-span-3 text-sm min-h-[1.25rem] ${titularLookup.error ? 'text-red-600' : 'text-slate-500'}`}>
                                {titularLookup.loading ? 'Buscando datos por DNI...' : (titularLookup.error ? titularLookup.error : '\u00A0')}
                            </div>
                            <InputField label="Nombre del Titular" name="titularCliente.nombre" value={formData.titularCliente.nombre} onChange={handleInputChange} />
                            <InputField label="Fecha de Nacimiento del Titular" name="titularCliente.fechaNacimiento" type="date" value={formData.titularCliente.fechaNacimiento} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'titularCliente.fechaNacimiento')} />
                            <SelectField label="Estado Civil" name="titularCliente.estadoCivil" value={formData.titularCliente.estadoCivil} onChange={handleInputChange} options={ESTADO_CIVIL_OPTIONS} />
                            <InputField label="Nombre del Padre" name="titularCliente.nombrePadre" value={formData.titularCliente.nombrePadre} onChange={handleInputChange} />
                            <InputField label="Nombre de la Madre" name="titularCliente.nombreMadre" value={formData.titularCliente.nombreMadre} onChange={handleInputChange} />
                            <InputField label="Nombre del Cónyuge" name="titularCliente.nombreConyuge" value={formData.titularCliente.nombreConyuge} onChange={handleInputChange} helpText="Completar si es casado/a" />
                            <AddressRow
                                calleName="titularCliente.domicilio"
                                calleValue={formData.titularCliente.domicilio || ''}
                                onCalleChange={handleInputChange}
                                calleError={getNestedValue(errors, 'titularCliente.domicilio')}

                                localidadName="titularCliente.localidad"
                                localidadValue={formData.titularCliente.localidad || ''}
                                onLocalidadChange={handleInputChange}
                                localidadError={getNestedValue(errors, 'titularCliente.localidad')}

                                provinciaName="titularCliente.provincia"
                                provinciaValue={formData.titularCliente.provincia || ''}
                                onProvinciaChange={handleInputChange}
                                provinciaError={getNestedValue(errors, 'titularCliente.provincia')}
                                className="md:col-span-3"
                                labelSuffix=" Del Titular"
                            />
                        </Section>

                        {/* Co-Actor (Opcional) */}
                        <Section title="Datos del Co-Actor 1 (Opcional)" description="Completar solo si existe otro actor en el caso">
                            <InputField label="D.N.I." name="coActor1.dni" value={formData.coActor1.dni} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'coActor1.dni')} />
                            <div className={`md:col-span-3 text-sm min-h-[1.25rem] ${coActor1Lookup.error ? 'text-red-600' : 'text-slate-500'}`}>
                                {coActor1Lookup.loading ? 'Buscando datos por DNI...' : (coActor1Lookup.error ? coActor1Lookup.error : '\u00A0')}
                            </div>
                            <InputField label="Nombre y Apellido" name="coActor1.nombreCompleto" value={formData.coActor1.nombreCompleto} onChange={handleInputChange} />
                            <InputField label="Fecha de Nacimiento" name="coActor1.fechaNacimiento" type="date" value={formData.coActor1.fechaNacimiento} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'coActor1.fechaNacimiento')} />
                            <SelectField label="Estado Civil" name="coActor1.estadoCivil" value={formData.coActor1.estadoCivil} onChange={handleInputChange} options={ESTADO_CIVIL_OPTIONS} />
                            <InputField label="Nombre del Padre" name="coActor1.nombrePadre" value={formData.coActor1.nombrePadre} onChange={handleInputChange} />
                            <InputField label="Nombre de la Madre" name="coActor1.nombreMadre" value={formData.coActor1.nombreMadre} onChange={handleInputChange} />
                            <InputField label="Nombre del Cónyuge" name="coActor1.nombreConyuge" value={formData.coActor1.nombreConyuge} onChange={handleInputChange} helpText="Completar si es casado/a" />
                            <AddressRow
                                calleName="coActor1.domicilio"
                                calleValue={formData.coActor1.domicilio || ''}
                                onCalleChange={handleInputChange}
                                calleError={getNestedValue(errors, 'coActor1.domicilio')}

                                localidadName="coActor1.localidad"
                                localidadValue={formData.coActor1.localidad || ''}
                                onLocalidadChange={handleInputChange}
                                localidadError={getNestedValue(errors, 'coActor1.localidad')}

                                provinciaName="coActor1.provincia"
                                provinciaValue={formData.coActor1.provincia || ''}
                                onProvinciaChange={handleInputChange}
                                provinciaError={getNestedValue(errors, 'coActor1.provincia')}
                                className="md:col-span-3"
                            />
                            <InputField label="Teléfono" name="coActor1.telefono" type="tel" value={formData.coActor1.telefono} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'coActor1.telefono')} />

                            <InputField label="Ocupación" name="coActor1.ocupacion" value={formData.coActor1.ocupacion} onChange={handleInputChange} />
                            <InputField label="Sueldo Aproximado" name="coActor1.sueldo" value={formData.coActor1.sueldo} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'coActor1.sueldo')} />
                            <InputField label="Lugar de Trabajo / Empresa" name="coActor1.lugarTrabajo" value={formData.coActor1.lugarTrabajo} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'coActor1.lugarTrabajo')} />
                            <InputField label="ART" name="coActor1.art" value={formData.coActor1.art} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'coActor1.art')} />
                            <SelectField label="Vivienda" name="coActor1.vivienda" value={formData.coActor1.vivienda} onChange={handleInputChange} onBlur={handleBlur} options={VIVIENDA_OPTIONS} error={getNestedValue(errors, 'coActor1.vivienda')} />
                            <InputField label="Cantidad de Hijos a Cargo" name="coActor1.hijosACargo" type="number" value={formData.coActor1.hijosACargo} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'coActor1.hijosACargo')} />
                            <InputField label="Composición Familiar" name="coActor1.composicionFamiliar" value={formData.coActor1.composicionFamiliar} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'coActor1.composicionFamiliar')} as="textarea" rows={2} className="md:col-span-3" />

                            <InputField label="Mail" name="coActor1.mail" type="email" value={formData.coActor1.mail} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'coActor1.mail')} />
                            <InputField label="IG" name="coActor1.ig" value={formData.coActor1.ig} onChange={handleInputChange} onBlur={handleBlur} />

                            <div className="md:col-span-2 lg:col-span-3 my-4 border-t border-slate-200"></div>
                            <SelectField label="¿Posee Registro de Conducir?" name="coActor1.poseeRegistro" value={formData.coActor1.poseeRegistro} onChange={handleInputChange} onBlur={handleBlur} options={SI_NO_OPTIONS} />
                            <InputField label="Vigencia del Registro" name="coActor1.vigenciaRegistro" type="date" value={formData.coActor1.vigenciaRegistro} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'coActor1.vigenciaRegistro')} />
                            <SelectField label="Categorías del Registro" name="coActor1.categoriasRegistro" value={formData.coActor1.categoriasRegistro} onChange={handleInputChange} options={CATEGORIAS_REGISTRO_OPTIONS} />
                            <SelectField label="Rol en el Accidente" name="coActor1.rolAccidente" value={formData.coActor1.rolAccidente} onChange={handleInputChange} options={ROL_ACCIDENTE_OPTIONS} />
                        </Section>

                        {/* Lesiones Co-Actor (Condicional) */}
                        {formData.coActor1.nombreCompleto.trim() !== '' && (
                            <Section title={`Lesiones y Atención Médica de ${formData.coActor1.nombreCompleto}`} description={`Detalles de la atención médica y lesiones sufridas por el co-actor.`}>
                                <InputField label="Centro Médico de Atención" name="coActor1.lesiones.centroMedico1" value={formData.coActor1.lesiones.centroMedico1} onChange={handleInputChange} />
                                <InputField label="Segundo Centro Médico" name="coActor1.lesiones.centroMedico2" value={formData.coActor1.lesiones.centroMedico2} onChange={handleInputChange} />
                                <SelectField label="Modo de Traslado" name="coActor1.lesiones.modoTraslado" value={formData.coActor1.lesiones.modoTraslado} onChange={handleInputChange} options={MODO_TRASLADO_OPTIONS} />
                                <SelectField label="¿Fue Operado?" name="coActor1.lesiones.fueOperado" value={formData.coActor1.lesiones.fueOperado} onChange={handleInputChange} options={SI_NO_OPTIONS} />
                                <SelectField label="¿Estuvo Internado?" name="coActor1.lesiones.estuvoInternado" value={formData.coActor1.lesiones.estuvoInternado} onChange={handleInputChange} options={SI_NO_OPTIONS} />

                                <CheckboxGrid title="Tipo de Lesión Reclamada" options={TIPO_LESION_OPTIONS} selectedOptions={formData.coActor1.lesiones.tipoLesion} onCheckboxChange={(item, checked) => handleCheckboxChange('coActor1.lesiones.tipoLesion', item, checked)} />

                                <CheckboxGrid title="Zonas Afectadas" options={ZONAS_CORPORALES} selectedOptions={formData.coActor1.lesiones.zonasAfectadas} onCheckboxChange={(item, checked) => handleCheckboxChange('coActor1.lesiones.zonasAfectadas', item, checked)} required error={getNestedValue(errors, 'coActor1.lesiones.zonasAfectadas')} />
                                <InputField label="Otras Zonas" name="coActor1.lesiones.otrasZonasAfectadas" value={formData.coActor1.lesiones.otrasZonasAfectadas} onChange={handleInputChange} placeholder="Especifique otras zonas afectadas" className="md:col-span-2 lg:col-span-3" />
                                <CheckboxGrid title="Zonas de Radiografías" options={ZONAS_RADIOGRAFIAS} selectedOptions={formData.coActor1.lesiones.zonasRadiografias} onCheckboxChange={(item, checked) => handleCheckboxChange('coActor1.lesiones.zonasRadiografias', item, checked)} />
                                <InputField label="Otras Radiografías" name="coActor1.lesiones.otrasZonasRadiografias" value={formData.coActor1.lesiones.otrasZonasRadiografias} onChange={handleInputChange} placeholder="Especifique otras zonas con radiografías" className="md:col-span-2 lg:col-span-3" />
                            </Section>
                        )}

                        {/* Datos del Siniestro */}
                        <Section title="Datos del Siniestro">
                            <InputField label="Fecha del Hecho" name="siniestro.fechaHecho" type="date" value={formData.siniestro.fechaHecho} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'siniestro.fechaHecho')} required />
                            <InputField label="Hora Aproximada" name="siniestro.horaHecho" type="time" value={formData.siniestro.horaHecho} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'siniestro.horaHecho')} required />
                            /*TODO, remover campo y que no rompa validacion*/<InputField label="Lugar del Hecho" name="siniestro.lugarHecho" value={formData.siniestro.lugarHecho} onChange={handleInputChange} onBlur={handleBlur} helpText="Ej: Av. Rivadavia y Av. Callao" error={getNestedValue(errors, 'siniestro.lugarHecho')} required />
                            <AddressRow
                                calleName="siniestro.calles"
                                calleValue={formData.siniestro.calles || ''}
                                onCalleChange={handleInputChange}
                                calleError={getNestedValue(errors, 'siniestro.calles')}

                                localidadName="siniestro.localidad"
                                localidadValue={formData.siniestro.localidad || ''}
                                onLocalidadChange={handleInputChange}
                                localidadError={getNestedValue(errors, 'siniestro.localidad')}

                                provinciaName="siniestro.provincia"
                                provinciaValue={formData.siniestro.provincia || ''}
                                onProvinciaChange={handleInputChange}
                                provinciaError={getNestedValue(errors, 'siniestro.provincia')}
                                className="md:col-span-3"
                            />
                            <SelectField label="Condiciones Climáticas" name="siniestro.condicionesClimaticas" value={formData.siniestro.condicionesClimaticas} onChange={handleInputChange} onBlur={handleBlur} options={CONDICIONES_CLIMATICAS_OPTIONS} error={getNestedValue(errors, 'siniestro.condicionesClimaticas')} />
                            <SelectField label="Rol de los Protagonistas" name="siniestro.rolProtagonistas" value={formData.siniestro.rolProtagonistas} onChange={handleInputChange} onBlur={handleBlur} options={ROL_PROTAGONISTAS_OPTIONS} error={getNestedValue(errors, 'siniestro.rolProtagonistas')} />
                            <SelectField label="Mecánica del Accidente" name="siniestro.mecanicaAccidente" value={formData.siniestro.mecanicaAccidente} onChange={handleInputChange} onBlur={handleBlur} options={MECANICA_ACCIDENTE_OPTIONS} error={getNestedValue(errors, 'siniestro.mecanicaAccidente')} className="lg:col-span-2" />

                            {formData.siniestro.mecanicaAccidente === 'Otros' && (
                                <InputField
                                    label="Especifique otra mecánica"
                                    name="siniestro.otraMecanica"
                                    value={formData.siniestro.otraMecanica}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    error={getNestedValue(errors, 'siniestro.otraMecanica')}
                                    className="md:col-span-2 lg:col-span-3"
                                    as="textarea"
                                />
                            )}

                            <div className="md:col-span-3 my-4 border-t border-slate-200"></div>

                            <div className="md:col-span-3">
                                <h3 className="text-lg font-semibold text-slate-700 mb-2">Narración de los Hechos</h3>
                                <div className="text-sm text-sky-700 bg-sky-100 p-3 rounded-md mb-4" role="alert">
                                    <p><strong>Recordatorio:</strong> Al grabar, no olvide preguntar y describir el sentido de circulación de los vehículos involucrados.</p>
                                </div>
                                <AudioRecorder
                                    name="siniestro.narracionHechos"
                                    value={formData.siniestro.narracionHechos}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="md:col-span-3 my-4 border-t border-slate-200"></div>

                            <SelectField
                                label="Actuaciones Penales"
                                name="siniestro.actuacionesPenales"
                                value={formData.siniestro.actuacionesPenales}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                options={ACTUACIONES_PENALES_OPTIONS}
                                error={getNestedValue(errors, 'siniestro.actuacionesPenales')}
                            />
                            <InputField label="Comisaría Interviniente" name="siniestro.comisaria" value={formData.siniestro.comisaria} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'siniestro.comisaria')} />
                            <InputField label="Nº de Causa Penal" name="siniestro.causaPenal" value={formData.siniestro.causaPenal} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'siniestro.causaPenal')} />
                        </Section>

                        {/* Datos de los Demandados */}
                        <Section title="Datos de los Demandados" description="Información de los terceros involucrados en el siniestro.">
                            <DemandadosSectionComponent
                                basePath="demandados"
                                data={formData.demandados}
                                errors={errors}
                                handleInputChange={handleInputChange}
                                handleCheckboxChange={handleCheckboxChange}
                                handleBlur={handleBlur}
                            />
                        </Section>

                        {!formData.tercerVehiculoDemandado ? (
                            <div className="my-6 flex justify-center">
                                <button
                                    type="button"
                                    onClick={addThirdVehicle}
                                    className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Agregar Tercer Vehículo Involucrado
                                </button>
                            </div>
                        ) : null}

                        {formData.tercerVehiculoDemandado && (
                            <Section title="Datos del Tercer Vehículo Involucrado">
                                <DemandadosSectionComponent
                                    basePath="tercerVehiculoDemandado"
                                    data={formData.tercerVehiculoDemandado}
                                    errors={errors}
                                    handleInputChange={handleInputChange}
                                    handleCheckboxChange={handleCheckboxChange}
                                    handleBlur={handleBlur}
                                />
                                <div className="md:col-span-3 mt-6 text-right">
                                    <button
                                        type="button"
                                        onClick={removeThirdVehicle}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                        </svg>
                                        Eliminar Tercer Vehículo
                                    </button>
                                </div>
                            </Section>
                        )}

                        {/* Testigos Presenciales */}
                        <Section title="Testigos Presenciales">
                            <TestigoSubSection title="Testigo 1">
                                <InputField label="Nombre y Apellido" name="testigos.testigo1.nombreApellido" value={formData.testigos.testigo1.nombreApellido} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'testigos.testigo1.nombreApellido')} />
                                <InputField label="D.N.I." name="testigos.testigo1.dni" value={formData.testigos.testigo1.dni} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'testigos.testigo1.dni')} />
                                <AddressRow
                                    calleName="testigos.testigo1.domicilio"
                                    calleValue={formData.testigos.testigo1.domicilio || ''}
                                    onCalleChange={handleInputChange}
                                    calleError={getNestedValue(errors, 'testigos.testigo1.domicilio')}

                                    localidadName="testigos.testigo1.localidad"
                                    localidadValue={formData.testigos.testigo1.localidad || ''}
                                    onLocalidadChange={handleInputChange}
                                    localidadError={getNestedValue(errors, 'testigos.testigo1.localidad')}

                                    provinciaName="testigos.testigo1.provincia"
                                    provinciaValue={formData.testigos.testigo1.provincia || ''}
                                    onProvinciaChange={handleInputChange}
                                    provinciaError={getNestedValue(errors, 'testigos.testigo1.provincia')}
                                    className="md:col-span-2 lg:col-span-2"
                                />
                                <SelectField label="Rol" name="testigos.testigo1.rol" value={formData.testigos.testigo1.rol} onChange={handleInputChange} onBlur={handleBlur} options={ROL_TESTIGO_OPTIONS} error={getNestedValue(errors, 'testigos.testigo1.rol')} />
                            </TestigoSubSection>
                            <TestigoSubSection title="Testigo 2">
                                <InputField label="Nombre y Apellido" name="testigos.testigo2.nombreApellido" value={formData.testigos.testigo2.nombreApellido} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'testigos.testigo2.nombreApellido')} />
                                <InputField label="D.N.I." name="testigos.testigo2.dni" value={formData.testigos.testigo2.dni} onChange={handleInputChange} onBlur={handleBlur} error={getNestedValue(errors, 'testigos.testigo2.dni')} />
                                <AddressRow
                                    calleName="testigos.testigo2.domicilio"
                                    calleValue={formData.testigos.testigo2.domicilio || ''}
                                    onCalleChange={handleInputChange}
                                    calleError={getNestedValue(errors, 'testigos.testigo2.domicilio')}

                                    localidadName="testigos.testigo2.localidad"
                                    localidadValue={formData.testigos.testigo2.localidad || ''}
                                    onLocalidadChange={handleInputChange}
                                    localidadError={getNestedValue(errors, 'testigos.testigo2.localidad')}

                                    provinciaName="testigos.testigo2.provincia"
                                    provinciaValue={formData.testigos.testigo2.provincia || ''}
                                    onProvinciaChange={handleInputChange}
                                    provinciaError={getNestedValue(errors, 'testigos.testigo2.provincia')}
                                    className="md:col-span-2 lg:col-span-2"
                                />
                                <SelectField label="Rol" name="testigos.testigo2.rol" value={formData.testigos.testigo2.rol} onChange={handleInputChange} onBlur={handleBlur} options={ROL_TESTIGO_OPTIONS} error={getNestedValue(errors, 'testigos.testigo2.rol')} />
                            </TestigoSubSection>
                        </Section>

                        {/* Clasificación Final del Caso */}
                        <Section title="Clasificación Final del Caso">
                            <SelectField
                                label="Clasificación Área Policial"
                                name="clasificacionFinal.areaPolicial"
                                value={formData.clasificacionFinal.areaPolicial}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                options={ACTUACIONES_PENALES_OPTIONS}
                                error={getNestedValue(errors, 'clasificacionFinal.areaPolicial')}
                            />
                            <SelectField
                                label="Clasificación Lesiones"
                                name="clasificacionFinal.lesiones"
                                value={formData.clasificacionFinal.lesiones}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                options={CLASIFICACION_LESIONES_OPTIONS}
                                error={getNestedValue(errors, 'clasificacionFinal.lesiones')}
                            />
                            <SelectField
                                label="Tipo de Reclamo"
                                name="clasificacionFinal.reclamo"
                                value={formData.clasificacionFinal.reclamo}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                options={TIPO_RECLAMO_OPTIONS}
                                error={getNestedValue(errors, 'clasificacionFinal.reclamo')}
                            />
                        </Section>

                        <div className="sticky bottom-0 bg-white/80 backdrop-blur-sm py-4 mt-8 -mx-8 px-8 border-t border-slate-200 z-10">
                            <div className="flex justify-end space-x-4">
                                {editingCaseId && (
                                    <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="inline-flex justify-center py-3 px-6 border border-slate-300 shadow-lg text-base font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Cancelar
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="inline-flex justify-center py-3 px-6 border border-transparent shadow-lg textBase font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
                                >
                                    {editingCaseId ? 'Actualizar Caso' : 'Ingresar Caso'}
                                </button>
                            </div>
                        </div>
                    </form>
                ) : view === 'setup' ? (
                    // Simple placeholder views for setup sections. You can replace these with full components later.
                    <div>
                        {setupSection === 'comisaria' && (
                            <Section title="Setup — Comisaría">
                                <p className="text-sm text-slate-600">Aquí puedes gestionar la lista de comisarías (crear, editar, eliminar).</p>
                            </Section>
                        )}
                        {setupSection === 'aseguradoras' && (
                            <Section title="Setup — Aseguradoras">
                                <p className="text-sm text-slate-600">Aquí puedes gestionar las aseguradoras.</p>
                            </Section>
                        )}
                        {setupSection === 'contactos' && (
                            <Contactos />
                        )}
                        {setupSection === 'marcas' && (
                            <Section title="Setup — Marcas">
                                <p className="text-sm text-slate-600">Aquí puedes gestionar marcas de vehículos.</p>
                            </Section>
                        )}
                        <div className="mt-4">
                            <button onClick={() => setView('dashboard')} className="px-4 py-2 rounded-md bg-slate-100 border border-slate-300">Volver al Tablero</button>
                        </div>
                    </div>
                ) : (
                    <Dashboard cases={cases} onEdit={handleEdit} onDelete={handleDelete} />
                )}
            </main>
        </div>
    );
}

export default App;
