import { Router } from 'express';
import { managerAccess } from '../../middlewares/auth.middleware';
import * as GalleryController from './gallery.controller';

const router = Router();

router.get('/',     managerAccess, GalleryController.list);
router.post('/',    managerAccess, GalleryController.uploadMiddleware, GalleryController.upload);
router.delete('/:id', managerAccess, GalleryController.remove);

export default router;
