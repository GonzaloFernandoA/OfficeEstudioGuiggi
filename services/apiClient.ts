/**
 * ApiClient - Cliente genérico para comunicación con API
 * Envía JSON directamente con POST a cualquier endpoint
 */

export interface ApiResponse<T = any> {
    status: number;
    statusText: string;
    data?: T;
    error?: string;
}

export class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string = '/api') {
        this.baseUrl = baseUrl;
    }

    // Método genérico GET
    async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;

        try {
            console.log(`🔹 GET ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            const responseText = await response.text();
            console.log(`📊 Status: ${response.status}`, response.statusText);

            if (!response.ok) {
                console.error('❌ Error Response (GET):', responseText);
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            let data: T | undefined;
            try {
                data = responseText ? JSON.parse(responseText) : undefined;
            } catch {
                data = responseText as T;
            }

            console.log('✅ Success (GET):', data);

            return {
                status: response.status,
                statusText: response.statusText,
                data,
            };
        } catch (error) {
            let errorMessage = 'Error desconocido';

            if (error instanceof TypeError) {
                errorMessage = 'No se puede conectar a la API (GET). Verifica que el servidor esté ejecutándose.';
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            console.error('🔴 Error (GET):', errorMessage);

            return {
                status: 500,
                statusText: 'Error',
                error: errorMessage,
            };
        }
    }

    /**
     * Envía un JSON con POST a un endpoint
     * @param endpoint - Ruta del endpoint (ej: '/contactos')
     * @param payload - Objeto JSON a enviar
     * @returns Promesa con la respuesta
     */
    async post<T = any>(endpoint: string, payload: Record<string, any>): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;

        try {
            console.log(`🔹 POST ${url}`, payload);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const responseText = await response.text();
            console.log(`📊 Status: ${response.status}`, response.statusText);

            if (!response.ok) {
                console.error('❌ Error Response:', responseText);
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            let data: T | undefined;
            try {
                data = responseText ? JSON.parse(responseText) : undefined;
            } catch {
                data = responseText as T;
            }

            console.log('✅ Success:', data);

            return {
                status: response.status,
                statusText: response.statusText,
                data,
            };
        } catch (error) {
            let errorMessage = 'Error desconocido';

            if (error instanceof TypeError) {
                errorMessage = 'No se puede conectar a la API. Verifica que el servidor esté ejecutándose.';
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            console.error('🔴 Error:', errorMessage);

            return {
                status: 500,
                statusText: 'Error',
                error: errorMessage,
            };
        }
    }
}

// Instancia global del cliente API
// Preferir variable de entorno VITE_API_BASE_URL (Vite) y caer a un valor por defecto
const API_BASE_URL = (import.meta as any)?.env?.VITE_API_BASE_URL || 'https://ra8knaldjd.execute-api.us-east-2.amazonaws.com/prod';

export const apiClient = new ApiClient(API_BASE_URL);