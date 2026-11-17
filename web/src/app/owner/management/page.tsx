'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Copy, UserPlus, Users } from 'lucide-react';
import axios from 'axios';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';

type Branch = { id: string; name: string; slug: string; address: string; active: boolean;
  coordinates: { lat: number; lng: number }; timezone: string; phone: string; whatsappPhone: string;
  paymentMethods: Payment[]; transferAlias: string; transferHolder: string };
type Staff = { id: string; name: string; email: string; role: 'admin' | 'encargado'; branchId: string; active: boolean };
type Credentials = { email: string; password: string; branchId: string };
type Management = { branches: Branch[]; users: Staff[] };
type Payment = 'cash' | 'debito' | 'credito' | 'transferencia';
const payments: { key: Payment; label: string }[] = [
  { key: 'cash', label: 'Efectivo' }, { key: 'debito', label: 'Débito' },
  { key: 'credito', label: 'Crédito' }, { key: 'transferencia', label: 'Transferencia' },
];
const field = 'h-11 w-full rounded-xl border border-white/15 bg-[#1b1b1b] px-3 text-sm text-white outline-none transition-colors focus:border-primary focus-visible:outline-2 focus-visible:outline-primary';
const label = 'block text-xs font-semibold text-white/60';
const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-black transition-colors hover:bg-[#e2cb9a] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';
const errorText = (error: unknown) => axios.isAxiosError(error)
  ? error.response?.data?.error || 'No se pudo completar la operación.' : 'No se pudo completar la operación.';

function StaffRow({ user, branches, onSaved, onCredentials }: { user: Staff; branches: Branch[]; onSaved: () => void; onCredentials: (credentials: Credentials | null) => void }) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [branchId, setBranchId] = useState(user.branchId);
  const [active, setActive] = useState(user.active);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const hasChanges = name !== user.name || role !== user.role || branchId !== user.branchId || active !== user.active;
  const save = async () => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length < 2 || name.length > 40) {
      setError('Usá entre 2 y 40 letras, números o guiones para el nombre de acceso.'); return;
    }
    onCredentials(null);
    setBusy(true); setError('');
    try {
      const res = await api.patch(`/owner/staff/${user.id}`, { name, role, branchId, active });
      if (res.data.data.password) onCredentials(res.data.data);
      onSaved();
    }
    catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  };
  const resetCredentials = async () => {
    onCredentials(null);
    setBusy(true); setError('');
    try { const res = await api.post(`/owner/staff/${user.id}/credentials`); onCredentials(res.data.data); onSaved(); }
    catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  };
  return <div className="rounded-xl border border-white/10 bg-[#1b1b1b] p-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><p className="font-semibold text-white">{user.email}</p><p className="mt-1 text-xs text-white/45">{user.active ? 'Acceso activo' : 'Acceso desactivado'}</p></div>
      <span className={`rounded-full px-2.5 py-1 text-xs ${user.active ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/10 text-white/50'}`}>{user.active ? 'Activo' : 'Inactivo'}</span>
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
      <label className={label}>Nombre de acceso<input required minLength={2} maxLength={40} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={name} onChange={(event) => setName(event.target.value.toLowerCase())} className={`mt-1.5 ${field}`} /></label>
      <label className={label}>Rol<select className={`mt-1.5 ${field}`} value={role} onChange={(event) => setRole(event.target.value as Staff['role'])}><option value="admin">Admin</option><option value="encargado">Encargado</option></select></label>
      <label className={label}>Sucursal<select className={`mt-1.5 ${field}`} value={branchId} onChange={(event) => setBranchId(event.target.value)}>{branches.map((branch) => <option key={branch.id} value={branch.id} disabled={!branch.active}>{branch.name}</option>)}</select></label>
      <button type="button" onClick={save} disabled={busy || !name || !hasChanges} className={button}>Guardar</button>
    </div>
    <p className="mt-2 text-xs text-white/45">Correo resultante: {name}-{role}@tokyosushis.com</p>
    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
      <label className="flex cursor-pointer items-center gap-2 text-white/70"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} className="accent-primary" /> Acceso activo</label>
      <button type="button" onClick={resetCredentials} disabled={busy || hasChanges} className="font-semibold text-primary underline underline-offset-4 disabled:opacity-50">Preparar mensaje de acceso</button>
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
  </div>;
}

