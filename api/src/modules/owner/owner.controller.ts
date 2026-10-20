import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendError, sendSucces } from '../../utils/response';
import { BranchModel } from '../branches/branch.model';
import { OrderModel } from '../orders/orders.model';

export const overview = asyncHandler(async (req: Request, res: Response) => {
  const branchId = typeof req.query.branchId === 'string' ? req.query.branchId : '';
  if (branchId && !mongoose.isValidObjectId(branchId)) return sendError(res, 'Sucursal inválida', 400);

  const branches = await BranchModel.find({}).select('name slug active').sort({ name: 1 }).lean();
  if (branchId && !branches.some((branch) => branch._id.toString() === branchId)) {
    return sendError(res, 'Sucursal no encontrada', 404);
  }

  const match: Record<string, unknown> = { deleted: { $ne: true } };
  if (branchId) match.branchId = new mongoose.Types.ObjectId(branchId);
  const [aggregated, recentOrders] = await Promise.all([
    OrderModel.aggregate([
      { $match: match },
      { $group: {
        _id: '$branchId',
        orders: { $sum: 1 },
        delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
        revenue: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, '$total', 0] } },
      } },
    ]),
    OrderModel.find(match).select('branchId status total deliveryType createdAt')
      .sort({ createdAt: -1 }).limit(50).lean(),
  ]);

  const names = new Map(branches.map((branch) => [branch._id.toString(), branch.name]));
  const byBranch = branches.filter((branch) => !branchId || branch._id.toString() === branchId).map((branch) => {
    const row = aggregated.find((entry: any) => entry._id?.toString() === branch._id.toString());
    return { id: branch._id.toString(), name: branch.name, slug: branch.slug,
      orders: row?.orders ?? 0, delivered: row?.delivered ?? 0, revenue: row?.revenue ?? 0 };
  });
  return sendSucces(res, {
    branches: branches.map((branch) => ({ id: branch._id.toString(), name: branch.name, slug: branch.slug, active: branch.active })),
    totals: byBranch.reduce((acc, branch) => ({ orders: acc.orders + branch.orders,
      delivered: acc.delivered + branch.delivered, revenue: acc.revenue + branch.revenue }),
      { orders: 0, delivered: 0, revenue: 0 }),
    byBranch,
    recentOrders: recentOrders.map((order: any) => ({ ...order, branchName: names.get(order.branchId?.toString()) ?? 'Sucursal desconocida' })),
  });
});
