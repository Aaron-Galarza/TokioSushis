import { Router } from 'express';
import { getStatus, closeStore, updateSchedule, updateBanner} from './Schedule.controller';
import { isAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// Endpoint público para que el Front sepa si mostrar el botón de "Comprar"
router.get('/status', getStatus);
router.put('/status', isAdmin, closeStore,)
router.put('/schedule', isAdmin, updateSchedule)
router.put('/banner', isAdmin, updateBanner)

export default router;
