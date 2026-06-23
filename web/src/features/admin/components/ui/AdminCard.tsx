interface AdminCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'inner';
}

export function AdminCard({ children, className = '', variant = 'default' }: AdminCardProps) {
  const base =
    variant === 'inner'
      ? 'bg-[#1A1A1A] border border-white/10 rounded-xl p-4'
      : 'bg-[#161616] border border-white/10 rounded-2xl p-5';
  return <div className={`${base} ${className}`}>{children}</div>;
}
