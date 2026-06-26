import { useEffect } from 'react';
import { Upload, Loader2, Check, Copy, X } from 'lucide-react';
import { AdminCard } from './ui/AdminCard';
import { useAdminGallery } from '../hooks/useAdminGallery';

export function GalleryTab() {
  const { images, uploading, copiedId, fileRef, reload, handleUpload, remove, copyUrl } = useAdminGallery();

  useEffect(() => { reload(); }, [reload]);

  return (
    <AdminCard>
      <h2 className="font-semibold text-white text-sm mb-4">Gestor de Imágenes</h2>
      <div
        onClick={() => fileRef.current?.click()}
        className="border border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all mb-5"
      >
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} />
        {uploading
          ? <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin mb-3" />
          : <Upload className="w-8 h-8 text-white/20 mx-auto mb-3" />}
        <p className="text-white/60 text-sm font-medium">{uploading ? 'Subiendo...' : 'Arrastrá o hacé clic para subir'}</p>
        <p className="text-white/25 text-xs mt-1">JPG, PNG o WEBP</p>
        {!uploading && <button type="button" className="mt-4 border border-primary/40 text-primary px-4 py-2 rounded-lg text-xs font-semibold hover:bg-primary/10 transition-colors">Seleccionar archivo</button>}
      </div>

      {images.length === 0
        ? <p className="text-white/20 text-xs text-center py-4">Sin imágenes cargadas.</p>
        : (
          <div className="max-h-[500px] overflow-y-auto overscroll-contain scrollbar-none">
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {images.map((img: any) => (
                // 🔥 FIX: Usamos img.url como key única y segura para React
                <div key={img.url} className="group relative rounded-xl overflow-hidden aspect-square bg-zinc-900 border border-white/10">
                  {/* FIX: Usamos img.name como fallback semántico de alt text */}
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                  
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
                    {/* 🔥 Usamos img.name para identificar el id en el copiado y borrado */}
                    <button onClick={() => copyUrl(img.name, img.url)} className="flex items-center gap-1.5 bg-primary text-black text-[10px] font-bold px-2.5 py-1.5 rounded-lg">
                      {copiedId === img.name ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedId === img.name ? 'Copiado' : 'Copiar URL'}
                    </button>
                    
                    <button onClick={() => remove(img.name)} className="flex items-center gap-1 bg-red-600/80 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg">
                      <X className="w-3 h-3" />Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </AdminCard>
  );
}