function BranchRow({ branch, onSaved }: { branch: Branch; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(branch);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await api.put(`/owner/branches/${branch.id}`, { name: form.name, address: form.address,
        coordinates: form.coordinates, timezone: form.timezone, phone: form.phone,
        whatsappPhone: form.whatsappPhone, paymentMethods: form.paymentMethods,
        transferAlias: form.transferAlias, transferHolder: form.transferHolder });
      setEditing(false); onSaved();
    } catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  };
  return <div className="rounded-xl border border-white/10 bg-[#1b1b1b] p-4">
    <div className="flex items-start justify-between gap-3"><div><strong>{branch.name}</strong><p className="mt-1 text-sm text-white/45">{branch.address}</p><p className="mt-1 text-xs text-primary">/s/{branch.slug} · {branch.active ? 'Activa' : 'Inactiva'}</p></div><button type="button" onClick={() => { setEditing(!editing); setForm(branch); setError(''); }} className="min-h-11 shrink-0 rounded-lg border border-white/20 px-3 text-sm text-white/75 hover:border-primary hover:text-primary">{editing ? 'Cerrar' : 'Editar'}</button></div>
    {editing && <form onSubmit={save} className="mt-5 space-y-3 border-t border-white/10 pt-5">
      <label className={label}>Nombre<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={`mt-1.5 ${field}`} /></label>
      <label className={label}>Dirección<input required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className={`mt-1.5 ${field}`} /></label>
      <div className="grid gap-3 sm:grid-cols-2"><label className={label}>Latitud<input required type="number" step="any" min="-90" max="90" value={form.coordinates.lat} onChange={(event) => setForm({ ...form, coordinates: { ...form.coordinates, lat: Number(event.target.value) } })} className={`mt-1.5 ${field}`} /></label><label className={label}>Longitud<input required type="number" step="any" min="-180" max="180" value={form.coordinates.lng} onChange={(event) => setForm({ ...form, coordinates: { ...form.coordinates, lng: Number(event.target.value) } })} className={`mt-1.5 ${field}`} /></label></div>
      <label className={label}>Zona horaria<input required value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} className={`mt-1.5 ${field}`} /></label>
      <div className="grid gap-3 sm:grid-cols-2"><label className={label}>Teléfono<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={`mt-1.5 ${field}`} /></label><label className={label}>WhatsApp<input value={form.whatsappPhone} onChange={(event) => setForm({ ...form, whatsappPhone: event.target.value })} className={`mt-1.5 ${field}`} /></label></div>
      <fieldset><legend className={label}>Métodos de pago</legend><div className="mt-2 flex flex-wrap gap-2">{payments.map(({ key, label: text }) => <label key={key} className="flex min-h-11 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm"><input type="checkbox" checked={form.paymentMethods.includes(key)} onChange={(event) => setForm({ ...form, paymentMethods: event.target.checked ? [...form.paymentMethods, key] : form.paymentMethods.filter((value) => value !== key) })} className="accent-primary" />{text}</label>)}</div></fieldset>
      {form.paymentMethods.includes('transferencia') && <div className="grid gap-3 sm:grid-cols-2"><label className={label}>Alias<input required value={form.transferAlias} onChange={(event) => setForm({ ...form, transferAlias: event.target.value })} className={`mt-1.5 ${field}`} /></label><label className={label}>Titular<input required value={form.transferHolder} onChange={(event) => setForm({ ...form, transferHolder: event.target.value })} className={`mt-1.5 ${field}`} /></label></div>}
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <button type="submit" disabled={busy || !form.paymentMethods.length} className={button}>Guardar cambios</button>
    </form>}
  </div>;
}

