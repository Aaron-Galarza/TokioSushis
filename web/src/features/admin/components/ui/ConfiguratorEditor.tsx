'use client';

import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { AdminInput, AdminSelect } from './AdminInput';
import type { Configurator, ConfigStep, ConfigOption } from '@/types';

interface ConfiguratorEditorProps {
  value: Configurator;
  onChange: (next: Configurator) => void;
}

const slug = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);

const LABEL = 'text-[10px] text-white/35 uppercase tracking-wider';

export function ConfiguratorEditor({ value, onChange }: ConfiguratorEditorProps) {
  const steps = value.steps ?? [];

  const patch = (p: Partial<Configurator>) => onChange({ ...value, ...p });

  const setStep = (i: number, p: Partial<ConfigStep>) =>
    onChange({ ...value, steps: steps.map((s, idx) => (idx === i ? { ...s, ...p } : s)) });

  const addStep = () =>
    onChange({
      ...value,
      steps: [
        ...steps,
        {
          id: `step-${steps.length + 1}`,
          label: 'Nuevo paso',
          title: 'Nuevo paso',
          description: '',
          type: 'single',
          mode: 'delta',
          min: 0,
          max: 0,
          required: false,
          options: [],
        },
      ],
    });

  const removeStep = (i: number) => onChange({ ...value, steps: steps.filter((_, idx) => idx !== i) });

  const moveStep = (i: number, dir: -1 | 1) => {
    const target = i + dir;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[i], next[target]] = [next[target], next[i]];
    onChange({ ...value, steps: next });
  };

  const setOption = (si: number, oi: number, p: Partial<ConfigOption>) => {
    const step = steps[si];
    const options = step.options.map((o, idx) => (idx === oi ? { ...o, ...p } : o));
    setStep(si, { options });
  };

  const addOption = (si: number) => {
    const step = steps[si];
    setStep(si, {
      options: [
        ...step.options,
        {
          id: `opt-${step.options.length + 1}`,
          label: 'Nueva opción',
          description: '',
          price: 0,
          kind: 'selection',
          isExtra: false,
          defaultSelected: false,
          active: true,
        },
      ],
    });
  };

  const removeOption = (si: number, oi: number) =>
    setStep(si, { options: steps[si].options.filter((_, idx) => idx !== oi) });

  return (
    <div className="border border-white/10 rounded-xl p-3 bg-[#111] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Configurador</p>
          <p className="text-[11px] text-white/35">Producto armable con pasos y opciones</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => patch({ enabled: e.target.checked })}
            className="accent-primary"
          />
          Habilitado
        </label>
      </div>

      {value.enabled && (
        <>
          <div>
            <label className={LABEL}>Clave (key)</label>
            <AdminInput
              placeholder="woks, tablas-clasicas..."
              value={value.key}
              onChange={(e) => patch({ key: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            {steps.map((step, si) => (
              <div key={si} className="border border-white/10 rounded-xl p-3 bg-[#161616] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-primary">Paso {si + 1}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => moveStep(si, -1)} disabled={si === 0} className="p-1 text-white/40 hover:text-white disabled:opacity-20" title="Subir">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => moveStep(si, 1)} disabled={si === steps.length - 1} className="p-1 text-white/40 hover:text-white disabled:opacity-20" title="Bajar">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => removeStep(si)} className="p-1 text-red-300/70 hover:text-red-200" title="Eliminar paso">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={LABEL}>ID</label>
                    <AdminInput value={step.id} onChange={(e) => setStep(si, { id: slug(e.target.value) || e.target.value })} />
                  </div>
                  <div>
                    <label className={LABEL}>Etiqueta (stepper)</label>
                    <AdminInput value={step.label} onChange={(e) => setStep(si, { label: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className={LABEL}>Título</label>
                  <AdminInput value={step.title} onChange={(e) => setStep(si, { title: e.target.value })} />
                </div>

                <div>
                  <label className={LABEL}>Descripción</label>
                  <AdminInput value={step.description ?? ''} onChange={(e) => setStep(si, { description: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className={LABEL}>Tipo</label>
                    <AdminSelect value={step.type} onChange={(e) => setStep(si, { type: e.target.value as ConfigStep['type'] })}>
                      <option value="single">Única</option>
                      <option value="multiple">Múltiple</option>
                    </AdminSelect>
                  </div>
                  <div>
                    <label className={LABEL}>Modo precio</label>
                    <AdminSelect value={step.mode} onChange={(e) => setStep(si, { mode: e.target.value as ConfigStep['mode'] })}>
                      <option value="delta">Suma (+)</option>
                      <option value="absolute">Reemplaza</option>
                    </AdminSelect>
                  </div>
                  <div>
                    <label className={LABEL}>Mín</label>
                    <AdminInput type="number" min={0} value={step.min} onChange={(e) => setStep(si, { min: Number(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className={LABEL}>Máx (0 = sin límite)</label>
                    <AdminInput type="number" min={0} value={step.max} onChange={(e) => setStep(si, { max: Number(e.target.value) || 0 })} />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                  <input type="checkbox" checked={step.required} onChange={(e) => setStep(si, { required: e.target.checked })} className="accent-primary" />
                  Obligatorio
                </label>

                {/* Opciones */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={LABEL}>Opciones ({step.options.length})</span>
                    <button type="button" onClick={() => addOption(si)} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80">
                      <Plus className="w-3.5 h-3.5" /> Agregar
                    </button>
                  </div>

                  {step.options.map((o, oi) => (
                    <div key={oi} className="border border-white/10 rounded-lg p-2 bg-[#0F0F0F] space-y-2">
                      <div className="flex items-center gap-2">
                        <AdminInput value={o.id} onChange={(e) => setOption(si, oi, { id: slug(e.target.value) || e.target.value })} className="flex-1" placeholder="id" />
                        <button type="button" onClick={() => removeOption(si, oi)} className="p-1 text-red-300/70 hover:text-red-200 shrink-0" title="Eliminar opción">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <AdminInput value={o.label} onChange={(e) => setOption(si, oi, { label: e.target.value })} placeholder="Nombre" />
                      <AdminInput value={o.description ?? ''} onChange={(e) => setOption(si, oi, { description: e.target.value })} placeholder="Descripción (opcional)" />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={LABEL}>Precio</label>
                          <AdminInput type="number" min={0} value={o.price} onChange={(e) => setOption(si, oi, { price: Number(e.target.value) || 0 })} />
                        </div>
                        <div>
                          <label className={LABEL}>Rol</label>
                          <AdminSelect value={o.kind} onChange={(e) => setOption(si, oi, { kind: e.target.value as ConfigOption['kind'] })}>
                            <option value="selection">Selección</option>
                            <option value="exclusion">Exclusión (sin...)</option>
                          </AdminSelect>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-white/50 cursor-pointer">
                          <input type="checkbox" checked={!!o.isExtra} onChange={(e) => setOption(si, oi, { isExtra: e.target.checked })} className="accent-primary" /> Extra (+)
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-white/50 cursor-pointer">
                          <input type="checkbox" checked={!!o.defaultSelected} onChange={(e) => setOption(si, oi, { defaultSelected: e.target.checked })} className="accent-primary" /> Por defecto
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-white/50 cursor-pointer">
                          <input type="checkbox" checked={o.active !== false} onChange={(e) => setOption(si, oi, { active: e.target.checked })} className="accent-primary" /> Activa
                        </label>
                      </div>
                    </div>
                  ))}

                  {step.options.length === 0 && (
                    <p className="text-[11px] text-white/25 italic">Sin opciones todavía.</p>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addStep}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg px-3 py-2 hover:bg-primary/10"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar paso
            </button>
          </div>
        </>
      )}
    </div>
  );
}
