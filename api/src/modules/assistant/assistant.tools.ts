import { ProductModel } from '../productos/products.model';
import { CategoriaModel } from '../categorias/categorias.model';
import { CouponModel } from '../coupons/coupons.model';
import { OrderModel } from '../orders/orders.model';

export type AssistantToolName =
  | 'list_products'
  | 'list_categories'
  | 'list_coupons'
  | 'get_orders_summary'
  | 'get_sales_summary'
  | 'get_top_products';

export interface AssistantToolContext {
  rangeDays?: number;
}

const safeLimit = 30;
const since = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

export const listProducts = async () => {
  const products = await ProductModel.find().select('title price active category').sort({ title: 1 }).limit(safeLimit).lean();
  return products.map((product) => ({
    id: product._id.toString(), title: product.title, price: product.price,
    active: product.active, category: product.category?.toString?.() ?? product.category,
  }));
};

export const listCategories = async () => {
  const categories = await CategoriaModel.find().select('name active order').sort({ order: 1, name: 1 }).limit(safeLimit).lean();
  return categories.map((category) => ({ id: category._id.toString(), name: category.name,
    active: category.active, order: category.order }));
};

export const listCoupons = async () => {
  const coupons = await CouponModel.find().select('code discountPercent active validDays validPaymentMethods')
    .sort({ code: 1 }).limit(safeLimit).lean();
  return coupons.map((coupon) => ({ id: coupon._id.toString(), code: coupon.code,
    discountPercent: coupon.discountPercent, active: coupon.active,
    validDays: coupon.validDays ?? [], validPaymentMethods: coupon.validPaymentMethods ?? [] }));
};

const orderMatch = (context: AssistantToolContext, deliveredOnly = false) => {
  const match: Record<string, unknown> = { deleted: { $ne: true }, createdAt: { $gte: since(context.rangeDays ?? 7) } };
  if (deliveredOnly) match.status = 'delivered';
  return match;
};

export const getOrdersSummary = async (context: AssistantToolContext) => {
  const [summary] = await OrderModel.aggregate([
    { $match: orderMatch(context) },
    { $group: { _id: null, orders: { $sum: 1 }, delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
      pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
      inPreparation: { $sum: { $cond: [{ $eq: ['$status', 'in-preparation'] }, 1, 0] } },
      ready: { $sum: { $cond: [{ $eq: ['$status', 'ready'] }, 1, 0] } },
      cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } } } },
  ]);
  return { rangeDays: context.rangeDays ?? 7, ...summary, orders: summary?.orders ?? 0,
    delivered: summary?.delivered ?? 0, pending: summary?.pending ?? 0,
    inPreparation: summary?.inPreparation ?? 0, ready: summary?.ready ?? 0, cancelled: summary?.cancelled ?? 0 };
};

export const getSalesSummary = async (context: AssistantToolContext) => {
  const [summary] = await OrderModel.aggregate([
    { $match: orderMatch(context, true) },
    { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 },
      cash: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$total', 0] } },
      debit: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'debito'] }, '$total', 0] } },
      credit: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'credito'] }, '$total', 0] } },
      transfer: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'transferencia'] }, '$total', 0] } } } },
  ]);
  const revenue = summary?.revenue ?? 0;
  const orders = summary?.orders ?? 0;
  return { rangeDays: context.rangeDays ?? 7, revenue, orders,
    averageTicket: orders ? Math.round(revenue / orders) : 0,
    paymentMethods: { cash: summary?.cash ?? 0, debit: summary?.debit ?? 0,
      credit: summary?.credit ?? 0, transfer: summary?.transfer ?? 0 } };
};

export const getTopProducts = async (context: AssistantToolContext) => {
  const rows = await OrderModel.aggregate([
    { $match: orderMatch(context, true) }, { $unwind: '$items' },
    { $group: { _id: '$items.productId', title: { $first: '$items.title' }, quantity: { $sum: '$items.quantity' } } },
    { $sort: { quantity: -1, title: 1 } }, { $limit: 5 },
  ]);
  return rows.map((row) => ({ productId: row._id, title: row.title, quantity: row.quantity }));
};

export const runAssistantTool = async (name: AssistantToolName, context: AssistantToolContext = {}) => {
  switch (name) {
    case 'list_products': return listProducts();
    case 'list_categories': return listCategories();
    case 'list_coupons': return listCoupons();
    case 'get_orders_summary': return getOrdersSummary(context);
    case 'get_sales_summary': return getSalesSummary(context);
    case 'get_top_products': return getTopProducts(context);
  }
};