export default function OwnerManagementPage() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const [authorized, setAuthorized] = useState(false);
  const [authConnectionError, setAuthConnectionError] = useState(false);
  const [data, setData] = useState<Management | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [accessMessage, setAccessMessage] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [branch, setBranch] = useState({ name: '', slug: '', address: '', lat: '', lng: '', timezone: 'America/Argentina/Buenos_Aires', phone: '', whatsappPhone: '', copyCatalogFrom: '', transferAlias: '', transferHolder: '' });
  const [selectedPayments, setSelectedPayments] = useState<Payment[]>(['cash', 'debito', 'credito']);
  const [staff, setStaff] = useState({ name: '', role: 'admin' as Staff['role'], branchId: '' });

  const load = useCallback(async () => {
    const res = await api.get('/owner/management');
    setData(res.data.data);
  }, []);
  useEffect(() => {
    api.get('/users/me').then((res) => {
      if (res.data.data?.role !== 'owner') { logout(); return router.replace('/login'); }
      setAuthorized(true);
      load().catch((cause) => setError(errorText(cause)));
    }).catch((cause) => {
      if (cause.response?.status === 401 || cause.response?.status === 403) { logout(); router.replace('/login'); }
      else setAuthConnectionError(true);
    });
  }, [load, logout, router]);

  const createBranch = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await api.post('/owner/branches', { name: branch.name, slug: branch.slug, address: branch.address,
        coordinates: { lat: Number(branch.lat), lng: Number(branch.lng) }, timezone: branch.timezone,
        phone: branch.phone, whatsappPhone: branch.whatsappPhone, paymentMethods: selectedPayments,
        transferAlias: branch.transferAlias, transferHolder: branch.transferHolder,
        ...(branch.copyCatalogFrom ? { copyCatalogFrom: branch.copyCatalogFrom } : {}) });
      setBranch({ name: '', slug: '', address: '', lat: '', lng: '', timezone: 'America/Argentina/Buenos_Aires', phone: '', whatsappPhone: '', copyCatalogFrom: '', transferAlias: '', transferHolder: '' });
      await load();
    } catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  };
  const createStaff = async (event: React.FormEvent) => {
    setAccessMessage(''); setCopyStatus('');
    event.preventDefault(); setBusy(true); setError('');
    try {
      const res = await api.post('/owner/staff', staff);
      showCredentials(res.data.data);
      setStaff({ name: '', role: 'admin', branchId: '' });
      await load();
    } catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  };
  const showCredentials = (credentials: Credentials | null) => {
    if (!credentials) { setAccessMessage(''); setCopyStatus(''); return; }
    const branchName = data?.branches.find((item) => item.id === credentials.branchId)?.name;
    setAccessMessage(`Hola, ya tenés acceso al panel de Tokyo Sushis${branchName ? ` (${branchName})` : ''}.\n\nIngresá en: ${window.location.origin}/login\nUsuario: ${credentials.email}\nContraseña: ${credentials.password}`);
    setCopyStatus('');
  };
  const copyMessage = async () => {
    try { await navigator.clipboard.writeText(accessMessage); setCopyStatus('Mensaje copiado. Pegalo en WhatsApp.'); }
    catch { setCopyStatus('No se pudo copiar. Seleccioná el mensaje y copialo manualmente.'); }
  };

  if (!authorized) return <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#090909] px-5 text-center text-white/50">
    {authConnectionError ? <><p>No se pudo conectar con el servidor. Verificá que la API esté encendida.</p><button onClick={() => window.location.reload()} className="text-primary underline">Reintentar</button></> : 'Verificando acceso…'}
  </main>;
  return <main className="min-h-screen bg-[#090909] px-4 py-7 text-white sm:px-6 lg:py-10">
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="border-b border-white/10 pb-6">
        <Link href="/owner" className="inline-flex min-h-11 items-center gap-2 text-sm text-white/55 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"><ArrowLeft size={17} aria-hidden="true" /> Volver a estadísticas</Link>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-primary">Tokyo Sushis / Dirección</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold sm:text-4xl">Administración</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">Creá locales y administrá el acceso del equipo. Cada cuenta operativa pertenece a una sola sucursal.</p>
      </header>
      {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{error}</p>}
      {accessMessage && <div role="status" className="rounded-2xl border border-primary/35 bg-primary/10 p-5">
        <p className="font-semibold text-primary">Credenciales listas</p><p className="mt-1 text-sm text-white/65">Copiá este mensaje y envialo por WhatsApp. Si cerrás esta pantalla, podés volver a preparar el mensaje desde la cuenta.</p>
        <textarea readOnly value={accessMessage} aria-label="Mensaje para WhatsApp" rows={5} className="mt-4 min-h-32 w-full resize-y rounded-xl border border-white/15 bg-[#1b1b1b] px-3 py-3 text-sm text-white outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-primary" />
        <button type="button" onClick={copyMessage} className={`${button} mt-3`}><Copy size={16} aria-hidden="true" /> Copiar mensaje para WhatsApp</button>
        {copyStatus && <p className="mt-2 text-sm text-white/70">{copyStatus}</p>}
      </div>}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-[#151515] p-5 sm:p-6" aria-labelledby="branches-title">
          <div className="flex items-center gap-3"><span className="rounded-xl bg-primary/10 p-2.5 text-primary"><Building2 size={20} aria-hidden="true" /></span><div><h2 id="branches-title" className="font-heading text-xl font-semibold">Sucursales</h2><p className="text-xs text-white/45">{data?.branches.length ?? 0} locales registrados</p></div></div>
          <div className="mt-5 space-y-2">{data?.branches.map((item) => <BranchRow key={item.id} branch={item} onSaved={() => load().catch((cause) => setError(errorText(cause)))} />)}</div>
          <form onSubmit={createBranch} className="mt-7 space-y-4 border-t border-white/10 pt-6">
            <h3 className="font-heading text-lg">Nueva sucursal</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>Nombre<input required minLength={2} maxLength={120} value={branch.name} onChange={(event) => setBranch({ ...branch, name: event.target.value })} className={`mt-1.5 ${field}`} /></label>
              <label className={label}>Identificador para la URL<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={branch.slug} onChange={(event) => setBranch({ ...branch, slug: event.target.value.toLowerCase() })} className={`mt-1.5 ${field}`} placeholder="tokio-centro" /></label>
            </div>
            <label className={label}>Dirección<input required maxLength={200} value={branch.address} onChange={(event) => setBranch({ ...branch, address: event.target.value })} className={`mt-1.5 ${field}`} /></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className={label}>Latitud<input required type="number" step="any" min="-90" max="90" value={branch.lat} onChange={(event) => setBranch({ ...branch, lat: event.target.value })} className={`mt-1.5 ${field}`} /></label><label className={label}>Longitud<input required type="number" step="any" min="-180" max="180" value={branch.lng} onChange={(event) => setBranch({ ...branch, lng: event.target.value })} className={`mt-1.5 ${field}`} /></label></div>
            <div className="grid gap-4 sm:grid-cols-2"><label className={label}>Teléfono<input value={branch.phone} onChange={(event) => setBranch({ ...branch, phone: event.target.value })} className={`mt-1.5 ${field}`} /></label><label className={label}>WhatsApp<input value={branch.whatsappPhone} onChange={(event) => setBranch({ ...branch, whatsappPhone: event.target.value })} className={`mt-1.5 ${field}`} /></label></div>
            <label className={label}>Zona horaria<input required value={branch.timezone} onChange={(event) => setBranch({ ...branch, timezone: event.target.value })} className={`mt-1.5 ${field}`} /></label>
            <fieldset><legend className={label}>Métodos de pago</legend><div className="mt-2 flex flex-wrap gap-3">{payments.map(({ key, label: text }) => <label key={key} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-white/70"><input type="checkbox" checked={selectedPayments.includes(key)} onChange={(event) => setSelectedPayments(event.target.checked ? [...selectedPayments, key] : selectedPayments.filter((value) => value !== key))} className="accent-primary" />{text}</label>)}</div></fieldset>
            {selectedPayments.includes('transferencia') && <div className="grid gap-4 sm:grid-cols-2"><label className={label}>Alias de transferencia<input required value={branch.transferAlias} onChange={(event) => setBranch({ ...branch, transferAlias: event.target.value })} className={`mt-1.5 ${field}`} /></label><label className={label}>Titular<input required value={branch.transferHolder} onChange={(event) => setBranch({ ...branch, transferHolder: event.target.value })} className={`mt-1.5 ${field}`} /></label></div>}
            <label className={label}>Catálogo inicial<select value={branch.copyCatalogFrom} onChange={(event) => setBranch({ ...branch, copyCatalogFrom: event.target.value })} className={`mt-1.5 ${field}`}><option value="">Empezar con el menú vacío</option>{data?.branches.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>Copiar productos de {item.name}</option>)}</select></label>
            <p className="text-xs leading-relaxed text-white/45">Se copian categorías, productos y adicionales. Luego cada sucursal puede cambiar su menú por separado. Revisá horarios y envío antes de recibir pedidos.</p>
            <button type="submit" disabled={busy || !selectedPayments.length} className={button}><Building2 size={16} aria-hidden="true" /> Crear sucursal</button>
          </form>
        </section>
        <section className="rounded-2xl border border-white/10 bg-[#151515] p-5 sm:p-6" aria-labelledby="staff-title">
          <div className="flex items-center gap-3"><span className="rounded-xl bg-primary/10 p-2.5 text-primary"><Users size={20} aria-hidden="true" /></span><div><h2 id="staff-title" className="font-heading text-xl font-semibold">Equipo</h2><p className="text-xs text-white/45">Admin y Encargado por sucursal</p></div></div>
          <form onSubmit={createStaff} className="mt-6 space-y-4 rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
            <h3 className="font-heading text-lg">Crear usuario</h3>
            <label className={label}>Nombre de acceso<input required minLength={2} maxLength={40} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={staff.name} onChange={(event) => setStaff({ ...staff, name: event.target.value.toLowerCase() })} className={`mt-1.5 ${field}`} placeholder="facu" /></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className={label}>Rol<select value={staff.role} onChange={(event) => setStaff({ ...staff, role: event.target.value as Staff['role'] })} className={`mt-1.5 ${field}`}><option value="admin">Admin</option><option value="encargado">Encargado</option></select></label><label className={label}>Sucursal<select required value={staff.branchId} onChange={(event) => setStaff({ ...staff, branchId: event.target.value })} className={`mt-1.5 ${field}`}><option value="">Elegí una sucursal</option>{data?.branches.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
            <p className="text-xs text-white/45">Correo resultante: {staff.name || 'nombre'}-{staff.role}@tokyosushis.com. Se generará una contraseña automáticamente.</p>
            <button type="submit" disabled={busy || !staff.branchId} className={button}><UserPlus size={16} aria-hidden="true" /> Crear usuario</button>
          </form>
          <div className="mt-6 space-y-3">{data?.users.length ? data.users.map((user) => <StaffRow key={user.id} user={user} branches={data.branches} onSaved={() => load().catch((cause) => setError(errorText(cause)))} onCredentials={showCredentials} />) : <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-white/45">Todavía no hay usuarios operativos.</p>}</div>
        </section>
      </div>
    </div>
  </main>;
}
