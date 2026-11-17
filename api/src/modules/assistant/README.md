# Asistente AF

El asistente convierte un mensaje en **una operación del catálogo** (`assistant.operations.ts`). Gemini solo propone el nombre y un JSON; nunca el método o la URL. El servidor valida los parámetros con Zod, resuelve nombres a IDs cuando hace falta y llama a la API de Tokyo con el token del administrador. La respuesta visible se forma con el resultado real del endpoint.

Las consultas se ejecutan de inmediato. Los cambios generan una vista previa y un registro pendiente durante diez minutos. Solo `/confirm` ejecuta el cambio; `/cancel` lo descarta. El registro se reclama de forma atómica para evitar una doble confirmación. No se habilitan endpoints de eliminación, autenticación, carga de archivos ni creación pública de pedidos desde el asistente.

## Configuración

- `GEMINI_API_KEY`: habilita el planificador de lenguaje natural. Sin clave queda disponible un conjunto básico de consultas y el borrador de cupones mediante reglas locales.
- `GEMINI_MODEL` o `ASSISTANT_MODEL`: modelo de Gemini; por defecto `gemini-3.1-flash-lite`.
- `ASSISTANT_DAILY_TOKEN_BUDGET`: presupuesto diario aproximado de tokens; por defecto `100000`.
- `ASSISTANT_API_BASE_URL`: base interna de la API, por ejemplo `http://127.0.0.1:4000/api`. Si falta, se usa `PORT` o `4000` en loopback.

Para agregar una operación, registrar en `assistant.operations.ts` el método, ruta fija, esquema de entrada y descripción para el planificador. La ruta debe existir en la API y aplicar sus propios controles. Las escrituras deben marcarse con `write: true`; el ejecutor exigirá confirmación. Agregar una representación breve del resultado en `assistant.executor.ts` cuando la respuesta genérica no alcance.

Verificación: desde `api`, ejecutar `npm run build` y `node --test tests/assistant.operations.test.cjs`.
