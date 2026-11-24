import { Router } from 'express';
import { isAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import * as controller from './options.controller';
import { optionSchema, updateOptionSchema } from './options.schema';

const router = Router();
router.get('/', controller.listPublic);
router.get('/admin', isAdmin, controller.listAdmin);
router.post('/admin', isAdmin, validate(optionSchema), controller.create);
router.put('/admin/:id', isAdmin, validate(updateOptionSchema), controller.update);
router.put('/admin/toggleActive/:id', isAdmin, controller.toggle);
router.delete('/admin/:id', isAdmin, controller.remove);
export default router;
