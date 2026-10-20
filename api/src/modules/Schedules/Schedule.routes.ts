import { Router } from 'express';
import { getStatus, closeStore, updateSchedule, updateBanner, getAdminConfig} from './Schedule.controller';
import { managerAccess } from '../../middlewares/auth.middleware';
import { resolvePublicBranch } from '../../middlewares/branch.middleware';

const router = Router();

// Endpoint público para que el Front sepa si mostrar el botón de "Comprar"
router.get('/status', resolvePublicBranch, getStatus);
router.put('/status', managerAccess, closeStore,)
router.put('/schedule', managerAccess, updateSchedule)
router.put('/banner', managerAccess, updateBanner)
router.get('/admin-config', managerAccess, getAdminConfig);

export default router;
