import { Minus, Plus } from 'lucide-react';

interface StepperProps {
  value: number;
  onIncrease: () => void;
  onDecrease: () => void;
  minValue?: number;
  size?: 'sm' | 'lg';
}

export const Stepper = ({ value, onIncrease, onDecrease, minValue = 0, size = 'sm' }: StepperProps) => {
  const isLg = size === 'lg';

  return (
    <div className={`flex items-center border border-white/10 bg-white/5 ${isLg ? 'gap-4 p-2 rounded-2xl' : 'gap-3 p-1 rounded-full'}`}>
      <button
        onClick={onDecrease}
        disabled={value <= minValue}
        className={`transition flex items-center justify-center ${isLg ? 'p-2 rounded-xl' : 'p-1.5 rounded-full'} ${value > minValue ? 'bg-white/10 text-white hover:bg-white/20' : 'text-white/20 cursor-not-allowed'}`}
      >
        <Minus className={isLg ? 'w-5 h-5' : 'w-4 h-4'} />
      </button>
      
      <span className={`w-4 text-center font-bold text-white ${isLg ? 'text-lg' : 'text-sm'}`}>
        {value}
      </span>
      
      <button
        onClick={onIncrease}
        className={`transition flex items-center justify-center bg-white/10 text-white hover:bg-white/20 ${isLg ? 'p-2 rounded-xl' : 'p-1.5 rounded-full'}`}
      >
        <Plus className={isLg ? 'w-5 h-5' : 'w-4 h-4'} />
      </button>
    </div>
  );
};