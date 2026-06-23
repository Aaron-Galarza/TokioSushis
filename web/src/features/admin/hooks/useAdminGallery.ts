'use client';

import { useState, useCallback, useRef } from 'react';
import { fetchGallery, uploadImage, deleteGalleryImage } from '@/services/admin.service';

interface GImg { _id: string; url: string; filename: string }

export function useAdminGallery() {
  const [images, setImages] = useState<GImg[]>([]);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    try { setImages(await fetchGallery()); } catch {}
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      await uploadImage(fd);
      await reload();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar?')) return;
    await deleteGalleryImage(id);
    setImages(prev => prev.filter(i => i._id !== id));
  };

  const copyUrl = async (id: string, url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return { images, uploading, copiedId, fileRef, reload, handleUpload, remove, copyUrl };
}
