'use client';

import { useState } from 'react';
import { CheckCircle, Image as ImageIcon } from 'lucide-react';
import { AdminCard } from './ui/AdminCard';
import { AdminInput } from './ui/AdminInput';
import { ImageUploadButton } from './ui/ImageUploadButton';

interface Props {
  banner: string;
  setBanner: (v: string) => void;
  bannerSaved: boolean;
  setBannerSaved: (v: boolean) => void;
  bannerSaving: boolean;
  bannerError: string;
  saveBanner: () => void;
}

export function BannerSection({ banner, setBanner, bannerSaved, setBannerSaved, bannerSaving, bannerError, saveBanner }: Props) {
  const [uploading, setUploading] = useState(false);
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
            <p className="text-white/40 text-xs mb-1">Imagen del banner</p>
            <ImageUploadButton
              uploading={uploading}
              setUploading={setUploading}
              disabled={bannerSaving}
              onUploaded={(url) => { setBanner(url); setBannerSaved(false); }}
            />
            <p className="mt-3 mb-1 text-white/40 text-xs">O pegá una URL pública</p>
            <AdminInput
              type="url"
              value={banner}
              onChange={e => { setBanner(e.target.value); setBannerSaved(false); }}
              placeholder="https://images.unsplash.com/..."
              className="mb-1"
              disabled={uploading || bannerSaving}
            />
            <p className="text-white/35 text-[11px]">La imagen se muestra en la portada después de guardar.</p>
            {bannerError && <p role="alert" className="mt-2 text-xs text-red-400">{bannerError}</p>}
          </div>
          <button
            onClick={saveBanner}
            disabled={!banner.trim() || uploading || bannerSaving}
            className="w-full bg-primary text-black font-bold py-2.5 rounded-xl text-sm hover:bg-primary/90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
          >
            {bannerSaving ? 'Guardando...' : bannerSaved ? <><CheckCircle className="w-4 h-4" />Actualizado</> : 'Actualizar banner'}
          </button>
        </div>
      </div>
    </AdminCard>
  );
}
