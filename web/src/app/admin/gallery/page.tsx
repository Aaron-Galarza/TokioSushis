'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Copy, Check, ImageIcon, Loader2 } from 'lucide-react';
import api from '@/services/api';

interface GalleryImage {
  url: string;
  filename?: string;
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = async () => {
    try {
      const res = await api.get('/gallery');
      const data: unknown[] = res.data.data ?? [];
      setImages(
        data.map((item) =>
          typeof item === 'string'
            ? { url: item, filename: (item as string).split('/').pop() }
            : (item as GalleryImage)
        )
      );
    } catch {
      /* gallery may be empty */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchImages(); }, []);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleUpload = async (file: File) => {
    setUploadError('');
    if (!file.type.startsWith('image/')) {
      setUploadError('El archivo no es una imagen válida.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('El archivo supera el límite de 5 MB.');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      await api.post('/gallery/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetchImages();
    } catch {
      setUploadError('Error al subir la imagen. Intentá de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="bg-[#161616] rounded-xl p-6 border border-[#2A2A2A]">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white text-xl">Galería de Imágenes</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {images.length} imágenes · JPG, PNG o WEBP · Máx. 5 MB
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-black px-4 py-2 rounded-lg transition-all text-sm font-semibold"
        >
          <Upload className="w-4 h-4" />
          Subir imagen
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 mb-6 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-[#2A2A2A] hover:border-primary/40 hover:bg-white/[0.02]'
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-white">Subiendo y optimizando imagen...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="w-10 h-10 text-muted-foreground" />
            <p className="text-white">Arrastrá tu imagen aquí o hacé click para seleccionar</p>
            <p className="text-muted-foreground text-sm">JPG, PNG o WEBP — Máx. 5 MB</p>
          </div>
        )}
      </div>

      {uploadError && <p className="text-red-400 text-sm mb-4">{uploadError}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No hay imágenes en la galería</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, i) => (
            <div
              key={i}
              className="relative group bg-[#1A1A1A] rounded-xl overflow-hidden border border-[#2A2A2A]"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={image.url}
                  alt={image.filename ?? `imagen-${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                <button
                  onClick={() => handleCopy(image.url)}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-black px-4 py-2 rounded-lg text-sm w-full justify-center transition-all font-semibold"
                >
                  {copiedUrl === image.url ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedUrl === image.url ? 'Copiado' : 'Copiar URL'}
                </button>
              </div>

              {/* Filename bar */}
              <div className="p-2 bg-[#111]">
                <p className="text-white text-xs truncate">{image.filename ?? `imagen-${i + 1}`}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
