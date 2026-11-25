import mongoose from 'mongoose';

export type GeminiPart = { text?: string; functionCall?: { name: string; args?: Record<string, unknown> }; [key: string]: unknown };
export type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] };
type Usage = { totalTokenCount?: number; promptTokenCount?: number; candidatesTokenCount?: number };
type ModelResponse = { candidates?: Array<{ content?: GeminiContent }>; usageMetadata?: Usage };
let budgetIndexReady: Promise<unknown> | undefined;

export const generateTurn = async (system: string, contents: GeminiContent[], tools: unknown[]): Promise<GeminiContent | null> => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const configuredModels = [process.env.GEMINI_MODEL || process.env.ASSISTANT_MODEL || 'gemini-3.1-flash-lite', ...(process.env.ASSISTANT_MODEL_FALLBACKS || 'gemini-3.5-flash-lite,gemini-flash-lite-latest').split(',')].map((value) => value.trim()).filter((value, index, values) => value && values.indexOf(value) === index);
  let model = configuredModels[0];
  const requestBody = {
    systemInstruction: { parts: [{ text: system }] }, contents, tools,
    generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
  };
  const db = mongoose.connection.db;
  const date = new Date().toISOString().slice(0, 10);
  const estimate = Math.min(8000, Math.max(1200, Math.ceil(JSON.stringify(requestBody).length / 3) + 1024));
  const budget = Number(process.env.ASSISTANT_DAILY_TOKEN_BUDGET ?? 100_000);
  let reserved = false;
  let usage: Usage | undefined;
  let completed = false;
  const started = Date.now();
  try {
    if (db) {
      const collection = db.collection('assistant_usage_budget_v2');
      budgetIndexReady ??= collection.createIndex({ date: 1 }, { unique: true });
      await budgetIndexReady;
      await collection.updateOne({ date }, { $setOnInsert: { date, reservedTokens: 0, usedTokens: 0 } }, { upsert: true });
      const reservation = await collection.findOneAndUpdate(
        { date, $expr: { $lte: [{ $add: ['$reservedTokens', '$usedTokens'] }, budget - estimate] } },
        { $inc: { reservedTokens: estimate } }, { returnDocument: 'after' },
      );
      if (!reservation) return null;
      reserved = true;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);
    try {
      let lastError = 'Gemini no disponible';
      for (const candidate of configuredModels) {
        model = candidate;
        for (let attempt = 0; attempt < 2; attempt++) {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidate)}:generateContent?key=${encodeURIComponent(key)}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify(requestBody),
          });
          if (response.ok) {
            const result = await response.json() as ModelResponse;
            usage = result.usageMetadata;
            completed = true;
            return result.candidates?.[0]?.content ?? null;
          }
          lastError = `Gemini respondió ${response.status} con ${candidate}`;
          if (![429, 500, 502, 503, 504].includes(response.status)) break;
          await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
        }
      }
      throw new Error(lastError);
    } finally { clearTimeout(timeout); }
  } catch (error) {
    console.warn('[assistant] Gemini no disponible', error instanceof Error ? error.message : 'unknown error');
    return null;
  } finally {
    if (reserved && db) {
      try {
        const totalTokens = completed ? usage?.totalTokenCount ?? estimate : 0;
        await db.collection('assistant_usage_budget_v2').updateOne({ date }, { $inc: { reservedTokens: -estimate, usedTokens: totalTokens } });
        await db.collection('assistant_usage_events').insertOne({ date, model, phase: 'agent', totalTokens, inputTokens: usage?.promptTokenCount ?? 0, outputTokens: usage?.candidatesTokenCount ?? 0, latencyMs: Date.now() - started, createdAt: new Date() });
      } catch (error) { console.error('[assistant] no se pudo registrar el uso de IA', error); }
    }
  }
};
