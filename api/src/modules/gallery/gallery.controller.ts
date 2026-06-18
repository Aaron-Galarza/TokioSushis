import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import * as GalleryService from './gallery.service';
import { AppError } from '../../utils/AppError';

// Configuración de Multer para almacenar el archivo temporalmente en memoria (Buffer)
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB por imagen
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Solo se permiten archivos de imagen') as any, false);
    }
  }
}).single('image');

export const upload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError(400, 'No se ha proporcionado ninguna imagen');
    }

    const imageUrl = await GalleryService.uploadImage(req.file.buffer, req.file.originalname);

    res.status(201).json({
      success: true,
      message: 'Imagen subida y optimizada con éxito',
      url: imageUrl,
    });
  } catch (error) {
    next(error);
  }
};

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const images = await GalleryService.getGalleryImages();
    res.status(200).json({
      success: true,
      data: images,
    });
  } catch (error) {
    next(error);
  }
};