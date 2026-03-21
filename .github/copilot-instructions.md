# Instrucciones para GitHub Copilot

## Contexto del Proyecto
Este es un proyecto React + TypeScript para gestión de casos legales.

## Documentación de la API
- La documentación completa de la API de Tareas está en `/agentes/tareas.md`
- Base URL: https://ra8knaldjd.execute-api.us-east-2.amazonaws.com/prod
- Todos los endpoints están documentados con ejemplos de request/response

## Reglas de Código
- Usar TypeScript strict mode
- Usar async/await para llamadas a la API
- Manejar errores con try/catch
- Seguir la estructura de carpetas existente

## Servicios API
Al escribir código que interactúe con la API de tareas, consultar `/agentes/tareas.md` para:
- Endpoints disponibles
- Estructura de datos (interfaces Tarea, Comentario)
- Códigos de error
- Ejemplos de uso