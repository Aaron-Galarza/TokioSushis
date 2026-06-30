'use client';

interface AdminActionButtonsProps {
  active: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function AdminActionButtons({ active, onToggle, onEdit, onDelete }: AdminActionButtonsProps) {
  return (
    <div className="flex gap-2 shrink-0">
      <button 
        onClick={onToggle} 
        className={`text-xs px-2 py-1 rounded-lg transition-colors ${
          active 
            ? 'bg-white/5 text-white/50 hover:text-white' 
            : 'bg-green-900/50 text-green-300 hover:bg-green-900'
        }`}
      >
        {active ? 'Desactivar' : 'Activar'}
      </button>
      <button 
        onClick={onEdit} 
        className="text-xs text-white/40 hover:text-white px-2 py-1 bg-white/5 rounded-lg transition-colors"
      >
        Editar
      </button>
      <button 
        onClick={onDelete} 
        className="text-xs text-red-400/60 hover:text-red-300 px-2 py-1 bg-white/5 rounded-lg transition-colors"
      >
        Borrar
      </button>
    </div>
  );
}