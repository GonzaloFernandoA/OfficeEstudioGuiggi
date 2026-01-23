/**
 * jsonService - Servicio compartido para normalizar y serializar datos JSON
 * Centraliza la lógica de transformación de datos para Ingreso y Casos
 */

import type { FormDataState } from '../types';
import { geographicService } from './geographicService';

/**
 * Interfaz para datos de Ingreso (Siniestro)
 */
interface IngresoFormData {
    siniestro: {
        fecha: string;
        hora: string;
        calle: string;
        localidad: string;
        provincia: string;
        descripcion: string;
    };
    damnificados: {
        nombre: string;
        apellido: string;
        dni: string;
        calle: string;
        localidad: string;
        provincia: string;
    }[];
}

/**
 * Resuelve un ID de provincia (convierte nombre a ID si es necesario)
 */
const resolveProvinciaId = (val: string): string => {
    const v = (val || '').trim();
    if (!v) return '';
    
    // Si ya es un ID
    if (geographicService.getProvinciaById(v)) return v;
    
    // Buscar por nombre (case-insensitive)
    const found = (geographicService.getProvincias() || []).find(
        p => String(p.nombre || '').toLowerCase() === v.toLowerCase()
    );
    if (found) return found.id;
    
    // Fallback: slugificar el nombre
    const slug = String(v).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (geographicService.getProvinciaById(slug)) return slug;
    
    return v; // Si no se puede resolver, devolver como está
};

/**
 * Convierte un valor a array de recordId (si está vacío devuelve array vacío)
 */
const toRecordIdArray = (id: string): string[] => {
    const v = (id || '').trim();
    return v ? [v] : [];
};

/**
 * Normaliza datos de Ingreso (Siniestro) para envío al servidor
 * Transforma provincias a IDs y aplica trimming
 */
export const normalizeSiniestroData = (formData: IngresoFormData): Record<string, any> => {
    const siniestroPayload = {
        fecha: formData.siniestro.fecha.trim(),
        hora: formData.siniestro.hora.trim(),
        calle: formData.siniestro.calle.trim(),
        localidad: formData.siniestro.localidad.trim(),
        provincia: toRecordIdArray(resolveProvinciaId(formData.siniestro.provincia)),
        descripcion: formData.siniestro.descripcion.trim(),
    };

    const damnificadosPayload = formData.damnificados.map(d => ({
        nombre: d.nombre.trim(),
        apellido: d.apellido.trim(),
        dni: d.dni.trim(),
        calle: d.calle.trim(),
        localidad: d.localidad.trim(),
        provincia: toRecordIdArray(resolveProvinciaId(d.provincia)),
    }));

    return {
        ...siniestroPayload,
        damnificados: damnificadosPayload,
    };
};

/**
 * Normaliza datos de caso para envío al servidor
 * Estructura esperada: cliente: {..}, siniestro: {...}, demandados: {...}
 */
export const normalizeCaseData = (caseData: FormDataState): Record<string, any> => {
    return {
        id: caseData.id,
        cliente: caseData.cliente,
        siniestro: caseData.siniestro,
        demandados: caseData.demandados,
        clasificacionFinal: caseData.clasificacionFinal,
    };
};

/**
 * Serializa datos de caso a JSON string
 */
export const serializeCaseData = (caseData: FormDataState): string => {
    const normalized = normalizeCaseData(caseData);
    return JSON.stringify(normalized);
};

export { resolveProvinciaId, toRecordIdArray };
