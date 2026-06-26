import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../../utils/AppError';

const FOLDER_NAME = 'tokiosushis/galeria';

// 🔥 Función interna para asegurar que las variables de entorno estén cargadas antes de usarlas
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

/**
 * Sube una imagen a Cloudinary en un buffer binario
 */
export const uploadImage = async (fileBuffer: Buffer, originalName: string): Promise<string> => {
  ensureConfig(); // 👈 Inicializa seguro
  
  return new Promise((resolve, reject) => {
    const cleanName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_");
    const uniquePublicId = `${cleanName}_${Date.now()}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: FOLDER_NAME,
        public_id: uniquePublicId,
        format: 'webp',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }] 
      },
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

/**
 * Trae todas las imágenes de la carpeta
 */
export const getGalleryImages = async () => {
  try {
    ensureConfig(); // 👈 Inicializa seguro
    
    const response = await cloudinary.api.resources({
      type: 'upload',
      prefix: `${FOLDER_NAME}/`,
      max_results: 100
    });

    if (!response.resources) return [];

    const images = response.resources.map((resource: any) => ({
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