import { apiClient } from './apiClient';

export interface Tarea {
    dni: string;
    nombre: string;
    apellido: string;
    taskId: string;    // id de la tarea, usado para PATCH /tareas/{taskId}
    flow_id: string;
    code: string;      // alias interno
    codigo: string;    // campo real devuelto por la API
    description: string;
    status: string;
    fecha_inicio: string;
    fecha_fin: string;
    is_completed: boolean;
    comments: string;
    updated_at: string;
    duracion?: number;
}

// Nueva estructura del backend: objeto con claves de flujo y arrays de tareas
export interface TareaFlow {
    orden: number;
    codigo: string;
    taskId: string;
    estado: string;
    fecha_inicio: string;
    fecha_fin?: string;
    comentario?: string;
    duracion?: number;
}

export type TareasFlowResponse = Record<string, TareaFlow[]>;

export interface TareaUpdatePayload {
    status: string;
    comments: string;
}

export interface TareaUpdateResult {
    success: boolean;
    error?: string;
}

export const getTareas = async (status: string = 'EN_CURSO'): Promise<Tarea[]> => {
    const response = await apiClient.get<Tarea[]>(`/tareas?status=${status}`);

    if (response.error) {
        throw new Error(response.error);
    }

    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Obtiene las tareas en formato de flujo agrupado por tipo (nueva estructura del backend)
 * @param dni - DNI del caso (opcional). Si se pasa, filtra las tareas de ese caso.
 * Retorna un objeto con claves (ej: "MEDICO") y arrays de TareaFlow
 */
export const getTareasFlow = async (dni?: string): Promise<TareasFlowResponse> => {
    const query = dni ? `?caseId=${encodeURIComponent(dni)}` : '';
    const response = await apiClient.get<TareasFlowResponse>(`/tareas?caseId=${dni}`) //  ;${query}`);

    if (response.error) {
        throw new Error(response.error);
    }

    // Verificar si la respuesta es un objeto con claves (nueva estructura)
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        return response.data as TareasFlowResponse;
    }

    return {};
};

export interface FlowTarea {
    dni: string;
    nombre: string;
    apellido: string;
    flow_id: string;
    code: string;
    description: string;
    status: string;
    fecha_inicio: string;
    fecha_fin: string;
    is_completed: boolean;
    comments: string;
    updated_at: string;
    step: number;
}

/**
 * Obtiene todas las tareas (flows) asociadas a un DNI
 * @param dni - DNI del cliente
 */
export const getFlowsByDni = async (dni: string): Promise<FlowTarea[]> => {
    const response = await apiClient.get<FlowTarea[]>(`/tareas?caseId=${encodeURIComponent(dni)}`);

    if (response.error) {
        if (response.error.includes('404')) return [];
        throw new Error(response.error);
    }

    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Actualiza el estado, comentario y duración de una tarea.
 * PATCH /tareas/{idTarea}  →  { comentarios, estado, duracion }
 */
export const cambiarEstadoTarea = async (
    idTarea: string,
    comentario: string,
    estado: string,
    duracion?: number,
): Promise<TareaUpdateResult> => {
    try {
        const response = await apiClient.patch<any>(
            `/tareas/${encodeURIComponent(idTarea)}`,
            { comentarios: comentario, estado, duracion },
        );

        if (response.error) {
            throw new Error(response.error);
        }

        return { success: true };
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : 'Error desconocido al cambiar el estado';
        console.error('Error en cambiarEstadoTarea:', errorMessage);
        return { success: false, error: errorMessage };
    }
};

export const updateTarea = async (
    tarea: Tarea,
    payload: TareaUpdatePayload
): Promise<TareaUpdateResult> => {
    try {
        const response = await apiClient.post<any>('/tareas', {
            flow_id: tarea.flow_id,
            code: tarea.code,
            dni: tarea.dni,
            ...payload,
        });

        if (response.error) {
            throw new Error(response.error);
        }

        return { success: true };
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : 'Error desconocido al actualizar la tarea';
        console.error('Error actualizando tarea:', errorMessage);
        return { success: false, error: errorMessage };
    }
};
