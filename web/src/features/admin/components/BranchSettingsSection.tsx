'use client';

import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { fetchManagedBranch, updateManagedBranch } from '@/services/admin.service';
import { useBranchStore, type PublicBranch } from '@/stores/branch.store';
import { PAYMENT_LABELS, type PaymentKey } from '@/constants/admin';

export function BranchSettingsSection() {
  const [branch, setBranch] = useState<PublicBranch | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [origin, setOrigin] = useState('');
  const qrContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    fetchManagedBranch().then(setBranch).catch(() => setError('No se pudo cargar la sucursal.'));
  }, []);

  if (!branch) return <section className="rounded-xl border border-white/10 p-4">{error || 'Cargando sucursal...'}</section>;
  const update = (values: Partial<PublicBranch>) => { setBranch((current) => current ? { ...current, ...values } : current); setSaved(false); };
  const field = (label: string, value: string, onChange: (value: string) => void, type = 'text') =>
    <label className="block text-xs text-white/50">{label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)}
        className="mt-1 block w-full rounded-lg border border-white/15 bg-black/30 p-2 text-sm text-white" />
    </label>;

  const save = async () => {
    setError(''); setSaved(false);
    try {
      const updated = await updateManagedBranch({
        name: branch.name, address: branch.address, coordinates: branch.coordinates,
        timezone: branch.timezone, phone: branch.phone || '', whatsappPhone: branch.whatsappPhone || '',
        paymentMethods: branch.paymentMethods, transferAlias: branch.transferAlias || '', transferHolder: branch.transferHolder || '',
      });
      setBranch(updated); useBranchStore.getState().setBranch(updated); setSaved(true);
    } catch (err: any) { setError(err.response?.data?.error || 'No se pudo guardar la sucursal.'); }
  };

  const menuUrl = `${origin}/s/${branch.slug}`;
  const downloadQr = () => {
    const svg = qrContainer.current?.querySelector('svg');
    if (!svg) return;
    const file = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `menu-${branch.slug}-qr.svg`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  };

  return <section className="space-y-4 rounded-xl border border-white/10 bg-[#161616] p-5">
    <div><h2 className="font-semibold">Datos de la sucursal</h2><p className="text-xs text-white/40">URL del menú: {menuUrl}</p></div>
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-white/10 p-3">
      {origin && <div ref={qrContainer} className="rounded bg-white p-2"><QRCodeSVG value={menuUrl} size={160} marginSize={2} /></div>}
      <div className="space-y-2">
        <p className="text-xs text-white/60">Imprimí este QR para abrir el menú de esta sucursal.</p>
        <button type="button" onClick={downloadQr} className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white">Descargar QR</button>
      </div>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      {field('Nombre', branch.name, (name) => update({ name }))}
      {field('Dirección', branch.address, (address) => update({ address }))}
      {field('Latitud del local', String(branch.coordinates.lat), (lat) => update({ coordinates: { ...branch.coordinates, lat: Number(lat) } }), 'number')}
      {field('Longitud del local', String(branch.coordinates.lng), (lng) => update({ coordinates: { ...branch.coordinates, lng: Number(lng) } }), 'number')}
      {field('Zona horaria', branch.timezone, (timezone) => update({ timezone }))}
      {field('Teléfono', branch.phone || '', (phone) => update({ phone }))}
      {field('WhatsApp', branch.whatsappPhone || '', (whatsappPhone) => update({ whatsappPhone }))}
    </div>
    <div><p className="mb-2 text-xs text-white/50">Medios de pago disponibles</p>
      <div className="flex flex-wrap gap-4">{(Object.entries(PAYMENT_LABELS) as [PaymentKey, string][]).map(([method, label]) =>
        <label key={method} className="flex items-center gap-2 text-sm"><input type="checkbox"
          checked={branch.paymentMethods.includes(method)} onChange={(event) => update({ paymentMethods: event.target.checked
            ? [...branch.paymentMethods, method] : branch.paymentMethods.filter((value) => value !== method) })} />{label}</label>)}</div>
    </div>
    {branch.paymentMethods.includes('transferencia') && <div className="grid gap-3 sm:grid-cols-2">
      {field('Alias de transferencia', branch.transferAlias || '', (transferAlias) => update({ transferAlias }))}
      {field('Titular de la cuenta', branch.transferHolder || '', (transferHolder) => update({ transferHolder }))}
    </div>}
    {error && <p className="text-sm text-red-400">{error}</p>}
    {saved && <p className="text-sm text-green-400">Sucursal actualizada.</p>}
    <button onClick={save} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black">Guardar sucursal</button>
  </section>;
}
