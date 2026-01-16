## Refactorización de la Pantalla de Casos - Desacoplamiento

### Cambios realizados:

Se han desacoplado los componentes de la pantalla "Casos" (Dashboard) en múltiples componentes reutilizables y mantenibles:

### Nuevos componentes creados:

1. **[CaseFilters.tsx](components/CaseFilters.tsx)**
   - Gestiona la barra de búsqueda y filtros
   - Props:
     - `searchQuery`: string
     - `onSearchChange`: (value: string) => void
     - `filters`: objeto con areaPolicial, lesiones, reclamo
     - `onFilterChange`: manejador de cambios en filtros
     - `onResetFilters`: limpia todos los filtros

2. **[CaseCard.tsx](components/CaseCard.tsx)**
   - Tarjeta individual de cada caso
   - Muestra nombre, DNI y fecha del hecho
   - Botones de: Ver Detalles, Editar, Eliminar
   - Props:
     - `caseData`: FormDataState
     - `onViewDetails`: abre modal de detalles
     - `onEdit`: abre editor del caso
     - `onDelete`: abre confirmación de eliminación

3. **[CaseDetailsModal.tsx](components/CaseDetailsModal.tsx)**
   - Modal con detalles completos del caso
   - Secciones de: Cliente, Siniestro, Lesiones, Clasificación Final
   - Integra los botones de Generar Resumen e IA y Convenio
   - Props:
     - `isOpen`: boolean
     - `selectedCase`: FormDataState | null
     - `summary`, `isSummarizing`, `summaryError`
     - Callbacks para generar resumen y convenio

4. **[CaseSummarySection.tsx](components/CaseSummarySection.tsx)**
   - Sección reutilizable para mostrar resumen con IA
   - Botón de generación con loading spinner
   - Muestra resumen cuando está disponible
   - Props:
     - `summary`: string
     - `isSummarizing`: boolean
     - `summaryError`: string | null
     - `onGenerateSummary`: callback

5. **[CaseConvenioModal.tsx](components/CaseConvenioModal.tsx)**
   - Modal para mostrar y gestionar convenios de honorarios
   - Textarea de solo lectura con el contenido
   - Botones de: Copiar, Imprimir
   - Props:
     - `isOpen`: boolean
     - `convenioText`: string
     - `onClose`, `onCopy`, `onPrint`: callbacks
     - `copyButtonText`: para feedback visual

6. **[DeleteConfirmationModal.tsx](components/DeleteConfirmationModal.tsx)**
   - Modal de confirmación antes de eliminar un caso
   - Muestra el nombre del caso a eliminar
   - Botones de: Cancelar, Eliminar
   - Props:
     - `isOpen`: boolean
     - `caseToDelete`: objeto con datos del caso
     - `onConfirm`, `onCancel`: callbacks

### Refactorización de Dashboard.tsx:

- Se eliminó el código duplicado de modales y UI
- Se importan los 6 nuevos componentes
- La lógica de estado y handlers se mantiene igual
- El componente ahora es más legible y enfocado en orquestación
- Tamaño del archivo reducido de 369 líneas a 211 líneas

### Ventajas de esta refactorización:

✅ **Mayor mantenibilidad**: Cada componente tiene una responsabilidad clara
✅ **Reusabilidad**: Los componentes pueden usarse en otros contextos
✅ **Testing más fácil**: Componentes más pequeños son más testables
✅ **Mejor rendimiento**: Componentes más pequeños se actualizan de forma más eficiente
✅ **Código más limpio**: Dashboard se enfoca en orquestación, no en UI
✅ **Escalabilidad**: Fácil de agregar nuevas características a componentes específicos

### Estructura de archivos:

```
components/
├── Dashboard.tsx (orquestador principal - 211 líneas)
├── CaseFilters.tsx (búsqueda y filtros)
├── CaseCard.tsx (tarjeta individual)
├── CaseDetailsModal.tsx (modal con detalles)
├── CaseSummarySection.tsx (sección de resumen)
├── CaseConvenioModal.tsx (modal de convenio)
└── DeleteConfirmationModal.tsx (confirmación de eliminación)
```

### Cómo están conectados:

```
Dashboard (estado y handlers)
├── CaseFilters → search y filtros
├── CaseCard[] → lista de casos
├── CaseDetailsModal
│   ├── Detalles del cliente
│   ├── Detalles del siniestro
│   ├── Detalles de lesiones
│   ├── Clasificación final
│   └── CaseSummarySection
├── CaseConvenioModal
└── DeleteConfirmationModal
```

### Funcionalidad preservada:

- ✅ Búsqueda por nombre y DNI
- ✅ Filtros por Área Policial, Lesiones y Reclamo
- ✅ Vista de detalles del caso
- ✅ Generación de Resumen con IA
- ✅ Generación de Convenio de Honorarios
- ✅ Copiar convenio al portapapeles
- ✅ Imprimir convenio
- ✅ Editar caso
- ✅ Eliminar caso (con confirmación)
- ✅ Limpiar filtros
- ✅ Ordenar casos por más recientes

Toda la funcionalidad se mantiene intacta mientras se mejora significativamente la estructura del código.
