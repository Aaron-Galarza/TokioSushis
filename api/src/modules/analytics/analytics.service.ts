import { DailyAnalyticsModel } from './daily.model';
import { iOrder } from '../orders/orders.model';
import { argDate } from '../../utils/Timezone';
import { Range, getRangeStartDate } from '../../utils/dateRange';

// ─── Tipos Sincronizados ─────────────────────────────────

interface AnalyticsStats {
  total: number;
  efectivo: number;
  debito: number;
  credito: number;
  transferencia: number;
  entregados: number;
  topProduct: { title: string; quantity: number } | null;
}

// ─── Consulta principal ──────────────────────────────────

export const getAnalytics = async (range: Range): Promise<AnalyticsStats> => {

  const startDate = getRangeStartDate(range);
  const endDate = range === 'ayer' ? startDate : argDate();

  const dailies = await DailyAnalyticsModel.find({
    date: { $gte: startDate, $lte: endDate },
  }).lean();

  if (dailies.length === 0) {
    return { total: 0, efectivo: 0, debito: 0, credito: 0, transferencia: 0, entregados: 0, topProduct: null };
  }

  const productMap: Record<string, { qty: number; title: string }> = {};
  let total = 0, efectivo = 0, debito = 0, credito = 0, transferencia = 0, entregados = 0;

  for (const day of dailies) {
    total         += day.total ?? 0;
    efectivo      += day.efectivo ?? 0;
    debito        += day.debito ?? 0; // 💳 Nuevos acumuladores mapeados
    credito       += day.credito ?? 0;
    transferencia += day.transferencia ?? 0;
    entregados    += day.entregados ?? 0;

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

  return { total, efectivo, debito, credito, transferencia, entregados, topProduct: getTopProduct(productMap) };
};

// ─── Escribir en daily cuando una orden se entrega ───────

export const updateAnalyticsOnDelivery = async (order: iOrder) => {
  const date = argDate(new Date(order.createdAt));

  const incUpdates: Record<string, number> = {};
  const setUpdates: Record<string, string> = {};

  for (const item of order.items) {
    const key = `products.${item.productId}`;
    incUpdates[`${key}.qty`] = (incUpdates[`${key}.qty`] ?? 0) + item.quantity;
    setUpdates[`${key}.title`] = item.title;
  }

  // Desglose limpio condicional por pasarela real
  const methodKey =
    order.paymentMethod === 'cash' ? 'efectivo' :
    order.paymentMethod === 'debito' ? 'debito' :
    order.paymentMethod === 'transferencia' ? 'transferencia' :
    'credito';

  await DailyAnalyticsModel.findOneAndUpdate(
    { date },
    {
      $inc: {
        total: order.total,
        entregados: 1,
        [methodKey]: order.total, // Suma dinámicamente al casillero correspondiente
        ...incUpdates,
      },
      $set: setUpdates,
    },
    { upsert: true }
  );

  console.log(`[ANALYTICS] ADD → ${date} | $${order.total} por ${order.paymentMethod}`);
};

// ─── Revertir cuando una orden delivered se cancela ──────

export const revertAnalyticsOnDelivery = async (order: iOrder) => {
  const date = argDate(new Date(order.createdAt));

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

  // Reversión precisa según método
  const isCash = order.paymentMethod === 'cash';
  const isDebito = order.paymentMethod === 'debito';
  const isTransferencia = order.paymentMethod === 'transferencia';

  const safeEfectivo      = isCash ? Math.min(order.total, daily.efectivo ?? 0) : 0;
  const safeDebito        = isDebito ? Math.min(order.total, daily.debito ?? 0) : 0;
  const safeTransferencia = isTransferencia ? Math.min(order.total, daily.transferencia ?? 0) : 0;
  const safeCredito       = (!isCash && !isDebito && !isTransferencia) ? Math.min(order.total, daily.credito ?? 0) : 0;

  await DailyAnalyticsModel.findOneAndUpdate(
    { date },
    {
      $inc: {
        total: -safeTotal,
        entregados: -safeEntregados,
        efectivo: -safeEfectivo,
        debito: -safeDebito,
        credito: -safeCredito,
        transferencia: -safeTransferencia,
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