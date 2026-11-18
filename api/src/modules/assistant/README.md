# Asistente AF

El asistente usa el catálogo de operaciones de `assistant.operations.ts` como contrato de la API. El modelo puede conversar, consultar varias operaciones en secuencia y responder a partir de los resultados. No hay reglas que relacionen frases del usuario con endpoints concretos. El método, la ruta y el esquema de cada operación vienen del catálogo; los parámetros que propone el modelo se validan con Zod antes de llamar a la API de Tokyo con el token del administrador.

`assistant.agent.ts` controla un máximo de cinco turnos del modelo y ocho llamadas a operaciones por mensaje. Cada consulta devuelve datos acotados al modelo. Los pedidos se reducen a conteos por estado, sin datos del cliente. La interfaz envía hasta seis mensajes recientes para permitir preguntas de seguimiento. Gemini requiere `GEMINI_API_KEY`; si falta o no responde, el asistente lo indica en vez de fingir una respuesta.

Las consultas se ejecutan de inmediato. Una operación de escritura solo genera una vista previa y un registro pendiente durante diez minutos. `/confirm` ejecuta el cambio; `/cancel` lo descarta. El registro se reclama de forma atómica para evitar una doble confirmación. No se ofrecen endpoints de eliminación, autenticación, carga de archivos ni creación pública de pedidos.

## Configuración

- `GEMINI_API_KEY`: clave del modelo, necesaria para el asistente.
- `GEMINI_MODEL` o `ASSISTANT_MODEL`: modelo de Gemini; por defecto `gemini-3.1-flash-lite`.
- `ASSISTANT_DAILY_TOKEN_BUDGET`: presupuesto diario aproximado de tokens; por defecto `100000`.
- `ASSISTANT_API_BASE_URL`: base interna de la API, por ejemplo `http://127.0.0.1:4000/api`. Si falta, se usa `PORT` o `4000` en loopback.

Para ampliar capacidades, registrar en `assistant.operations.ts` el endpoint permitido, la descripción y el esquema Zod. `assistant.executor.ts` prepara la llamada, limita los datos que vuelven al modelo y confirma las escrituras. Los cambios deben marcarse con `write: true`. No hace falta agregar ejemplos de frases ni condiciones específicas al agente.

Verificación: desde `api`, ejecutar `npm run build` y `node --test tests/assistant.operations.test.cjs`.
