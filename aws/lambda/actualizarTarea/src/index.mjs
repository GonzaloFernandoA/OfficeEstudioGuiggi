import { updateRecord, getRecord, queryByGSI } from './dataLayer.mjs';
import { SFNClient, SendTaskSuccessCommand } from "@aws-sdk/client-sfn";

const sfnClient = new SFNClient({ region: "us-east-2" });

const ESTADOS_VALIDOS = ["EN_CURSO", "COMPLETADA", "VENCIDA", "PENDIENTE"];

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "PATCH,POST,OPTIONS"
};

const response = (statusCode, body) => ({
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body)
});

export const handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    if (event.httpMethod === 'OPTIONS') {
        return response(200, { message: 'OK' });
    }

    // Obtener taskId de la URL
    const taskId = event.pathParameters?.IdTarea;
    if (!taskId) {
        return response(400, { message: "El parámetro IdTarea es obligatorio" });
    }

    // Extraer caseId y flujoId del taskId (formato: dni_flujoId_codigo)
    const partes = taskId.split('_');
    if (partes.length < 3) {
        return response(400, { message: "Formato de taskId inválido. Se esperaba dni_flujoId_codigo" });
    }
    const caseId  = partes[0];
    const flujoId = partes[1];

    // Parsear body
    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch {
        return response(400, { message: "El body no es un JSON válido" });
    }

    const { estado, comentario, duracion } = body;
    const esSoloComentario = event.path?.endsWith('/comentarios');

    // Validaciones
    if (esSoloComentario) {
        // En /comentarios solo es obligatorio el comentario,
        // pero también se puede actualizar duracion opcionalmente
        if (!comentario || comentario.trim() === '') {
            return response(400, { message: "El campo 'comentario' es obligatorio" });
        }
    } else {
        // En PATCH debe venir al menos estado o comentario o duracion
        if (!estado && !comentario && duracion === undefined) {
            return response(400, { message: "Debe proporcionar al menos 'estado', 'comentario' o 'duracion'" });
        }
        if (estado && !ESTADOS_VALIDOS.includes(estado)) {
            return response(400, { message: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(", ")}` });
        }
        if (duracion !== undefined && (isNaN(duracion) || duracion < 0)) {
            return response(400, { message: "El campo 'duracion' debe ser un número positivo" });
        }
    }

    try {
        // Obtener tarea actual
        const tarea = await getRecord("GestionTareas", { caseId, taskId });
        if (!tarea) {
            return response(404, { message: `Tarea ${taskId} no encontrada` });
        }

        const fechaActual = new Date().toISOString();
        const atributosAActualizar = {};

        if (esSoloComentario) {
            // /comentarios → actualiza comentario y opcionalmente duracion
            atributosAActualizar.comentario = comentario.trim();
            if (duracion !== undefined && duracion !== null) {
                atributosAActualizar.duracion = duracion;
            }
        } else {
            // PATCH → actualiza lo que venga
            if (estado) {
                atributosAActualizar.estado = estado;
                if (estado === 'EN_CURSO' && !tarea.fecha_inicio) {
                    atributosAActualizar.fecha_inicio = fechaActual;
                }
                if (estado === 'COMPLETADA' || estado === 'VENCIDA') {
                    atributosAActualizar.fecha_fin = fechaActual;
                }
            }
            if (comentario && comentario.trim() !== '') {
                atributosAActualizar.comentario = comentario.trim();
            }
            if (duracion !== undefined && duracion !== null) {
                atributosAActualizar.duracion = duracion;
            }
        }

        // 1. Actualizar tarea actual
        await updateRecord("GestionTareas", { caseId, taskId }, atributosAActualizar);
        console.log(`Tarea ${taskId} actualizada:`, atributosAActualizar);

        // 2. Si se COMPLETA → buscar y abrir la siguiente tarea del mismo flujo
        let siguienteTarea = null;
        if (estado === 'COMPLETADA') {

            const ordenActual = parseInt(tarea.orden);

            const todasLasTareas = await queryByGSI(
                "GestionTareas",
                "caseId-index",
                "caseId",
                caseId
            );

            const siguiente = todasLasTareas.find(t =>
                t.flujo === flujoId &&
                parseInt(t.orden) === ordenActual + 1
            );

            if (siguiente) {
                await updateRecord(
                    "GestionTareas",
                    { caseId, taskId: siguiente.taskId },
                    {
                        estado: "EN_CURSO",
                        fecha_inicio: fechaActual
                    }
                );
                siguienteTarea = siguiente.taskId;
                console.log(`Siguiente tarea abierta: ${siguiente.taskId}`);
            } else {
                console.log(`No hay siguiente tarea en flujo ${flujoId}, flujo completado.`);
            }

            // 3. Notificar Step Functions si tiene token
            if (tarea.sfnToken) {
                await sfnClient.send(new SendTaskSuccessCommand({
                    taskToken: tarea.sfnToken,
                    output: JSON.stringify({
                        comentario: comentario?.trim() || '',
                        fechaFin: fechaActual,
                        taskId,
                        caseId
                    })
                }));
            }
        }

        return response(200, {
            message: esSoloComentario
                ? `Comentario actualizado en tarea ${taskId}`
                : `Tarea ${taskId} actualizada correctamente`,
            taskId,
            caseId,
            flujoId,
            cambios: atributosAActualizar,
            ...(siguienteTarea && { siguienteTareaAbierta: siguienteTarea }),
            ...(!siguienteTarea && estado === 'COMPLETADA' && { flujoCompletado: true })
        });

    } catch (error) {
        console.error("Error al actualizar tarea:", error);

        if (error.name === 'ResourceNotFoundException') {
            return response(404, { message: "Tarea no encontrada en DynamoDB" });
        }
        if (error.name === 'TaskDoesNotExist' || error.name === 'InvalidToken') {
            return response(422, { message: "El token de Step Functions es inválido o ya expiró" });
        }
        if (error.name === 'ProvisionedThroughputExceededException') {
            return response(429, { message: "Demasiadas solicitudes, intente nuevamente" });
        }

        return response(500, {
            message: "Error interno al actualizar la tarea",
            detalle: error.message
        });
    }
};