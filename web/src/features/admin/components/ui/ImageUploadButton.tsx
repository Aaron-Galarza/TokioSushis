'use client';

import { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { uploadImage } from '@/services/admin.service';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

interface Props {
  onUploaded: (url: string) => void;
  uploading: boolean;
  setUploading: (uploading: boolean) => void;
  disabled?: boolean;
}

export function ImageUploadButton({ onUploaded, uploading, setUploading, disabled = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Elegí una imagen JPG, PNG o WEBP.');
      return;
    }
    if (file.size === 0 || file.size > MAX_BYTES) {
      setError('La imagen debe pesar menos de 5 MB.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await uploadImage(formData);
      const url = response.data?.url;
      if (typeof url !== 'string' || !/^https?:\/\//.test(url)) {
        throw new Error('La API no devolvió una URL de imagen válida');
      }
      onUploaded(url);
    } catch {
      setError('No se pudo subir la imagen. Intentá nuevamente.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-w-0">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFile}
        className="hidden"
        disabled={uploading || disabled}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || disabled}
        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-primary/40 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-50"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
        {uploading ? 'Subiendo imagen...' : 'Elegir imagen del dispositivo'}
      </button>
      <p className="mt-1 text-[11px] text-white/35">JPG, PNG o WEBP · hasta 5 MB</p>
      {error && <p role="alert" className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
