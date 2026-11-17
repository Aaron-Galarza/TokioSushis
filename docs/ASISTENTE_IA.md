# Asistente IA

Rama de trabajo: `AsistenteIA`. Esta rama parte de `main` y contiene únicamente el experimento del asistente administrativo.

## Estado actual

El asistente consulta productos, categorías, cupones, pedidos, ventas entregadas y productos más vendidos mediante herramientas de lectura del backend. Si se configura `GEMINI_API_KEY`, Gemini puede solicitar esas herramientas; si falla, hay respuestas locales limitadas. También permite preparar un cupón y exige confirmación antes de crearlo. El acceso requiere un administrador autenticado.

El backend registra uso de tokens, latencia y costo estimado en `assistant_usage_daily` y `assistant_usage_events`. El presupuesto diario se configura con `ASSISTANT_DAILY_TOKEN_BUDGET`.

## Límites conocidos

Las consultas de pedidos usan períodos simples (1, 7, 30 o 90 días). Todavía no hay consulta de todo el histórico ni memoria de conversación; algunas expresiones se interpretan con reglas por palabras clave. El chat no crea productos. El costo registrado es una estimación y la cuota real la establece el proveedor.

## Ejecución

Desde `api`, instalar dependencias con `npm ci`, configurar `MONGO_URI`, `JWT_SECRET` y opcionalmente `GEMINI_API_KEY` y `GEMINI_MODEL`, y ejecutar `npm run dev`. Desde `web`, instalar con `npm ci`, configurar `NEXT_PUBLIC_API_URL` y ejecutar `npm run dev`.

Las consultas de lectura utilizan la base configurada en la API. Usar una base de pruebas para experimentar con la confirmación de cupones.
