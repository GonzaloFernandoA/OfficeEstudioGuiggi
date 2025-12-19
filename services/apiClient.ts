/**
 * ApiClient - Cliente genérico para comunicación con API
 * Proporciona métodos reutilizables para hacer peticiones HTTP
 */

export interface ApiResponse<T = any> {
    status: number;
    statusText: string;
    data?: T;
    error?: string;
}

export interface ApiErrorResponse {
    status: number;
    message: string;
    body?: string;
}

export class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string = '/api') {
        this.baseUrl = baseUrl;
    }

    /**
     * Realiza una petición genérica a la API
     * @param endpoint - Ruta del endpoint (ej: '/contactos')
     * @param method - Método HTTP (GET, POST, PUT, DELETE, etc.)
     * @param payload - Datos a enviar (opcional)
     * @returns Promesa con la respuesta
     */
    private async request<T = any>(
        endpoint: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
        payload?: Record<string, any>
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;
        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (payload && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(this.trimPayload(payload));
        }

        try {
            console.log(`🔹 [${method}] ${url}`, payload);

            const response = await fetch(url, options);
            const responseText = await response.text();

            console.log(`📊 Status: ${response.status}`, response.statusText);

            if (!response.ok) {
                console.error('❌ Error Response:', responseText);
                throw {
                    status: response.status,
                    message: `Error ${response.status}: ${response.statusText}`,
                    body: responseText,
                } as ApiErrorResponse;
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

            if (typeof error === 'object' && error !== null && 'message' in error) {
                errorMessage = (error as ApiErrorResponse).message;
            } else if (error instanceof TypeError) {
                errorMessage = 'No se puede conectar a la API. Verifica que el servidor esté ejecutándose.';
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            console.error('🔴 Request Error:', errorMessage);

            return {
                status: 500,
                statusText: 'Error',
                error: errorMessage,
            };
        }
    }

    /**
     * Limpia espacios en blanco de todos los campos string del payload
     */
    private trimPayload(payload: Record<string, any>): Record<string, any> {
        const trimmed: Record<string, any> = {};
        for (const [key, value] of Object.entries(payload)) {
            trimmed[key] = typeof value === 'string' ? value.trim() : value;
        }
        return trimmed;
    }

    /**
     * Realiza un GET
     */
    async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, 'GET');
    }

    /**
     * Realiza un POST
     */
    async post<T = any>(endpoint: string, payload: Record<string, any>): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, 'POST', payload);
    }

    /**
     * Realiza un PUT
     */
    async put<T = any>(endpoint: string, payload: Record<string, any>): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, 'PUT', payload);
    }

    /**
     * Realiza un DELETE
     */
    async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, 'DELETE');
    }
}

// Instancia global del cliente API
export const apiClient = new ApiClient();