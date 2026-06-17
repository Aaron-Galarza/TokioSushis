import { DailyAnalyticsModel } from './daily.model';
import { iOrder } from '../orders/orders.model';
import { argDate } from '../../utils/Timezone';

// ─── Tipos ───────────────────────────────────────────────

interface AnalyticsStats {
  total: number;
  efectivo: number;
  trans: number;
  entregados: number;
  topProduct: { title: string; quantity: number } | null;
}

// ─── Consulta principal ──────────────────────────────────

export const getAnalytics = async (
  range: 'hoy' | 'ayer' | 'semana' | 'mes'
): Promise<AnalyticsStats> => {

  const today = argDate(); // "2026-05-05" en hora Argentina
  let startDate: string;
  let endDate: string = today;

  switch (range) {
    case 'hoy':
      startDate = today;
      break;

    case 'ayer': {
      const d = new Date(today + 'T12:00:00Z');
      d.setUTCDate(d.getUTCDate() - 1);
      startDate = d.toISOString().slice(0, 10);
      endDate   = startDate;
      break;
    }

    case 'semana': {
      const d = new Date(today + 'T12:00:00Z');
      const dow = d.getUTCDay();
      d.setUTCDate(d.getUTCDate() - (dow === 0 ? 6 : dow - 1));
      startDate = d.toISOString().slice(0, 10);
      break;
    }

    case 'mes':
      startDate = today.slice(0, 8) + '01';
      break;
  }

  // Los dailies guardan date como "YYYY-MM-DD" en hora Argentina
  const dailies = await DailyAnalyticsModel.find({
    date: { $gte: startDate, $lte: endDate },
  }).lean();

  if (dailies.length === 0) {
    return { total: 0, efectivo: 0, trans: 0, entregados: 0, topProduct: null };
  }

  const productMap: Record<string, { qty: number; title: string }> = {};
  let total = 0, efectivo = 0, trans = 0, entregados = 0;

  for (const day of dailies) {
    total     += day.total ?? 0;
    efectivo  += day.efectivo ?? 0;
    trans     += day.trans ?? 0;
    entregados += day.entregados ?? 0;

    const products = day.products;
    if (!products) continue;

    const entries = products instanceof Map
      ? [...products.entries()]
      : Object.entries(products);

    for (const [productId, data] of entries) {
      const entry = data as { qty: number; title: string };
      if (!productMap[productId]) {
        productMap[productId] = { qty: 0, title: entry.title || 'Sin nombre' };
      }
      productMap[productId].qty += entry.qty ?? 0;
    }
  }

  return { total, efectivo, trans, entregados, topProduct: getTopProduct(productMap) };
};

// ─── Escribir en daily cuando una orden se entrega ───────

export const updateAnalyticsOnDelivery = async (order: iOrder) => {
  const date = argDate(new Date(order.createdAt)); // ← fecha Argentina, no UTC

  const incUpdates: Record<string, number> = {};
  const setUpdates: Record<string, string> = {};

  for (const item of order.items) {
    const key = `products.${item.productId}`;
    incUpdates[`${key}.qty`] = (incUpdates[`${key}.qty`] ?? 0) + item.quantity;
    setUpdates[`${key}.title`] = item.title;
  }

  await DailyAnalyticsModel.findOneAndUpdate(
    { date },
    {
      $inc: {
        total: order.total,
        entregados: 1,
        ...(order.paymentMethod === 'Efectivo'
          ? { efectivo: order.total }
          : { trans: order.total }),
        ...incUpdates,
      },
      $set: setUpdates,
    },
    { upsert: true }
  );

  console.log(`[ANALYTICS] ADD → ${date} | $${order.total}`);
};

// ─── Revertir cuando una orden delivered se cancela ──────

export const revertAnalyticsOnDelivery = async (order: iOrder) => {
  const date = argDate(new Date(order.createdAt)); // ← fecha Argentina, no UTC

  const daily = await DailyAnalyticsModel.findOne({ date });
  if (!daily) {
    console.warn(`[ANALYTICS] REVERT ignorado — no hay registro para ${date}`);
    return;
  }

  const incUpdates: Record<string, number> = {};

  for (const item of order.items) {
    const key = `products.${item.productId}.qty`;
    const currentQty = daily.products?.get(item.productId)?.qty ?? 0;
    incUpdates[key] = (incUpdates[key] ?? 0) - Math.min(item.quantity, currentQty);
  }

  const safeTotal      = Math.min(order.total, daily.total);
  const safeEntregados = Math.min(1, daily.entregados);
  const safeEfectivo   = order.paymentMethod === 'Efectivo' ? Math.min(order.total, daily.efectivo) : 0;
  const safeTrans      = order.paymentMethod !== 'Efectivo' ? Math.min(order.total, daily.trans) : 0;

  await DailyAnalyticsModel.findOneAndUpdate(
    { date },
    {
      $inc: {
        total: -safeTotal,
        entregados: -safeEntregados,
        efectivo: -safeEfectivo,
        trans: -safeTrans,
        ...incUpdates,
      },
    }
  );

  console.log(`[ANALYTICS] REVERT → ${date} | $${order.total}`);
};

// ─── Helper ──────────────────────────────────────────────

function getTopProduct(
  productMap: Record<string, { qty: number; title: string }>
): { title: string; quantity: number } | null {
  let topId: string | null = null;
  let maxQty = 0;

  for (const [id, data] of Object.entries(productMap)) {
    if (data.qty > maxQty) { maxQty = data.qty; topId = id; }
  }

  if (!topId) return null;
  return { title: productMap[topId].title, quantity: maxQty };
}