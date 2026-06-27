import { Router } from 'express';
import { isAdmin } from '../../middlewares/auth.middleware';
import * as GalleryController from './gallery.controller';

const router = Router();

router.get('/',     GalleryController.list);
router.post('/',    isAdmin, GalleryController.uploadMiddleware, GalleryController.upload);
router.delete('/:id', isAdmin, GalleryController.remove);

export default router;