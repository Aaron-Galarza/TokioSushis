import { Router } from 'express';
import * as ctrl from './delivery.controller';
import { validate } from '../../middlewares/validate.middleware';
import { calculateDeliverySchema, updateConfigSchema, toggleRainSchema, rangeSchema } from './delivery.schema';
import { managerAccess } from '../../middlewares/auth.middleware';
import { resolvePublicBranch } from '../../middlewares/branch.middleware';

const router = Router();

router.post('/calculate', resolvePublicBranch, validate(calculateDeliverySchema), ctrl.calculate);

router.get('/config',           managerAccess, ctrl.getConfig);
router.put('/config',           managerAccess, validate(updateConfigSchema), ctrl.updateConfig);
router.patch('/config/rain',    managerAccess, validate(toggleRainSchema), ctrl.toggleRain);
router.post('/config/ranges',   managerAccess, validate(rangeSchema), ctrl.addRange);
router.delete('/config/ranges/:id', managerAccess, ctrl.deleteRange);

export default router;
