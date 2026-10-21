import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendError, sendSucces } from '../../utils/response';
import { BranchModel } from '../branches/branch.model';
import { OrderModel } from '../orders/orders.model';
import { localDate, startOfLocalDayUtc } from '../../utils/branchTime';

const REPORT_RANGES: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires';

export const overview = asyncHandler(async (req: Request, res: Response) => {
  const branchId = typeof req.query.branchId === 'string' ? req.query.branchId : '';
  const range = typeof req.query.range === 'string' ? req.query.range : '30d';
  if (branchId && !mongoose.isValidObjectId(branchId)) return sendError(res, 'Sucursal inválida', 400);
  if (!REPORT_RANGES[range]) return sendError(res, 'Período inválido', 400);

  const branches = await BranchModel.find({}).select('name slug active timezone').sort({ name: 1 }).lean();
  const selectedBranch = branches.find((branch) => branch._id.toString() === branchId);
  if (branchId && !selectedBranch) return sendError(res, 'Sucursal no encontrada', 404);

  const days = REPORT_RANGES[range];
  const timezone = selectedBranch?.timezone || DEFAULT_TIMEZONE;
  const generatedAt = new Date();
  const today = localDate(timezone, generatedAt);
  const firstDay = new Date(`${today}T12:00:00.000Z`);
  firstDay.setUTCDate(firstDay.getUTCDate() - days + 1);
  const from = startOfLocalDayUtc(firstDay.toISOString().slice(0, 10), timezone);
  const match: Record<string, unknown> = { deleted: { $ne: true }, createdAt: { $gte: from, $lte: generatedAt } };
  if (branchId) match.branchId = new mongoose.Types.ObjectId(branchId);

  // Orders are the persisted source of truth, so status changes and soft deletes
  // update every indicator without a second counter that can drift.
  const [facet, recentOrders] = await Promise.all([
    OrderModel.aggregate([
      { $match: match },
      { $addFields: {
        reportDate: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone } },
        reportHour: { $dateToString: { format: '%H', date: '$createdAt', timezone } },
      } },
      { $facet: {
        summary: [{ $group: { _id: null,
          orders: { $sum: 1 },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          revenue: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, '$total', 0] } },
        } }],
        branches: [{ $group: { _id: '$branchId',
          orders: { $sum: 1 },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          revenue: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, '$total', 0] } },
        } }],
        statuses: [{ $group: { _id: '$status', orders: { $sum: 1 } } }],
        daily: [{ $match: { status: 'delivered' } },
          { $group: { _id: '$reportDate', orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
          { $sort: { _id: 1 } }],
        hourly: [{ $match: { status: 'delivered' } },
          { $group: { _id: '$reportHour', orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
          { $sort: { _id: 1 } }],
        products: [{ $match: { status: 'delivered' } }, { $unwind: '$items' },
          { $group: { _id: '$items.productId', title: { $first: '$items.title' },
            quantity: { $sum: '$items.quantity' } } },
          { $sort: { quantity: -1, title: 1 } }, { $limit: 5 }],
        payments: [{ $match: { status: 'delivered' } },
          { $group: { _id: '$paymentMethod', orders: { $sum: 1 }, revenue: { $sum: '$total' } } }],
        deliveryModes: [{ $match: { status: 'delivered' } },
          { $group: { _id: '$deliveryType', orders: { $sum: 1 }, revenue: { $sum: '$total' } } }],
      } },
    ]),
    OrderModel.find(match).select('branchId status total createdAt deliveryType')
      .sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  const result = facet[0];
  const summary = result.summary[0] ?? { orders: 0, delivered: 0, revenue: 0 };
  const dailyValues = new Map(result.daily.map((row: any) => [row._id, row]));
  const daily = Array.from({ length: days }, (_, index) => {
    const date = new Date(firstDay);
    date.setUTCDate(date.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    const row = dailyValues.get(key) as { orders: number; revenue: number } | undefined;
    return { date: key, orders: row?.orders ?? 0, revenue: row?.revenue ?? 0 };
  });
  const names = new Map(branches.map((branch) => [branch._id.toString(), branch.name]));
  const byBranch = branches.filter((branch) => !branchId || branch._id.toString() === branchId)
    .map((branch) => {
      const row = result.branches.find((entry: any) => entry._id?.toString() === branch._id.toString());
      return { id: branch._id.toString(), name: branch.name, slug: branch.slug,
        orders: row?.orders ?? 0, delivered: row?.delivered ?? 0, revenue: row?.revenue ?? 0 };
    });

  return sendSucces(res, {
    generatedAt, range, timezone,
    branches: branches.map((branch) => ({ id: branch._id.toString(), name: branch.name,
      slug: branch.slug, active: branch.active })),
    totals: { orders: summary.orders, delivered: summary.delivered, revenue: summary.revenue,
      averageTicket: summary.delivered ? Math.round(summary.revenue / summary.delivered) : 0 },
    byBranch,
    statuses: result.statuses.map((row: any) => ({ status: row._id, orders: row.orders })),
    daily,
    hourly: result.hourly.map((row: any) => ({ hour: Number(row._id), orders: row.orders, revenue: row.revenue })),
    topProducts: result.products.map((row: any) => ({ productId: row._id,
      title: row.title, quantity: row.quantity })),
    payments: result.payments.map((row: any) => ({ method: row._id, orders: row.orders, revenue: row.revenue })),
    deliveryModes: result.deliveryModes.map((row: any) => ({ mode: row._id, orders: row.orders, revenue: row.revenue })),
    recentOrders: recentOrders.map((order: any) => ({ ...order,
      branchName: names.get(order.branchId?.toString()) ?? 'Sucursal desconocida' })),
  });
});
