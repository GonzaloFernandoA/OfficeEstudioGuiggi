import type { FormDataState } from '../types';
import { apiClient } from './apiClient';
import { normalizeCaseData } from './jsonService';

interface CaseSubmissionResponse {
  success: boolean;
  message?: string;
  caseId?: string | number;
  error?: string;
}

/**
 * Obtiene un caso por su identificador
 * Usa apiClient.get y devuelve directamente el objeto de caso del backend
 */
export const getCaseById = async (caseId: string | number): Promise<FormDataState | null> => {
  try {
    // armamos el endpoint agregando el id al recurso de casos
    const endpoint = `/caso/${caseId}`;
    const response = await apiClient.get<FormDataState>(endpoint);

    if (response.error) {
      throw new Error(response.error);
    }

    // Si tu backend devuelve otra forma, acá podrías normalizar antes de retornar
    return response.data as FormDataState;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener el caso';
    console.error('Error obteniendo caso por id:', caseId, '-', errorMessage);
    return null;
  }
};

/**
 * Envía un caso al servidor
 * Utiliza el mismo apiClient que Ingreso para consistencia
 * Estructura anidada: cliente: {..}, siniestro: {...}, demandados: {...}
 */
export const submitCase = async (caseData: FormDataState): Promise<CaseSubmissionResponse> => {
  try {
    const normalizedData = normalizeCaseData(caseData);
    const response = await apiClient.post<any>('/caso', normalizedData);

    if (response.error) {
      throw new Error(response.error);
    }

    return {
      success: true,
      ...response.data,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al enviar el caso';
    console.error('Error submitiendo caso:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Valida que los datos esenciales del caso estén presentes antes de enviar
 */
export const validateCaseForSubmission = (caseData: FormDataState): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!caseData.cliente?.nombreCompleto?.trim()) {
    errors.push('Nombre del cliente requerido');
  }
  if (!caseData.cliente?.dni?.trim()) {
    errors.push('DNI del cliente requerido');
  }
  if (!caseData.siniestro?.fechaHecho?.trim()) {
    errors.push('Fecha del hecho requerida');
  }
  if (!caseData.demandados?.conductor?.nombreApellido?.trim()) {
    errors.push('Nombre del conductor demandado requerido');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Elimina un caso por DNI utilizando método DELETE sobre /caso/{dni}
 */
export const deleteCaseByDni = async (dni: string | number): Promise<{ success: boolean; error?: string }> => {
  try {
    const endpoint = `/caso/${dni}`;
    const response = await apiClient.delete<any>(endpoint);

    if (response.error) {
      throw new Error(response.error);
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al eliminar el caso';
    console.error('Error eliminando caso por DNI:', dni, '-', errorMessage);
    return { success: false, error: errorMessage };
  }
};
