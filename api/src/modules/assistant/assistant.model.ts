import mongoose from 'mongoose';

type Usage = { totalTokenCount?: number; promptTokenCount?: number; candidatesTokenCount?: number };
type ModelResponse = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; usageMetadata?: Usage };
let budgetIndexReady: Promise<unknown> | undefined;

export const generateText = async (system: string, user: string, phase: 'plan' | 'answer', json = false): Promise<string | null> => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || process.env.ASSISTANT_MODEL || 'gemini-3.1-flash-lite';
  const db = mongoose.connection.db;
  const date = new Date().toISOString().slice(0, 10);
  const estimate = Math.min(5000, Math.max(600, Math.ceil((system.length + user.length) / 3) + 350));
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
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 350, ...(json ? { responseMimeType: 'application/json' } : {}) },
        }),
      });
      if (!response.ok) throw new Error(`Gemini respondió ${response.status}`);
      const result = await response.json() as ModelResponse;
      usage = result.usageMetadata;
      completed = true;
      return result.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text?.trim() || null;
    } finally { clearTimeout(timeout); }
  } catch (error) {
    console.warn(`[assistant] ${phase} no disponible`, error instanceof Error ? error.message : 'unknown error');
    return null;
  } finally {
    if (reserved && db) {
      try {
        const totalTokens = completed ? usage?.totalTokenCount ?? estimate : 0;
        await db.collection('assistant_usage_budget_v2').updateOne({ date }, { $inc: { reservedTokens: -estimate, usedTokens: totalTokens } });
        await db.collection('assistant_usage_events').insertOne({ date, model, phase, totalTokens, inputTokens: usage?.promptTokenCount ?? 0, outputTokens: usage?.candidatesTokenCount ?? 0, latencyMs: Date.now() - started, createdAt: new Date() });
      } catch (error) { console.error('[assistant] no se pudo registrar el uso de IA', error); }
    }
  }
};
