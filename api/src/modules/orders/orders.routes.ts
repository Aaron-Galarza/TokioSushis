import { Router } from 'express';
import * as OrderController from './orders.controllers';
import { staffAccess, managerAccess } from '../../middlewares/auth.middleware';
import { resolvePublicBranch } from '../../middlewares/branch.middleware';
import { ordersLimiter } from '../../middlewares/rateLimiter.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createOrderSchema } from './orders.schema';

const router = Router();

router.post('/', ordersLimiter, resolvePublicBranch, validate(createOrderSchema), OrderController.createOrder);
router.put('/admin/:id', staffAccess, OrderController.updateStatusOrder)
router.get('/admin', staffAccess, OrderController.getAllOrders);
router.get('/admin/range', staffAccess, OrderController.getOrdersRange);
router.delete('/admin/:id', managerAccess, OrderController.deleteOrder);

export default router;
