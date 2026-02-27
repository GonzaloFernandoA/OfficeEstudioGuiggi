import { apiClient } from './apiClient';

export interface Tarea {
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
}

export interface TareaUpdatePayload {
    status: string;
    comments: string;
}

export interface TareaUpdateResult {
    success: boolean;
    error?: string;
}

export const getTareas = async (status: string = 'EN_PROGRESO'): Promise<Tarea[]> => {
    const response = await apiClient.get<Tarea[]>(`/tareas?status=${status}`);

    if (response.error) {
        throw new Error(response.error);
    }

    return Array.isArray(response.data) ? response.data : [];
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
    const response = await apiClient.get<FlowTarea[]>(`/flows/${encodeURIComponent(dni)}`);

    if (response.error) {
        if (response.error.includes('404')) return [];
        throw new Error(response.error);
    }

    return Array.isArray(response.data) ? response.data : [];
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
