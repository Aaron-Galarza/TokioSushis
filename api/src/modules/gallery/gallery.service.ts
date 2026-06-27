import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../../utils/AppError';

const FOLDER_NAME = 'tokiosushis/galeria';

const ensureConfig = () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new AppError(500, "Faltan las variables de entorno de Cloudinary en el backend (.env)");
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

export const uploadImage = async (fileBuffer: Buffer, originalName: string): Promise<string> => {
  ensureConfig();
  return new Promise((resolve, reject) => {
    const cleanName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_");
    const uniquePublicId = `${cleanName}_${Date.now()}`;
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: FOLDER_NAME, public_id: uniquePublicId, format: 'webp', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
      (error, result) => {
        if (error || !result) {
          console.error("❌ ERROR EN UPLOAD CLOUDINARY:", error);
          return reject(new AppError(500, `Error al subir a Cloudinary: ${error?.message || 'Error desconocido'}`));
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export const getGalleryImages = async () => {
  try {
    ensureConfig();
    const response = await cloudinary.api.resources({
      type: 'upload',
      prefix: `${FOLDER_NAME}/`,
      max_results: 100
    });
    if (!response.resources) return [];
    const images = response.resources.map((resource: any) => ({
      id: resource.public_id.split('/').pop(), // nombre sin carpeta → usado como ID
      name: resource.public_id.split('/').pop(),
      url: resource.secure_url,
      createdAt: resource.created_at,
      bytes: resource.bytes
    }));
    return images.sort((a: any, b: any) => a.name.localeCompare(b.name));
  } catch (error: any) {
    console.error("❌ ERROR EN LISTADO CLOUDINARY:", error);
    throw new AppError(500, `Error al listar la galería: ${error.message}`);
  }
};

export const deleteImage = async (imageId: string): Promise<void> => {
  ensureConfig();
  // El public_id completo en Cloudinary incluye la carpeta
  const publicId = `${FOLDER_NAME}/${imageId}`;
  const result = await cloudinary.uploader.destroy(publicId);
  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new AppError(500, `Error al eliminar imagen: ${result.result}`);
  }
};