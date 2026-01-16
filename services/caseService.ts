import type { FormDataState } from '../types';

const CASO_API_URL = 'https://ra8knaldjd.execute-api.us-east-2.amazonaws.com/prod/caso';

interface CaseSubmissionResponse {
  success: boolean;
  message?: string;
  caseId?: string | number;
  error?: string;
}

/**
 * Envía un caso al servidor
 * Estructura anidada: cliente: {..}, siniestro: {...}, demandados: {...}
 * Arrays van como arrays, strings como strings
 */
export const submitCase = async (caseData: FormDataState): Promise<CaseSubmissionResponse> => {
  try {
    const response = await fetch(CASO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(caseData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    return {
      success: true,
      ...data,
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
