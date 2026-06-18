import { Router } from 'express';
import * as ctrl from './deliveryTariff.controller';
import { validate } from '../../middlewares/validate.middleware';
import { updateTariffSchema, toggleRainSchema, zoneSchema, rangeSchema } from './deliveryTariff.schema';
import { isAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// Configuración general
router.get('/',    isAdmin, ctrl.getTariffs);
router.put('/',    isAdmin, validate(updateTariffSchema), ctrl.updateTariffs);
router.patch('/rain', isAdmin, validate(toggleRainSchema), ctrl.toggleRain);

// CRUD de zonas especiales
router.post(  '/zones',    isAdmin, validate(zoneSchema), ctrl.addZone);
router.put(   '/zones/:id', isAdmin, validate(zoneSchema), ctrl.updateZone);
router.delete('/zones/:id', isAdmin, ctrl.deleteZone);

// CRUD de rangos por km
router.post(  '/ranges',    isAdmin, validate(rangeSchema), ctrl.addRange);
router.put(   '/ranges/:id', isAdmin, validate(rangeSchema), ctrl.updateRange);
router.delete('/ranges/:id', isAdmin, ctrl.deleteRange);

export default router;
