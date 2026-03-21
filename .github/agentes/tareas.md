# API Tareas - Documentación Técnica

## Información General
- **Recurso ID:** uf0cdp
- **Base Path:** `/tareas`
- **API Gateway ID:** ra8knaldjd
- **Region:** us-east-2
- **Stage:** prod
- **Base URL:** `https://ra8knaldjd.execute-api.us-east-2.amazonaws.com/prod`

---

## Endpoints Disponibles

### 1. GET /tareas
Obtiene la lista de todas las tareas del sistema.

**Request:**
```http
GET /tareas HTTP/1.1
Host: ra8knaldjd.execute-api.us-east-2.amazonaws.com
```

**Response 200 OK:**
```json
[
  {
    "IdTarea": "string",
    "titulo": "string",
    "descripcion": "string",
    "estado": "string",
    "prioridad": "string",
    "fechaCreacion": "string",
    "asignadoA": "string"
  }
]
```

---

### 2. POST /tareas
Crea una nueva tarea en el sistema.

**Request:**
```http
POST /tareas HTTP/1.1
Host: ra8knaldjd.execute-api.us-east-2.amazonaws.com
Content-Type: application/json

{
  "titulo": "string",
  "descripcion": "string",
  "prioridad": "string",
  "asignadoA": "string",
  "fechaVencimiento": "string"
}
```

**Response 201 Created:**
```json
{
  "IdTarea": "string",
  "mensaje": "Tarea creada exitosamente"
}
```

---

### 3. DELETE /tareas
Elimina una o varias tareas del sistema.

**Request:**
```http
DELETE /tareas?IdTarea=TAREA123 HTTP/1.1
Host: ra8knaldjd.execute-api.us-east-2.amazonaws.com
```

**Query Parameters:**
- `IdTarea` (opcional): ID de la tarea a eliminar

**Response 200 OK:**
```json
{
  "mensaje": "Tarea eliminada exitosamente"
}
```

---

### 4. PATCH /tareas/{IdTarea}
Actualiza parcialmente una tarea existente.

**Path Parameters:**
- `IdTarea` (requerido): Identificador único de la tarea

**Request:**
```http
PATCH /tareas/TAREA123 HTTP/1.1
Host: ra8knaldjd.execute-api.us-east-2.amazonaws.com
Content-Type: application/json

{
  "titulo": "string",
  "descripcion": "string",
  "estado": "string",
  "prioridad": "string"
}
```

**Response 200 OK:**
```json
{
  "mensaje": "Tarea actualizada exitosamente",
  "IdTarea": "TAREA123"
}
```

---

### 5. POST /tareas/{IdTarea}/Finalizar
Marca una tarea como finalizada.

**Path Parameters:**
- `IdTarea` (requerido): Identificador único de la tarea

**Request:**
```http
POST /tareas/TAREA123/Finalizar HTTP/1.1
Host: ra8knaldjd.execute-api.us-east-2.amazonaws.com
Content-Type: application/json

{
  "comentarioFinal": "string",
  "resultado": "string"
}
```

**Response 200 OK:**
```json
{
  "mensaje": "Tarea finalizada exitosamente",
  "IdTarea": "TAREA123",
  "fechaFinalizacion": "2026-03-20T15:30:00Z"
}
```

---

### 6. POST /tareas/{IdTarea}/comentarios
Agrega un comentario a una tarea existente.

**Path Parameters:**
- `IdTarea` (requerido): Identificador único de la tarea

**Request:**
```http
POST /tareas/TAREA123/comentarios HTTP/1.1
Host: ra8knaldjd.execute-api.us-east-2.amazonaws.com
Content-Type: application/json

{
  "autor": "string",
  "comentario": "string",
  "fecha": "string"
}
```

**Response 201 Created:**
```json
{
  "mensaje": "Comentario agregado exitosamente",
  "IdComentario": "string",
  "IdTarea": "TAREA123"
}
```

---

### 7. OPTIONS /tareas
Maneja las solicitudes CORS preflight para el recurso de tareas.

**Request:**
```http
OPTIONS /tareas HTTP/1.1
Host: ra8knaldjd.execute-api.us-east-2.amazonaws.com
Origin: https://example.com
```

**Response 200 OK:**
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | Operación exitosa |
| 201 | Recurso creado exitosamente |
| 204 | Operación exitosa sin contenido |
| 400 | Solicitud inválida - Datos incorrectos |
| 401 | No autorizado - Token inválido o ausente |
| 403 | Prohibido - Sin permisos suficientes |
| 404 | Recurso no encontrado |
| 409 | Conflicto - El recurso ya existe |
| 500 | Error interno del servidor |
| 502 | Bad Gateway - Error de integración |
| 503 | Servicio no disponible |

---

## Modelos de Datos

### Tarea
```typescript
interface Tarea {
  IdTarea: string;           // Identificador único
  titulo: string;            // Título de la tarea
  descripcion: string;       // Descripción detallada
  estado: EstadoTarea;       // Estado actual
  prioridad: Prioridad;      // Nivel de prioridad
  fechaCreacion: string;     // ISO 8601 timestamp
  fechaVencimiento?: string; // ISO 8601 timestamp (opcional)
  asignadoA?: string;        // Usuario asignado (opcional)
  fechaFinalizacion?: string;// ISO 8601 timestamp (opcional)
}

type EstadoTarea = 'pendiente' | 'en_progreso' | 'finalizada' | 'cancelada';
type Prioridad = 'baja' | 'media' | 'alta' | 'urgente';
```

