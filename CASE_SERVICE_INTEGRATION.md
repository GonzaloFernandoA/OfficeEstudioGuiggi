# Integración de Envío de Casos - Case Service

## Descripción

Se ha implementado la funcionalidad para enviar los casos ingresados en el formulario al endpoint especificado.

## Endpoint

```
POST https://ra8knaldjd.execute-api.us-east-2.amazonaws.com/prod/caso
```

## Estructura de Datos

El body se envía en formato anidado, tal como indicó Gon:

```json
{
  "id": 1704067200000,
  "cliente": {
    "nombreCompleto": "Juan Pérez",
    "dni": "12345678",
    "fechaNacimiento": "1990-05-15",
    "estadoCivil": "Soltero",
    "domicilio": "Calle Principal 123",
    "localidad": "Capital",
    "provincia": "Mendoza",
    "telefono": "2615551234",
    "mail": "juan@example.com",
    "...": "..."
  },
  "siniestro": {
    "lugarHecho": "Esquina de calles",
    "fechaHecho": "2024-01-15",
    "horaHecho": "14:30",
    "...": "..."
  },
  "demandados": {
    "conductor": { "..." },
    "titular": { "..." },
    "asegurado": { "..." },
    "vehiculo": { "..." },
    "companiaSeguros": { "..." },
    "danosMateriales": { "..." }
  },
  "vehiculoCliente": { "..." },
  "danosMateriales": { "..." },
  "lesiones": { "..." },
  "testigos": { "..." },
  "clasificacionFinal": { "..." }
}
```

## Características

### 1. **Estructura Anidada**
- `cliente`: Datos del cliente principal
- `siniestro`: Información del evento
- `demandados`: Datos del demandado con subcategorías
- `vehiculoCliente`: Vehículo del cliente
- `testigos`: Array de testigos
- `clasificacionFinal`: Clasificación final del caso

### 2. **Arrays Correctamente Tipados**
- `zonasAfectadas`: Array de strings
- `testigos`: Array de objetos Testigo
- `danosMateriales.zonas`: Array de strings
- Provincias: String (no array)

### 3. **Validación Previa**
Antes de enviar, se valida que los campos esenciales estén presentes:
- Nombre del cliente
- DNI del cliente
- Fecha del hecho
- Nombre del conductor demandado

## Flujo de Envío

1. **Usuario submite el formulario**
2. **Validación local** de campos obligatorios
3. **Validación adicional** con `validateCaseForSubmission()`
4. **Envío al endpoint** con `submitCase()`
5. **Feedback visual** con estado "Enviando..."
6. **Confirmación** del éxito o error
7. **Guardado local** en localStorage (si el envío es exitoso)
8. **Redirección** al tablero de casos

## Manejo de Errores

- **Errores de validación**: Se muestran en un alert
- **Errores de red**: Se capturan y reportan
- **Errores del servidor**: Se muestran los mensajes de respuesta
- **Recovery**: El botón se habilita nuevamente en caso de error

## Archivo de Servicio

**Ubicación**: `services/caseService.ts`

### Funciones Exportadas:

#### `submitCase(caseData: FormDataState)`
Envía el caso al servidor
- **Parámetros**: Objeto FormDataState con todos los datos del caso
- **Retorna**: `CaseSubmissionResponse` con `success`, `caseId` y posibles errores
- **Manejo de errores**: Captura y reporta problemas en la request

#### `validateCaseForSubmission(caseData: FormDataState)`
Valida que los datos esenciales estén presentes
- **Parámetros**: Objeto FormDataState
- **Retorna**: `{ valid: boolean; errors: string[] }`

## Cambios en App.tsx

### Imports agregados:
```tsx
import { submitCase, validateCaseForSubmission } from './services/caseService';
```

### Modificación del `handleSubmit`:
- Se mantiene la actualización local en localStorage
- Se agrega envío al servidor para casos nuevos
- Se valida antes de enviar
- Se muestra feedback visual (botón deshabilitado con texto "Enviando...")
- Se restaura el estado del botón después del envío

## Comportamiento

### Casos Nuevos:
1. Se valida el formulario
2. Se valida con `validateCaseForSubmission()`
3. Se envía al servidor
4. Se guarda localmente en localStorage
5. Se muestra ID del caso devuelto por el servidor (o ID local)

### Casos en Edición:
- Se actualiza solo en localStorage (sin envío al servidor)
- Se mantiene el comportamiento original

## Testing

Para probar la integración:

1. Llenar completamente el formulario de "Nuevo Caso"
2. Hacer click en "Ingresar Caso"
3. Esperar a que se complete el envío (verá "Enviando...")
4. Recibirá confirmación con el ID del caso
5. Será redirigido al tablero

## Seguridad

⚠️ **Nota**: El endpoint acepta los datos tal como se envían. Para la producción, considerar:
- Agregar autenticación/headers de autorización
- Sanitizar datos en el servidor
- Validar tipos de datos
- Implementar rate limiting

## Próximas Mejoras Posibles

- [ ] Agregar autenticación al endpoint
- [ ] Implementar reintentos automáticos en caso de fallo
- [ ] Agregar progreso de envío para uploads grandes
- [ ] Sincronización bidireccional (pull de casos desde servidor)
- [ ] Almacenamiento en caché para casos sin conectividad
- [ ] Auditoría de cambios de casos
