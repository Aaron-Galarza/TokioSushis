import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { calculateDeliverySchema } from './delivery.schema';
import * as DeliveryController from './delivery.controller';

const router = Router();

router.post('/calculate', validate(calculateDeliverySchema), DeliveryController.calculate);

export default router;
