'use client';

import { AdminActionButtons } from './AdminActionButtons';

interface AdminProductRowProps {
  product: {
    _id: string;
    title: string;
    price: number;
    image?: string;
    active: boolean;
    controlStock?: boolean;
    stock?: number;
  };
  catName: string;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function AdminProductRow({ product, catName, onToggle, onEdit, onDelete }: AdminProductRowProps) {
  return (
    <div className="flex items-center gap-3 bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-3 animate-in fade-in duration-100">
      {product.image && (
        <img src={product.image} alt={product.title} className="w-10 h-10 rounded-lg object-cover shrink-0 bg-zinc-900" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-semibold text-sm truncate ${product.active ? 'text-white' : 'text-white/40 line-through'}`}>
            {product.title}
          </p>
          {product.controlStock && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
              (product.stock ?? 0) > 0 ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'
            }`}>
              Stock: {product.stock ?? 0}
            </span>
          )}
        </div>
        <p className="text-[11px] text-white/30">
          {catName} · <span className="text-primary">${product.price?.toLocaleString('es-AR')}</span>
        </p>
      </div>
      
      <AdminActionButtons 
        active={product.active} 
        onToggle={onToggle} 
        onEdit={onEdit} 
        onDelete={onDelete} 
      />
    </div>
  );
}