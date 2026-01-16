/**
 * jsonService - Servicio compartido para normalizar y serializar datos JSON
 * Centraliza la lógica de transformación de datos para Ingreso y Casos
 */

import type { FormDataState } from '../types';
import { geographicService } from './geographicService';

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
