import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import * as GalleryService from './gallery.service';
import { AppError } from '../../utils/AppError';

const storage = multer.memoryStorage();
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const matchesImageSignature = (buffer: Buffer, mimeType: string): boolean => {
  if (mimeType === 'image/jpeg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === 'image/webp') return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  return false;
};

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Solo se permiten imágenes JPG, PNG o WEBP'));
    }
  }
}).single('image');

export const upload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError(400, 'No se ha proporcionado ninguna imagen');
    if (!matchesImageSignature(req.file.buffer, req.file.mimetype)) {
      throw new AppError(400, 'El contenido del archivo no coincide con una imagen JPG, PNG o WEBP');
    }
    const imageUrl = await GalleryService.uploadImage(req.file.buffer, req.file.originalname);
    res.status(201).json({ success: true, message: 'Imagen subida y optimizada con éxito', url: imageUrl });
  } catch (error) {
    next(error);
  }
};

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const images = await GalleryService.getGalleryImages();
    res.status(200).json({ success: true, data: images });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new AppError(400, 'ID de imagen inválido');
    await GalleryService.deleteImage(id);
    res.status(200).json({ success: true, message: 'Imagen eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};
