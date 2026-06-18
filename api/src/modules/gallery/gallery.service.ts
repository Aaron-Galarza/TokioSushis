import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../../utils/AppError';

// Configuración automática con las variables del .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const FOLDER_NAME = 'tokiosushis/galeria';

/**
 * Sube una imagen a Cloudinary en un buffer binario,
 * la fuerza a formato .webp y la guarda en la carpeta designada.
 */
export const uploadImage = async (fileBuffer: Buffer, originalName: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Sanitizamos el nombre original para usarlo como public_id interno
    const cleanName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_");

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: FOLDER_NAME,
        public_id: cleanName,
        format: 'webp', // 👈 Fuerza la conversión a webp automáticamente
        transformation: [{ quality: 'auto', fetch_format: 'auto' }] // Optimización extra de peso
      },
      (error, result) => {
        if (error || !result) {
          return reject(new AppError(500, `Error al subir a Cloudinary: ${error?.message}`));
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Trae todas las imágenes de la carpeta y las ordena alfabéticamente por nombre
 */
export const getGalleryImages = async () => {
  try {
    // Buscamos recursos dentro de la carpeta específica
    const response = await cloudinary.search
      .expression(`folder:${FOLDER_NAME}`)
      .sort_by('public_id', 'asc') // 👈 Ordenado alfabéticamente por nombre
      .max_results(100)
      .execute();

    return response.resources.map((resource: any) => ({
      name: resource.public_id.split('/').pop(), // Solo el nombre del archivo limpio
      url: resource.secure_url,
      createdAt: resource.created_at,
      bytes: resource.bytes
    }));
  } catch (error: any) {
    throw new AppError(500, `Error al listar la galería: ${error.message}`);
  }
};