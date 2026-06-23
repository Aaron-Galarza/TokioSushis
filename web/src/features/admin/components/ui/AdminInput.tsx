import { TextareaHTMLAttributes, SelectHTMLAttributes, InputHTMLAttributes } from 'react';

const BASE = 'bg-[#0A0A0A] text-white px-3 py-2.5 rounded-lg border border-white/10 focus:outline-none focus:border-primary/60 text-sm placeholder:text-white/25';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  children: React.ReactNode;
}

export function AdminInput({ className = '', ...props }: InputProps) {
  return <input className={`${BASE} w-full ${className}`} {...props} />;
}

export function AdminTextarea({ className = '', ...props }: TextareaProps) {
  return <textarea className={`${BASE} w-full resize-none ${className}`} {...props} />;
}

export function AdminSelect({ className = '', children, ...props }: SelectProps) {
  return (
    <select className={`${BASE} w-full ${className}`} {...props}>
      {children}
    </select>
  );
}
