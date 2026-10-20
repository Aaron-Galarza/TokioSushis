import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../../utils/AppError';
import { BranchModel } from '../branches/branch.model';

const getBranchFolder = async (branchId: string): Promise<string> => {
  const branch = await BranchModel.findById(branchId).select('galleryFolder').lean();
  if (!branch) throw new AppError(404, 'Sucursal no encontrada');
  return branch.galleryFolder || `TokyoSushis/branches/${branchId}`;
};

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

export const uploadImage = async (branchId: string, fileBuffer: Buffer, originalName: string): Promise<string> => {
  ensureConfig();
  const folder = await getBranchFolder(branchId);
  return new Promise((resolve, reject) => {
    const cleanName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_");
    const uniquePublicId = `${cleanName}_${Date.now()}`;
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, public_id: uniquePublicId, format: 'webp', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
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

export const getGalleryImages = async (branchId: string) => {
  try {
    ensureConfig();
    const folder = await getBranchFolder(branchId);
    const response = await cloudinary.api.resources({
      type: 'upload',
      prefix: `${folder}/`,
      max_results: 100
    });
    if (!response.resources) return [];
    const images = response.resources.filter((resource: any) =>
      resource.public_id.startsWith(`${folder}/`) && !resource.public_id.slice(folder.length + 1).includes('/')
    ).map((resource: any) => ({
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

export const deleteImage = async (branchId: string, imageId: string): Promise<void> => {
  ensureConfig();
  if (!/^[a-zA-Z0-9_-]+$/.test(imageId)) throw new AppError(400, 'ID de imagen inválido');
  const folder = await getBranchFolder(branchId);
  const publicId = `${folder}/${imageId}`;
  const result = await cloudinary.uploader.destroy(publicId);
  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new AppError(500, `Error al eliminar imagen: ${result.result}`);
  }
};
