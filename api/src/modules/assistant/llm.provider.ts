import { AssistantToolContext, AssistantToolName, runAssistantTool } from './assistant.tools';

type GeminiPart = { text?: string; functionCall?: { name: string; args?: Record<string, unknown> } };
type GeminiResponse = { candidates?: Array<{ content?: { parts?: GeminiPart[] } }> };
type Usage = { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };

const toolNames: AssistantToolName[] = [
  'list_products', 'list_categories', 'list_coupons',
  'get_orders_summary', 'get_sales_summary', 'get_top_products',
];

const declarations = toolNames.map((name) => ({
  name,
  description: name === 'get_sales_summary' ? 'Consulta ventas entregadas y ticket promedio del período.'
    : name === 'get_orders_summary' ? 'Resume pedidos por estado del período.'
    : name === 'get_top_products' ? 'Devuelve los cinco productos más vendidos del período.'
    : `Consulta ${name.replace(/_/g, ' ')}.`,
  parameters: { type: 'OBJECT', properties: { rangeDays: { type: 'INTEGER' } }, required: [] },
}));

const request = async (apiKey: string, model: string, body: unknown): Promise<GeminiResponse & { usageMetadata?: Usage }> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Gemini respondió ${response.status}`);
    return await response.json() as GeminiResponse;
  } finally { clearTimeout(timer); }
};

const reserveBudget = async (estimate: number) => {
  const db = (await import('mongoose')).default.connection.db;
  if (!db) return null;
  const budget = Number(process.env.ASSISTANT_DAILY_TOKEN_BUDGET ?? 100_000);
  const date = new Date().toISOString().slice(0, 10);
  try {
    const reserved = await db.collection('assistant_usage_daily').findOneAndUpdate(
      { date, $or: [{ reservedTokens: { $lte: budget - estimate } }, { reservedTokens: { $exists: false } }] },
      { $setOnInsert: { date }, $inc: { reservedTokens: estimate } },
      { upsert: true, returnDocument: 'after' },
    );
    if (!reserved) throw new Error('Presupuesto diario de IA agotado');
    return { db, date, estimate, budget };
  } catch (error) {
    if (error instanceof Error && error.message.includes('duplicate key')) throw new Error('No se pudo reservar presupuesto concurrente');
    throw error;
  }
};

const settleBudget = async (reservation: { db: any; date: string; estimate: number }, usage: Usage | undefined, latencyMs: number, model: string) => {
  const totalTokens = usage?.totalTokenCount ?? reservation.estimate;
  await reservation.db.collection('assistant_usage_daily').updateOne({ date: reservation.date },
    { $inc: { reservedTokens: -reservation.estimate, usedTokens: totalTokens } });
  const input = usage?.promptTokenCount ?? 0;
  const output = usage?.candidatesTokenCount ?? 0;
  const inputRate = Number(process.env.GEMINI_INPUT_COST_PER_MILLION ?? 0.075);
  const outputRate = Number(process.env.GEMINI_OUTPUT_COST_PER_MILLION ?? 0.30);
  await reservation.db.collection('assistant_usage_events').insertOne({
    date: reservation.date, model, inputTokens: input, outputTokens: output,
    totalTokens, latencyMs, estimatedCostUsd: (input * inputRate + output * outputRate) / 1_000_000,
    createdAt: new Date(),
  });
};

const contextFor = (args: Record<string, unknown>, fallback: AssistantToolContext): AssistantToolContext => ({
  rangeDays: typeof args.rangeDays === 'number' && [1, 7, 30, 90].includes(args.rangeDays) ? args.rangeDays : fallback.rangeDays,
});

export const tryGeminiRead = async (message: string, context: AssistantToolContext): Promise<string | null> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const reservation = await reserveBudget(Number(process.env.ASSISTANT_RESERVED_TOKENS ?? 1200));
  const model = process.env.GEMINI_MODEL || process.env.ASSISTANT_MODEL || 'gemini-3.1-flash-lite';
  const startedAt = Date.now();
  const base = {
    systemInstruction: { parts: [{ text: 'Sos AF Copilot para un negocio gastronómico. Para preguntas de datos usa únicamente las herramientas autorizadas. No inventes cifras ni muestres datos personales. Responde en español, breve, indicando el período consultado.' }] },
    tools: [{ functionDeclarations: declarations }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 350 },
    contents: [{ role: 'user', parts: [{ text: message }] }],
  };
  try {
  let response = await request(apiKey, model, base);
  const first = response.candidates?.[0]?.content?.parts ?? [];
  const call = first.find((part) => part.functionCall)?.functionCall;
  if (!call || !toolNames.includes(call.name as AssistantToolName)) {
    const answer = first.find((part) => part.text)?.text?.trim() ?? null;
    if (reservation) await settleBudget(reservation, response.usageMetadata, Date.now() - startedAt, model);
    return answer;
  }
  const args = call.args ?? {};
  const result = await runAssistantTool(call.name as AssistantToolName, contextFor(args, context));
  response = await request(apiKey, model, {
    ...base,
    contents: [
      ...base.contents,
      { role: 'model', parts: first },
      { role: 'user', parts: [{ functionResponse: { name: call.name, response: { result } } }] },
    ],
  });
  const answer = response.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text?.trim() ?? null;
  if (reservation) await settleBudget(reservation, response.usageMetadata, Date.now() - startedAt, model);
  return answer;
  } catch (error) {
    if (reservation) {
      await reservation.db.collection('assistant_usage_daily').updateOne({ date: reservation.date }, { $inc: { reservedTokens: -reservation.estimate } });
    }
    throw error;
  }
};
