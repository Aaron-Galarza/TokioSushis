import {
  Clock, Package, CheckCircle, Truck, XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Estados reales de la DB ─────────────────────────────────────────────────
export type OrderStatusKey = 'pending' | 'in-preparation' | 'ready' | 'delivered' | 'cancelled';

export interface StatusConfig {
  label: string;
  pluralLabel: string;
  dot: string;
  badge: string;
  tabColor: string;
  icon: LucideIcon;
}

export const ORDER_STATUS: Record<OrderStatusKey, StatusConfig> = {
  pending: {
    label:       'Pendiente',
    pluralLabel: 'Pendientes',
    dot:         'bg-yellow-400',
    badge:       'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
    tabColor:    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon:        Clock,
  },
  'in-preparation': {
    label:       'En Proceso',
    pluralLabel: 'En Proceso',
    dot:         'bg-blue-400',
    badge:       'bg-blue-500/15 text-blue-400 border-blue-500/25',
    tabColor:    'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon:        Package,
  },
  ready: {
    label:       'Terminado',
    pluralLabel: 'Terminados',
    dot:         'bg-green-400',
    badge:       'bg-green-500/15 text-green-400 border-green-500/25',
    tabColor:    'bg-green-500/20 text-green-400 border-green-500/30',
    icon:        CheckCircle,
  },
  delivered: {
    label:       'Entregado',
    pluralLabel: 'Entregados',
    dot:         'bg-emerald-500',
    badge:       'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    tabColor:    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon:        Truck,
  },
  cancelled: {
    label:       'Cancelado',
    pluralLabel: 'Cancelados',
    dot:         'bg-red-500',
    badge:       'bg-red-500/15 text-red-400 border-red-500/25',
    tabColor:    'bg-red-500/20 text-red-400 border-red-500/30',
    icon:        XCircle,
  },
};

// ── Transiciones de estado (botón "siguiente paso") ─────────────────────────
export const STATUS_TRANSITIONS: Partial<Record<OrderStatusKey, { label: string; next: OrderStatusKey }>> = {
  pending:          { label: 'Iniciar proceso', next: 'in-preparation' },
  'in-preparation': { label: 'Marcar listo',    next: 'ready' },
  ready:            { label: 'Entregado',       next: 'delivered' },
};