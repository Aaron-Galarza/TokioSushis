/**
 * Devuelve la URL de Cloudinary con transformaciones de optimización
 * (f_auto = formato WebP/AVIF según navegador, q_auto = compresión automática,
 * w_ = redimensión). Si la URL no es de Cloudinary, la devuelve intacta.
 */
export const cloudinaryImage = (url: string, width: number): string => {
  if (!url.includes('res.cloudinary.com')) return url;
  if (!url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
};
