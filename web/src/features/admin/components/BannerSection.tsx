// features/admin/components/BannerSection.tsx
import { CheckCircle, Image as ImageIcon } from 'lucide-react';
import { AdminCard } from './ui/AdminCard';
import { AdminInput } from './ui/AdminInput';

interface Props {
  banner: string;
  setBanner: (v: string) => void;
  bannerSaved: boolean;
  setBannerSaved: (v: boolean) => void;
  saveBanner: () => void;
}

export function BannerSection({ banner, setBanner, bannerSaved, setBannerSaved, saveBanner }: Props) {
  const hasValidUrl = banner && (banner.startsWith('http://') || banner.startsWith('https://'));

  return (
    <AdminCard className="!p-0 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2">
        
        {/* LADO IZQUIERDO: Imagen / Preview */}
        <div className="aspect-video md:aspect-auto md:h-full min-h-[180px] bg-[#0A0A0A]">
          {hasValidUrl ? (
            <img src={banner} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-1">
              <ImageIcon className="w-8 h-8" />
              <span className="text-xs">Sin imagen</span>
            </div>
          )}
        </div>

        {/* LADO DERECHO: Formulario */}
        <div className="p-5 flex flex-col justify-between gap-3">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">URL de la nueva imagen</p>
            <AdminInput
              type="url"
              value={banner}
              onChange={e => { setBanner(e.target.value); setBannerSaved(false); }}
              placeholder="https://images.unsplash.com/..."
              className="mb-1"
            />
            <p className="text-white/20 text-[11px]">Podés usar imágenes de Unsplash, Cloudinary o cualquier URL pública.</p>
          </div>
          <button
            onClick={saveBanner}
            disabled={!banner.trim()}
            className="w-full bg-primary text-black font-bold py-2.5 rounded-xl text-sm hover:bg-primary/90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
          >
            {bannerSaved ? <><CheckCircle className="w-4 h-4" />Actualizado</> : 'Actualizar Banner'}
          </button>
        </div>
      </div>
    </AdminCard>
  );
}