### Comentario
```typescript
interface Comentario {
  IdComentario: string;  // Identificador único
  IdTarea: string;       // ID de la tarea asociada
  autor: string;         // Nombre del autor
  comentario: string;    // Contenido del comentario
  fecha: string;         // ISO 8601 timestamp
}
```

---

## Ejemplos de Integración

### JavaScript/TypeScript (Fetch API)
```typescript
const API_BASE_URL = 'https://ra8knaldjd.execute-api.us-east-2.amazonaws.com/prod';

// Obtener todas las tareas
async function obtenerTareas() {
  const response = await fetch(`${API_BASE_URL}/tareas`);
  return await response.json();
}

// Crear nueva tarea
async function crearTarea(tarea: Partial<Tarea>) {
  const response = await fetch(`${API_BASE_URL}/tareas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tarea)
  });
  return await response.json();
}

// Actualizar tarea
async function actualizarTarea(idTarea: string, datos: Partial<Tarea>) {
  const response = await fetch(`${API_BASE_URL}/tareas/${idTarea}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  return await response.json();
}

// Finalizar tarea
async function finalizarTarea(idTarea: string, comentario?: string) {
  const response = await fetch(`${API_BASE_URL}/tareas/${idTarea}/Finalizar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comentarioFinal: comentario })
  });
  return await response.json();
}

// Agregar comentario
async function agregarComentario(idTarea: string, autor: string, comentario: string) {
  const response = await fetch(`${API_BASE_URL}/tareas/${idTarea}/comentarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ autor, comentario, fecha: new Date().toISOString() })
  });
  return await response.json();
}

// Eliminar tarea
async function eliminarTarea(idTarea: string) {
  const response = await fetch(`${API_BASE_URL}/tareas?IdTarea=${idTarea}`, {
    method: 'DELETE'
  });
  return await response.json();
}
```

### React Hook personalizado
```typescript
import { useState, useEffect } from 'react';

export function useTareas() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarTareas = async () => {
    setLoading(true);
    try {
      const data = await obtenerTareas();
      setTareas(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar tareas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTareas();
  }, []);

  return { tareas, loading, error, recargar: cargarTareas };
}
```

### cURL
```bash
# Obtener todas las tareas
curl -X GET https://ra8knaldjd.execute-api.us-east-2.amazonaws.com/prod/tareas

# Crear nueva tarea
curl -X POST https://ra8knaldjd.execute-api.us-east-2.amazonaws.com/prod/tareas \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Revisar documentación",
    "descripcion": "Verificar completitud de documentos",
    "prioridad": "alta",
    "asignadoA": "Juan Pérez"
  }'

# Actualizar tarea
curl -X PATCH https://ra8knaldjd.execute-api.us-east-2.amazonaws.com/prod/tareas/TAREA123 \
  -H "Content-Type: application/json" \
  -d '{ "estado": "en_progreso" }'

# Finalizar tarea
curl -X POST https://ra8knaldjd.execute-api.us-east-2.amazonaws.com/prod/tareas/TAREA123/Finalizar \
  -H "Content-Type: application/json" \
  -d '{ "comentarioFinal": "Completado exitosamente" }'

# Agregar comentario
curl -X POST https://ra8knaldjd.execute-api.us-east-2.amazonaws.com/prod/tareas/TAREA123/comentarios \
  -H "Content-Type: application/json" \
  -d '{
    "autor": "María López",
    "comentario": "Documentos verificados y aprobados"
  }'

# Eliminar tarea
curl -X DELETE "https://ra8knaldjd.execute-api.us-east-2.amazonaws.com/prod/tareas?IdTarea=TAREA123"
```

---

## Manejo de Errores

### Formato de Error Estándar
```json
{
  "error": "string",
  "mensaje": "string",
  "codigo": "string",
  "detalles": {}
}
```

### Errores Comunes

**400 Bad Request:**
```json
{
  "error": "Datos inválidos",
  "mensaje": "El campo 'titulo' es requerido",
  "codigo": "VALIDATION_ERROR"
}
```

**404 Not Found:**
```json
{
  "error": "Tarea no encontrada",
  "mensaje": "No existe una tarea con el ID especificado",
  "codigo": "NOT_FOUND"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Error interno",
  "mensaje": "Error al procesar la solicitud",
  "codigo": "INTERNAL_ERROR"
}
```

---

## Configuración CORS

El API Gateway está configurado para aceptar solicitudes desde cualquier origen:

- **Access-Control-Allow-Origin:** `*`
- **Access-Control-Allow-Methods:** `GET, POST, DELETE, PATCH, OPTIONS`
- **Access-Control-Allow-Headers:** `Content-Type, Authorization, X-Requested-With`

---

## Notas de Implementación

1. **Formato de fechas:** Todas las fechas deben estar en formato ISO 8601 (ej: `2026-03-20T15:30:00Z`)
2. **Autenticación:** Verificar si se requiere token de autenticación en headers
3. **Rate Limiting:** Consultar límites de requests por segundo/minuto
4. **Timeouts:** El timeout por defecto del API Gateway es de 29 segundos
5. **Tamaño máximo de payload:** 10 MB para requests

---

## Versionamiento

- **Versión actual:** 1.0
- **Última actualización:** 2026-03-20
- **Stage:** prod

---

## Contacto y Soporte

Para reportar problemas o solicitar nuevas funcionalidades, contactar al equipo de desarrollo.