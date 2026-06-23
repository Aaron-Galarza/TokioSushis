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
  // Validamos de forma segura si hay una URL real escrita
  const hasValidUrl = banner && (banner.startsWith('http://') || banner.startsWith('https://'));

  return (
    <AdminCard>
      <h2 className="font-semibold text-white text-sm mb-3">Banner del Inicio</h2>
      
      {hasValidUrl ? (
        <div className="rounded-xl overflow-hidden mb-3 border border-white/10 aspect-video">
          <img src={banner} alt="Banner del local" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="rounded-xl mb-3 border border-dashed border-white/10 aspect-video flex flex-col items-center justify-center bg-[#1A1A1A] text-white/20 gap-1">
          <ImageIcon className="w-6 h-6" />
          <span className="text-[11px]">Sin vista previa (ingresá una URL válida)</span>
        </div>
      )}

      <AdminInput 
        type="url" 
        value={banner} 
        onChange={e => { setBanner(e.target.value); setBannerSaved(false); }} 
        placeholder="https://images.unsplash.com/..." 
        className="mb-3" 
      />
      <button 
        onClick={saveBanner} 
        disabled={!banner.trim()}
        className="w-full bg-primary text-black font-bold py-2.5 rounded-xl text-sm hover:bg-primary/90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
      >
        {bannerSaved ? <><CheckCircle className="w-4 h-4" />Actualizado</> : 'Actualizar Banner'}
      </button>
    </AdminCard>
  );
}