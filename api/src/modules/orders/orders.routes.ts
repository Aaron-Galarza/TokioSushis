import { Router } from 'express';
import * as OrderController from './orders.controllers';
import { isAdmin } from '../../middlewares/auth.middleware';
import { ordersLimiter } from '../../middlewares/rateLimiter.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createOrderSchema } from './orders.schema';

const router = Router();

router.post('/', ordersLimiter, validate(createOrderSchema), OrderController.createOrder);
router.put('/admin/:id', isAdmin, OrderController.updateStatusOrder)
router.get('/admin', isAdmin, OrderController.getAllOrders);
router.get('/admin/range', isAdmin, OrderController.getOrdersRange);

export default router;
