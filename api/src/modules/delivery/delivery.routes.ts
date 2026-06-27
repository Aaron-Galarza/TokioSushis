import { Router } from 'express';
import * as ctrl from './delivery.controller';
import { validate } from '../../middlewares/validate.middleware';
import { calculateDeliverySchema, updateConfigSchema, toggleRainSchema, rangeSchema } from './delivery.schema';
import { isAdmin } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/calculate', validate(calculateDeliverySchema), ctrl.calculate);

router.get('/config',           isAdmin, ctrl.getConfig);
router.put('/config',           isAdmin, validate(updateConfigSchema), ctrl.updateConfig);
router.patch('/config/rain',    isAdmin, validate(toggleRainSchema), ctrl.toggleRain);
router.post('/config/ranges',   isAdmin, validate(rangeSchema), ctrl.addRange);
router.delete('/config/ranges/:id', isAdmin, ctrl.deleteRange);

export default router;