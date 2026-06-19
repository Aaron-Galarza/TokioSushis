'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';

type Range = 'hoy' | 'ayer' | 'semana' | 'mes';

interface Analytics {
  total: number;
  efectivo: number;
  trans: number;
  entregados: number;
  topProduct: { title: string; quantity: number } | null;
}

const RANGES: Range[] = ['hoy', 'ayer', 'semana', 'mes'];

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>('hoy');
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/analytics?range=${range}`);
      setData(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-4">Analíticas</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {RANGES.map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${range === r ? 'bg-primary text-black' : 'bg-zinc-800 text-white/60 hover:text-white'}`}
          >
            {r}
          </button>
        ))}
      </div>
      {loading && <p className="text-white/40 text-sm">Cargando...</p>}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Total', value: `$${data.total.toLocaleString('es-AR')}` },
            { label: 'Efectivo', value: `$${data.efectivo.toLocaleString('es-AR')}` },
            { label: 'Transferencia / MP', value: `$${data.trans.toLocaleString('es-AR')}` },
            { label: 'Pedidos entregados', value: String(data.entregados) },
            {
              label: 'Top producto',
              value: data.topProduct
                ? `${data.topProduct.title} (${data.topProduct.quantity})`
                : '—',
            },
          ].map(item => (
            <div key={item.label} className="bg-zinc-900 border border-white/10 rounded-xl p-4">
              <p className="text-white/40 text-xs uppercase tracking-wide mb-1">{item.label}</p>
              <p className="text-white font-bold text-lg">{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
