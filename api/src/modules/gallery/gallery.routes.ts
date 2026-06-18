import { Router } from 'express';
import * as GalleryController from './gallery.controller';

const router = Router();

// GET /api/gallery -> Lista las imágenes ordenadas por nombre
router.get('/', GalleryController.list);

// POST /api/gallery/upload -> Sube una imagen (espera la clave "image" en el form-data)
router.post('/upload', GalleryController.uploadMiddleware, GalleryController.upload);

export default router;