import { OrderModel } from '../orders/orders.model';
import { BranchModel } from '../branches/branch.model';
import { AppError } from '../../utils/AppError';
import { Range } from '../../utils/dateRange';
import { localDate, rangeStart } from '../../utils/branchTime';

// Orders are the sole source of truth. A failed status update cannot leave a separate counter out of sync.
export const getAnalytics = async (branchId: string, range: Range) => {
  const branch = await BranchModel.findById(branchId).select('timezone').lean();
  if (!branch) throw new AppError(404, 'Sucursal no encontrada');
  const today = localDate(branch.timezone);
  const start = rangeStart(today, range);
  const end = range === 'ayer' ? start : today;

  const [result] = await OrderModel.aggregate([
    { $match: { branchId: branch._id, status: 'delivered', deleted: { $ne: true } } },
    { $addFields: { localDate: { $dateToString: {
      format: '%Y-%m-%d', date: '$createdAt', timezone: branch.timezone,
    } } } },
    { $match: { localDate: { $gte: start, $lte: end } } },
    { $facet: {
      totals: [{ $group: {
        _id: null,
        total: { $sum: '$total' },
        entregados: { $sum: 1 },
        efectivo: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$total', 0] } },
        debito: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'debito'] }, '$total', 0] } },
        credito: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'credito'] }, '$total', 0] } },
        transferencia: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'transferencia'] }, '$total', 0] } },
      } }],
      products: [
        { $unwind: '$items' },
        { $group: { _id: '$items.productId', title: { $first: '$items.title' }, quantity: { $sum: '$items.quantity' } } },
        { $sort: { quantity: -1 } }, { $limit: 1 },
      ],
    } },
  ]);

  const totals = result.totals[0];
  const top = result.products[0];
  return {
    total: totals?.total ?? 0,
    efectivo: totals?.efectivo ?? 0,
    debito: totals?.debito ?? 0,
    credito: totals?.credito ?? 0,
    transferencia: totals?.transferencia ?? 0,
    entregados: totals?.entregados ?? 0,
    topProduct: top ? { title: top.title, quantity: top.quantity } : null,
  };
};
