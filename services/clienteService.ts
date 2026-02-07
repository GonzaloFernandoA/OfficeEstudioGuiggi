import { apiClient, ApiResponse } from './apiClient';

/**
 * ClienteService - Servicio para operaciones relacionadas con "cliente"
 * Usa la API base configurada en apiClient (VITE_API_BASE_URL + '/cliente').
 */

export interface ClienteApiResponse {
    // Estructura típica Airtable: { records: [{ fields: {...} }] }
    records?: Array<{
        id?: string;
        fields?: Record<string, any>;
    }>;
    // Permite campos adicionales por si el backend devuelve más información
    [key: string]: any;
}

/**
 * Obtiene un cliente por DNI usando apiClient.get.
 * Hace un GET a `/cliente/{dni}` sobre la base URL del apiClient.
 */
export const getClienteByDni = async (dni: string): Promise<ApiResponse<ClienteApiResponse>> => {
    const cleanDni = String(dni || '').trim();
    if (!cleanDni) {
        return {
            status: 400,
            statusText: 'Bad Request',
            error: 'DNI vacío',
        };
    }

    const endpoint = `/cliente/${encodeURIComponent(cleanDni)}`;
    console.log('[clienteService] getClienteByDni endpoint =', endpoint);

    const response = await apiClient.get<ClienteApiResponse>(endpoint);
    console.log('[clienteService] Respuesta getClienteByDni =', response);

    return response;
};
