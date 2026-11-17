import mongoose from 'mongoose';
import { operationCatalog, operationNames, OperationName } from './assistant.operations';

export type Plan = { operation: OperationName; input: Record<string, unknown> };
type GeminiResponse = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; usageMetadata?: { totalTokenCount?: number; promptTokenCount?: number; candidatesTokenCount?: number } };
let budgetIndexReady: Promise<unknown> | undefined;

const deterministicPlan = (message: string, draft?: Plan): Plan | null => {
  const text = message.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (draft?.operation === 'coupons.create') {
    const rawCode = text.match(/(?:cupon|codigo)\s+(?:codigo\s+)?([a-z0-9_-]+)/)?.[1] || text.match(/^([a-z][a-z0-9_-]{0,39})(?:\s+\d|$)/)?.[1];
    const code = rawCode && !/^(de|del|con|un|una|para|por)$/.test(rawCode) ? rawCode : undefined;
    const amount = text.match(/(\d+(?:[.,]\d+)?)\s*(?:%|por ciento)/)?.[1] || (/^\d+(?:[.,]\d+)?$/.test(text.trim()) ? text.trim() : undefined);
    return { operation: 'coupons.create', input: { ...(code ? { code: code.toUpperCase() } : {}), ...(amount ? { discountPercent: Number(amount.replace(',', '.')) } : {}) } };
  }
  const range = /ayer/.test(text) ? 'ayer' : /semana/.test(text) ? 'semana' : /mes/.test(text) ? 'mes' : 'hoy';
  if (/cupon|promocion/.test(text) && /list|mostr|consult|ver|cuales/.test(text)) return { operation: 'coupons.list', input: {} };
  if (/categor/.test(text) && /list|mostr|consult|ver|cuales/.test(text)) return { operation: 'categories.list', input: {} };
  if (/producto|menu/.test(text) && /top|mas vendido|estrella/.test(text)) return { operation: 'products.top', input: { range } };
  if (/producto|menu/.test(text) && /list|mostr|consult|ver|cuales/.test(text)) return { operation: 'products.list', input: {} };
  if (/pedido/.test(text) && /resum|cuant|list|mostr|consult|ver/.test(text)) return { operation: 'orders.list', input: { range } };
  if (/venta|vend|ingreso|factur|recaud/.test(text)) return { operation: 'analytics.read', input: { range } };
  if (/lluvia|envio/.test(text) && /config|estado|cuant|consult/.test(text)) return { operation: 'delivery.config', input: {} };
  if (/abierto|cerrado|estado del local/.test(text)) return { operation: 'store.status', input: {} };
  const rawCode = text.match(/(?:cupon|codigo)\s+(?:codigo\s+)?([a-z0-9_-]+)/)?.[1];
  const code = rawCode && !/^(de|del|con|un|una|para|por)$/.test(rawCode) ? rawCode : undefined;
  const percent = text.match(/(\d+(?:[.,]\d+)?)\s*(?:%|por ciento)/)?.[1];
  if (/crea|agrega|genera/.test(text) && /cupon/.test(text)) return { operation: 'coupons.create', input: { ...(code ? { code: code.toUpperCase() } : {}), ...(percent ? { discountPercent: Number(percent.replace(',', '.')) } : {}) } };
  return null;
};

export const planOperation = async (message: string, draft?: Plan): Promise<Plan | null> => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return deterministicPlan(message, draft);
  const db = mongoose.connection.db;
  const date = new Date().toISOString().slice(0, 10);
  const estimate = 1200;
  const budget = Number(process.env.ASSISTANT_DAILY_TOKEN_BUDGET ?? 100_000);
  let reserved = false;
  if (db) {
    const collection = db.collection('assistant_usage_budget_v2');
    budgetIndexReady ??= collection.createIndex({ date: 1 }, { unique: true });
    await budgetIndexReady;
    await collection.updateOne({ date }, { $setOnInsert: { date, reservedTokens: 0, usedTokens: 0 } }, { upsert: true });
    const reservation = await collection.findOneAndUpdate(
      { date, $expr: { $lte: [{ $add: ['$reservedTokens', '$usedTokens'] }, budget - estimate] } },
      { $inc: { reservedTokens: estimate } }, { returnDocument: 'after' },
    );
    if (!reservation) return deterministicPlan(message, draft);
    reserved = true;
  }
  const model = process.env.GEMINI_MODEL || process.env.ASSISTANT_MODEL || 'gemini-3.1-flash-lite';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  let usage: GeminiResponse['usageMetadata'];
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: `Sos el planificador del panel de Tokyo Sushis. Elegí una sola operación y devolvé solo JSON {"operation":"nombre","input":{...}}. No inventes IDs, nombres, precios ni resultados. Si faltan datos, incluí solo los conocidos. Si la solicitud no corresponde al catálogo, devolvé null. Para un borrador, conservá su operación y completá los datos con el mensaje nuevo.\n${operationCatalog}` }] },
        contents: [{ role: 'user', parts: [{ text: `${draft ? `Borrador: ${JSON.stringify(draft)}\n` : ''}Solicitud: ${message}` }] }],
        generationConfig: { temperature: 0, responseMimeType: 'application/json', maxOutputTokens: 300 },
      }),
    });
    if (!response.ok) throw new Error(`Gemini respondió ${response.status}`);
    const result = await response.json() as GeminiResponse;
    usage = result.usageMetadata;
    const text = result.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
    const planned = text ? JSON.parse(text) as Partial<Plan> : null;
    if (!planned || !operationNames.includes(planned.operation as OperationName) || !planned.input || typeof planned.input !== 'object' || Array.isArray(planned.input)) return null;
    return { operation: planned.operation as OperationName, input: planned.input };
  } catch (error) {
    console.warn('[assistant] Planificador no disponible', error instanceof Error ? error.message : 'unknown error');
    return deterministicPlan(message, draft);
  } finally {
    clearTimeout(timeout);
    if (reserved && db) {
      const totalTokens = usage?.totalTokenCount ?? estimate;
      await db.collection('assistant_usage_budget_v2').updateOne({ date }, { $inc: { reservedTokens: -estimate, usedTokens: totalTokens } });
      await db.collection('assistant_usage_events').insertOne({ date, model, totalTokens, inputTokens: usage?.promptTokenCount ?? 0, outputTokens: usage?.candidatesTokenCount ?? 0, createdAt: new Date() });
    }
  }
};
