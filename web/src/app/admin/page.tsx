'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  BarChart3, ShoppingBag, Utensils, Tag, Settings, ImageIcon,
  TrendingUp, DollarSign, CreditCard, Trophy,
  Clock, User, Phone, MapPin, ChevronDown, ChevronUp,
  Power, AlertCircle, Plus, Trash2, Upload, Copy, Check, X, Loader2,
  CloudRain, Sun, CheckCircle, Route,
} from 'lucide-react';
import api from '@/services/api';

// ── Types ──────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'orders' | 'menu' | 'coupons' | 'gallery' | 'config';
type SF   = 'pending' | 'in-preparation' | 'completed' | 'cancelled';
type Rng  = 'hoy' | 'ayer' | 'semana' | 'mes';
interface KmRange    { _id: string; maxKm: number; price: number }
interface SZone      { _id: string; name: string; lat: number; lng: number; radiusMeters: number; price: number }
interface DaySch     { day: string; openTime: string; closeTime: string; isStoreOpen: boolean }
interface GImg       { _id: string; url: string; filename: string }

// ── Constants ──────────────────────────────────────────────────────────────────
const SDAYS  = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const CDAYS  = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DS: Record<string,string> = { monday:'Lun',tuesday:'Mar',wednesday:'Mié',thursday:'Jue',friday:'Vie',saturday:'Sáb',sunday:'Dom' };
const PAYS   = ['cash','transfer','mercadopago'];

const SDOT: Record<string,string>  = { pending:'bg-yellow-400','in-preparation':'bg-blue-400',ready:'bg-green-400',delivered:'bg-green-600',cancelled:'bg-red-500' };
const SNX: Record<string,{l:string;v:string}> = {
  pending:{l:'Iniciar',v:'in-preparation'},
  'in-preparation':{l:'Marcar listo',v:'ready'},
  ready:{l:'Entregado',v:'delivered'},
};
const STABS: {key:SF;label:string;dot:string}[] = [
  {key:'pending',label:'Pendientes',dot:'bg-yellow-400'},
  {key:'in-preparation',label:'En Proceso',dot:'bg-blue-400'},
  {key:'completed',label:'Terminados',dot:'bg-green-400'},
  {key:'cancelled',label:'Cancelados',dot:'bg-red-500'},
];
const NAVT = [
  {k:'overview'as Tab,l:'Vista General',I:BarChart3},
  {k:'orders'as Tab,l:'Pedidos',I:ShoppingBag},
  {k:'menu'as Tab,l:'Menú',I:Utensils},
  {k:'coupons'as Tab,l:'Cupones',I:Tag},
  {k:'gallery'as Tab,l:'Galería',I:ImageIcon},
  {k:'config'as Tab,l:'Configuración',I:Settings},
];

const IC   = 'bg-[#0A0A0A] text-white px-3 py-2.5 rounded-lg border border-white/10 focus:outline-none focus:border-primary/60 text-sm w-full placeholder:text-white/25';
const CARD = 'bg-[#161616] border border-white/10 rounded-2xl p-5';
const INN  = 'bg-[#1A1A1A] border border-white/10 rounded-xl p-4';

// ── Module-level OrderRow ──────────────────────────────────────────────────────
interface ORProps {
  order: any;
  expanded: boolean;
  onToggle: () => void;
  onStatus: (id: string, s: string) => void;
}
function OrderRow({ order, expanded, onToggle, onStatus }: ORProps) {
  const dot  = SDOT[order.status] || 'bg-zinc-600';
  const num  = String(order.orderNumber || order._id?.slice(-4) || '0').padStart(4,'0');
  const dt   = new Date(order.createdAt);
  const payL = order.paymentMethod==='cash'?'Efectivo':order.paymentMethod==='transfer'?'Transferencia':'Mercado Pago';
  return (
    <div className="py-3.5 border-b border-white/5 last:border-0">
      <div className="flex items-start gap-3">
        <div className={`mt-2 w-2 h-2 rounded-full shrink-0 ${dot}`} />
        <div className="shrink-0 w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-white/30" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-white text-sm">{order.customer?.name}</span>
            <span className="text-white/20 text-xs">#{num}</span>
          </div>
          <div className="flex items-center gap-3 text-white/30 text-[11px] mt-0.5 flex-wrap">
            <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5"/>{order.customer?.phone}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5"/>
              {dt.toLocaleDateString('es-AR')} {dt.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <span className="font-bold text-primary text-sm">${order.total?.toLocaleString('es-AR')}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${order.deliveryType==='delivery'?'bg-blue-900/50 text-blue-300':'bg-green-900/50 text-green-300'}`}>
            {order.deliveryType==='delivery'?'Delivery':'Retiro'}
          </span>
          <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">{payL}</span>
          <button onClick={onToggle} className="text-white/25 hover:text-white/60 transition-colors">
            {expanded?<ChevronUp className="w-4 h-4"/>:<ChevronDown className="w-4 h-4"/>}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-3 ml-10 bg-[#1A1A1A] border border-white/10 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            {order.items?.map((item:any,i:number)=>(
              <p key={i} className="text-xs text-white/50">
                {item.quantity}x {item.title}
                {item.addons?.length>0&&<span className="text-white/25"> + {item.addons.map((a:any)=>a.title).join(', ')}</span>}
              </p>
            ))}
          </div>
          {order.delivery?.address&&(
            <div className="flex items-start gap-1.5 text-xs text-white/30">
              <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-primary"/>
              {order.delivery.address}
            </div>
          )}
          {order.couponCode&&<p className="text-green-400 text-xs">Cupón: {order.couponCode} (−{order.discountPercent}%)</p>}
          <div className="flex gap-2 flex-wrap">
            {SNX[order.status]&&(
              <button onClick={()=>onStatus(order._id,SNX[order.status].v)}
                className="bg-primary text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-primary/90 active:scale-95 transition-all">
                → {SNX[order.status].l}
              </button>
            )}
            {order.status!=='cancelled'&&order.status!=='delivered'&&(
              <button onClick={()=>onStatus(order._id,'cancelled')}
                className="bg-red-900/60 text-red-300 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-900 active:scale-95 transition-all">
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Blanks ─────────────────────────────────────────────────────────────────────
const PBLANK  = {title:'',price:'',description:'',image:'',category:'',active:true,controlStock:false,stock:'0'};
const CPBLANK = {code:'',discountPercent:'',active:true,validDays:[] as string[],validPaymentMethods:[] as string[]};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview');

  // Analytics
  const [aRange, setARange]       = useState<Rng>('hoy');
  const [analytics, setAnalytics] = useState<any>(null);
  const [aLoading, setALoading]   = useState(true);

  // Orders
  const [orders, setOrders]       = useState<any[]>([]);
  const [sFilter, setSFilter]     = useState<SF>('pending');
  const [expandedId, setExpandedId] = useState<string|null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>|null>(null);

  // Products / Categories / Addons
  const [products, setProducts]   = useState<any[]>([]);
  const [cats, setCats]           = useState<any[]>([]);
  const [addons, setAddons]       = useState<any[]>([]);
  const [pForm, setPForm]         = useState({...PBLANK});
  const [pEditId, setPEditId]     = useState<string|null>(null);
  const [pErr, setPErr]           = useState('');
  const [cForm, setCForm]         = useState({name:'',order:'0',active:true});
  const [cEditId, setCEditId]     = useState<string|null>(null);
  const [aForm, setAForm]         = useState({title:'',price:'',active:true});
  const [aEditId, setAEditId]     = useState<string|null>(null);

  // Coupons
  const [coupons, setCoupons]     = useState<any[]>([]);
  const [cpForm, setCpForm]       = useState({...CPBLANK});
  const [cpEditId, setCpEditId]   = useState<string|null>(null);
  const [cpErr, setCpErr]         = useState('');

  // Gallery
  const [images, setImages]       = useState<GImg[]>([]);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId]   = useState<string|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Config
  const [emergency, setEmergency] = useState(false);
  const [schedule, setSchedule]   = useState<DaySch[]>(SDAYS.map(day=>({day,openTime:'12:00',closeTime:'23:00',isStoreOpen:true})));
  const [schedSaved, setSchedSaved] = useState(false);
  const [banner, setBanner]       = useState('');
  const [bannerSaved, setBannerSaved] = useState(false);
  const [isRaining, setIsRaining] = useState(false);
  const [extraRain, setExtraRain] = useState(0);
  const [ranges, setRanges]       = useState<KmRange[]>([]);
  const [zones, setZones]         = useState<SZone[]>([]);
  const [nRange, setNRange]       = useState({maxKm:'',price:''});
  const [rErr, setRErr]           = useState('');
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [nZone, setNZone]         = useState({name:'',lat:'',lng:'',radiusMeters:'',price:''});
  const [zErr, setZErr]           = useState('');

  // ── Fetch functions ──────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try { const r = await api.get('/orders/admin/range?range=hoy'); setOrders(r.data.data||[]); } catch {}
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setALoading(true);
    try { const r = await api.get(`/analytics?range=${aRange}`); setAnalytics(r.data.data); }
    finally { setALoading(false); }
  }, [aRange]);

  const fetchMenu = useCallback(async () => {
    try {
      const [p,c,a] = await Promise.all([api.get('/products/admin'),api.get('/categories/admin'),api.get('/addons/admin')]);
      setProducts(p.data.data); setCats(c.data.data); setAddons(a.data.data);
    } catch {}
  }, []);

  const fetchCoupons = useCallback(async () => {
    try { const r = await api.get('/coupons/admin'); setCoupons(r.data.data); } catch {}
  }, []);

  const fetchGallery = useCallback(async () => {
    try { const r = await api.get('/gallery'); setImages(r.data.data||[]); } catch {}
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const [cr,dr] = await Promise.all([api.get('/config/status'),api.get('/delivery/config')]);
      const c=cr.data.data; const d=dr.data.data;
      setEmergency(c.isEmergencyClosed??false);
      setBanner(c.banner??'');
      if(c.dailySchedule?.length) setSchedule(c.dailySchedule);
      setIsRaining(d.isRaining??false); setExtraRain(d.extraRain??0);
      setRanges(d.kmRanges??[]); setZones(d.specialZones??[]);
    } catch {}
  }, []);

  // Mount: fetch everything once in parallel
  useEffect(() => {
    Promise.all([fetchOrders(), fetchAnalytics(), fetchMenu(), fetchCoupons(), fetchGallery(), fetchConfig()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch analytics when range changes
  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // Orders poll — only while on overview or orders tab
  useEffect(() => {
    if (tab === 'overview' || tab === 'orders') {
      pollRef.current = setInterval(fetchOrders, 15000);
    }
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [tab, fetchOrders]);

  // ── Derived (memoized) ───────────────────────────────────────────────────────
  const oCounts = useMemo(() => ({
    pending:          orders.filter(o=>o.status==='pending').length,
    'in-preparation': orders.filter(o=>o.status==='in-preparation').length,
    completed:        orders.filter(o=>o.status==='ready'||o.status==='delivered').length,
    cancelled:        orders.filter(o=>o.status==='cancelled').length,
  }), [orders]);

  const filteredOrders = useMemo(() => orders.filter(o=>{
    if(sFilter==='completed') return o.status==='ready'||o.status==='delivered';
    return o.status===sFilter;
  }), [orders, sFilter]);

  const pendingCount = oCounts.pending;

  // ── Actions ──────────────────────────────────────────────────────────────────
  const updateOrderStatus = useCallback(async (id:string,status:string) => {
    await api.put(`/orders/admin/${id}`,{status}); fetchOrders();
  }, [fetchOrders]);

  const saveProduct = async () => {
    setPErr('');
    try {
      const pl: any = {title:pForm.title,price:Number(pForm.price),description:pForm.description,category:pForm.category,active:pForm.active,controlStock:pForm.controlStock};
      if(pForm.controlStock) pl.stock = Number(pForm.stock);
      if(pForm.image.trim()) pl.image=pForm.image.trim();
      if(pEditId) await api.put(`/products/admin/${pEditId}`,pl); else await api.post('/products/admin',pl);
      setPForm({...PBLANK}); setPEditId(null); fetchMenu();
    } catch(e:any) { setPErr(e.response?.data?.error||'Error al guardar'); }
  };
  const editProduct = (p:any) => { setPEditId(p._id); setPForm({title:p.title,price:String(p.price),description:p.description,image:p.image||'',category:typeof p.category==='object'?p.category._id:p.category,active:p.active,controlStock:p.controlStock??false,stock:String(p.stock??0)}); };

  const saveCat = async () => {
    try {
      const pl={name:cForm.name,order:Number(cForm.order),active:cForm.active};
      if(cEditId) await api.put(`/categories/admin/${cEditId}`,pl); else await api.post('/categories/admin',pl);
      setCForm({name:'',order:'0',active:true}); setCEditId(null); fetchMenu();
    } catch {}
  };
  const editCat = (c:any) => { setCEditId(c._id); setCForm({name:c.name,order:String(c.order),active:c.active}); };

  const saveAddon = async () => {
    try {
      const pl={title:aForm.title,price:Number(aForm.price),active:aForm.active};
      if(aEditId) await api.put(`/addons/admin/${aEditId}`,pl); else await api.post('/addons/admin',pl);
      setAForm({title:'',price:'',active:true}); setAEditId(null); fetchMenu();
    } catch {}
  };
  const editAddon = (a:any) => { setAEditId(a._id); setAForm({title:a.title||a.name,price:String(a.price),active:a.active}); };

  const saveCoupon = async () => {
    setCpErr('');
    try {
      const pl={...cpForm,discountPercent:Number(cpForm.discountPercent)};
      if(cpEditId) await api.put(`/coupons/admin/${cpEditId}`,pl); else await api.post('/coupons/admin',pl);
      setCpForm({...CPBLANK}); setCpEditId(null); fetchCoupons();
    } catch(e:any) { setCpErr(e.response?.data?.error||'Error al guardar'); }
  };
  const editCoupon = (c:any) => { setCpEditId(c._id); setCpForm({code:c.code,discountPercent:String(c.discountPercent),active:c.active,validDays:c.validDays??[],validPaymentMethods:c.validPaymentMethods??[]}); };
  const toggleCpArr = (field:'validDays'|'validPaymentMethods',val:string) => setCpForm(p=>({...p,[field]:p[field].includes(val)?p[field].filter(v=>v!==val):[...p[field],val]}));

  const handleUpload = async (e:React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; if(!file) return; setUploading(true);
    try { const fd=new FormData(); fd.append('image',file); await api.post('/gallery',fd,{headers:{'Content-Type':'multipart/form-data'}}); await fetchGallery(); }
    finally { setUploading(false); if(fileRef.current) fileRef.current.value=''; }
  };
  const deleteImage = async (id:string) => { if(!confirm('¿Eliminar?')) return; await api.delete(`/gallery/${id}`); setImages(p=>p.filter(i=>i._id!==id)); };
  const copyUrl = async (id:string,url:string) => { await navigator.clipboard.writeText(url); setCopiedId(id); setTimeout(()=>setCopiedId(null),2000); };

  const toggleEmergency = async () => { const r=await api.put('/config/status'); setEmergency(r.data.data.isEmergencyClosed); };
  const saveSchedule = async () => { await api.put('/config/schedule',{schedule}); setSchedSaved(true); setTimeout(()=>setSchedSaved(false),2500); };
  const saveBanner = async () => { await api.put('/config/banner',{banner}); setBannerSaved(true); setTimeout(()=>setBannerSaved(false),2500); };
  const toggleRain = async () => { const next=!isRaining; await api.patch('/delivery/config/rain',{isRaining:next,extraRain}); setIsRaining(next); };
  const addRange = async () => {
    const maxKm=parseFloat(nRange.maxKm),price=parseFloat(nRange.price);
    if(!maxKm||maxKm<=0||isNaN(price)||price<0){setRErr('Ingresá km > 0 y precio >= 0');return;}
    const r=await api.post('/delivery/config/ranges',{maxKm,price}); setRanges(r.data.data.data); setNRange({maxKm:'',price:''}); setRErr('');
  };
  const deleteRange = async (id:string) => { const r=await api.delete(`/delivery/config/ranges/${id}`); setRanges(r.data.data.data); };
  const addZone = async () => {
    const lat=parseFloat(nZone.lat),lng=parseFloat(nZone.lng),r=parseFloat(nZone.radiusMeters),price=parseFloat(nZone.price);
    if(!nZone.name||isNaN(lat)||isNaN(lng)||!r||r<=0||isNaN(price)||price<0){setZErr('Completá todos los campos');return;}
    const res=await api.post('/delivery/config/zones',{name:nZone.name,lat,lng,radiusMeters:r,price});
    setZones(res.data.data.data); setNZone({name:'',lat:'',lng:'',radiusMeters:'',price:''}); setZErr(''); setShowZoneForm(false);
  };
  const deleteZone = async (id:string) => { const r=await api.delete(`/delivery/config/zones/${id}`); setZones(r.data.data.data); };

  // ── Shared sub-section: Orders panel ────────────────────────────────────────
  const ordersPanel = (
    <>
      <div className="flex gap-2 flex-wrap mb-4">
        {STABS.map(st=>{
          const count=oCounts[st.key]; const isA=sFilter===st.key;
          return (
            <button key={st.key} onClick={()=>setSFilter(st.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${isA?'bg-primary text-black':'border border-white/15 text-white/40 hover:text-white hover:border-white/30'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isA?'bg-black/30':st.dot}`}/>
              {st.label}
              {count>0&&<span className={isA?'text-black/70':'text-white/50'}>{count}</span>}
            </button>
          );
        })}
      </div>
      <div className="overflow-y-auto overscroll-contain max-h-[55vh]">
        {filteredOrders.length===0&&<p className="text-white/20 text-sm py-6 text-center">Sin pedidos en esta categoría.</p>}
        {filteredOrders.map(o=>(
          <OrderRow key={o._id} order={o} expanded={expandedId===o._id}
            onToggle={()=>setExpandedId(expandedId===o._id?null:o._id)}
            onStatus={updateOrderStatus}/>
        ))}
      </div>
    </>
  );

  // ── Shared: Coupon form ──────────────────────────────────────────────────────
  const couponForm = (compact=false) => (
    <div className="flex flex-col gap-3">
      {cpErr&&<p className="text-red-400 text-xs">{cpErr}</p>}
      <div className={compact?'flex gap-2':'flex flex-col gap-2'}>
        <input placeholder="CÓDIGO" value={cpForm.code}
          onChange={e=>setCpForm(p=>({...p,code:e.target.value.toUpperCase()}))}
          className={compact?IC.replace('w-full','flex-1'):IC}/>
        <input type="number" placeholder="% descuento" value={cpForm.discountPercent}
          onChange={e=>setCpForm(p=>({...p,discountPercent:e.target.value}))}
          className={compact?IC.replace('w-full','w-32'):IC}/>
      </div>
      {!compact&&(
        <>
          <div>
            <p className="text-white/40 text-xs mb-1.5">Días válidos (vacío = todos)</p>
            <div className="flex flex-wrap gap-1.5">
              {CDAYS.map(d=>(
                <button key={d} onClick={()=>toggleCpArr('validDays',d)}
                  className={`px-2 py-1 rounded text-xs font-medium ${cpForm.validDays.includes(d)?'bg-primary text-black':'bg-[#1A1A1A] border border-white/10 text-white/50 hover:text-white'}`}>
                  {DS[d]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-white/40 text-xs mb-1.5">Métodos (vacío = todos)</p>
            <div className="flex gap-1.5">
              {PAYS.map(p=>(
                <button key={p} onClick={()=>toggleCpArr('validPaymentMethods',p)}
                  className={`px-2 py-1 rounded text-xs font-medium ${cpForm.validPaymentMethods.includes(p)?'bg-primary text-black':'bg-[#1A1A1A] border border-white/10 text-white/50 hover:text-white'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      <div className="flex gap-2">
        <button onClick={saveCoupon} className="bg-primary text-black font-bold px-4 py-2 rounded-lg text-sm hover:bg-primary/90 active:scale-95 transition-all">
          {cpEditId?'Guardar':'Crear cupón'}
        </button>
        {cpEditId&&<button onClick={()=>{setCpForm({...CPBLANK});setCpEditId(null);}} className="bg-white/5 text-white/50 px-4 py-2 rounded-lg text-sm hover:text-white">Cancelar</button>}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  //  SECTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  const renderOverview = () => (
    <div className="space-y-5">
      {/* Metrics */}
      <div className={CARD}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white text-sm">Métricas de Negocio</h2>
          <select value={aRange} onChange={e=>setARange(e.target.value as Rng)}
            className="bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs outline-none">
            {(['hoy','ayer','semana','mes'] as Rng[]).map(r=><option key={r} value={r}>{r[0].toUpperCase()+r.slice(1)}</option>)}
          </select>
        </div>
        {aLoading
          ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary"/></div>
          : analytics && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                {icon:TrendingUp,label:'Ventas Totales',v:`$${analytics.total?.toLocaleString('es-AR')}`},
                {icon:DollarSign,label:'En Efectivo',v:`$${analytics.efectivo?.toLocaleString('es-AR')}`},
                {icon:CreditCard,label:'Transferencia',v:`$${analytics.trans?.toLocaleString('es-AR')}`},
                {icon:Trophy,label:'Entregados',v:String(analytics.entregados??0)},
                {icon:Trophy,label:'Producto Estrella',v:analytics.topProduct?.title||'—'},
              ].map(m=>(
                <div key={m.label} className={INN}>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/35 mb-2">
                    <m.icon className="w-3.5 h-3.5 text-primary"/>{m.label}
                  </div>
                  <p className="font-bold text-primary text-lg leading-tight truncate">{m.v}</p>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* Orders + Coupons */}
      <div className="grid md:grid-cols-[3fr_2fr] gap-5">
        <div className={CARD}>
          <h2 className="font-semibold text-white text-sm mb-4">Panel de Pedidos</h2>
          {ordersPanel}
        </div>
        <div className="flex flex-col gap-4">
          <div className={CARD}>
            <h2 className="font-semibold text-white text-sm mb-3">Crear Cupón</h2>
            {couponForm(true)}
          </div>
          <div className={CARD}>
            <h2 className="font-semibold text-white text-sm mb-3">Cupones Activos</h2>
            {coupons.length===0
              ? <p className="text-white/20 text-xs text-center py-3">Sin cupones activos.</p>
              : <div className="flex flex-col gap-2 max-h-48 overflow-y-auto overscroll-contain scrollbar-none">
                  {coupons.filter(c=>c.active).map(c=>(
                    <div key={c._id} className="flex items-center justify-between bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-white text-sm font-bold">{c.code} <span className="text-primary">−{c.discountPercent}%</span></p>
                        <p className="text-white/30 text-[10px]">{c.validDays?.length?c.validDays.map((d:string)=>DS[d]||d).join(', '):'Todos los días'}</p>
                      </div>
                      <button onClick={()=>editCoupon(c)} className="text-white/30 hover:text-primary text-xs transition-colors">Editar</button>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
      </div>

      {/* Categories + Addons */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className={CARD}>
          <h2 className="font-semibold text-white text-sm mb-3">Categorías del Menú</h2>
          <div className="flex gap-2 mb-3">
            <input placeholder="Nueva categoría" value={cForm.name} onChange={e=>setCForm(p=>({...p,name:e.target.value}))} className={IC.replace('py-2.5','py-2')}/>
            <input type="number" placeholder="Orden" value={cForm.order} onChange={e=>setCForm(p=>({...p,order:e.target.value}))} className={IC.replace('w-full','w-20').replace('py-2.5','py-2')}/>
            <button onClick={saveCat} className="bg-primary text-black font-bold px-3 py-2 rounded-lg text-xs hover:bg-primary/90 active:scale-95 transition-all whitespace-nowrap">
              {cEditId?'OK':'Crear'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {cats.map(c=>(
              <div key={c._id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-all ${c.active?'bg-primary/10 border-primary/30 text-primary':'bg-white/5 border-white/10 text-white/30 line-through'}`}>
                {c.name}
                <button onClick={()=>editCat(c)} className="text-white/30 hover:text-white text-[10px]">✏</button>
                <button onClick={async()=>{await api.put(`/categories/admin/toggleActive/${c._id}`);fetchMenu();}} className="text-white/20 hover:text-white text-[10px]">{c.active?'◉':'○'}</button>
                <button onClick={async()=>{if(!confirm('¿Eliminar?'))return;await api.delete(`/categories/admin/${c._id}`);fetchMenu();}} className="text-white/20 hover:text-red-400 text-[10px]">✕</button>
              </div>
            ))}
          </div>
        </div>

        <div className={CARD}>
          <h2 className="font-semibold text-white text-sm mb-3">Adicionales</h2>
          <div className="flex gap-2 mb-3">
            <input placeholder="Nombre" value={aForm.title} onChange={e=>setAForm(p=>({...p,title:e.target.value}))} className={IC.replace('py-2.5','py-2')}/>
            <input type="number" placeholder="Precio" value={aForm.price} onChange={e=>setAForm(p=>({...p,price:e.target.value}))} className={IC.replace('w-full','w-24').replace('py-2.5','py-2')}/>
            <button onClick={saveAddon} className="bg-primary text-black font-bold px-3 py-2 rounded-lg text-xs hover:bg-primary/90 active:scale-95 transition-all whitespace-nowrap">
              {aEditId?'OK':'Crear'}
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {addons.map(a=>(
              <div key={a._id} className="flex items-center justify-between bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2">
                <span className={`text-sm ${a.active?'text-white':'text-white/30 line-through'}`}>{a.title||a.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-primary text-sm">${a.price?.toLocaleString('es-AR')}</span>
                  <button onClick={()=>editAddon(a)} className="text-white/20 hover:text-white text-xs transition-colors">✏</button>
                  <button onClick={async()=>{await api.put(`/addons/admin/toggleActive/${a._id}`);fetchMenu();}} className="text-white/20 hover:text-white text-xs transition-colors">{a.active?'◉':'○'}</button>
                  <button onClick={async()=>{if(!confirm('¿Eliminar?'))return;await api.delete(`/addons/admin/${a._id}`);fetchMenu();}} className="text-white/20 hover:text-red-400 text-xs transition-colors">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Products compact */}
      <div className="grid md:grid-cols-[2fr_3fr] gap-5">
        <div className={CARD}>
          <h2 className="font-semibold text-white text-sm mb-3">{pEditId?'Editar Producto':'Nuevo Producto'}</h2>
          {pErr&&<p className="text-red-400 text-xs mb-2">{pErr}</p>}
          <div className="flex flex-col gap-2">
            <input placeholder="Nombre del producto" value={pForm.title} onChange={e=>setPForm(p=>({...p,title:e.target.value}))} className={IC.replace('py-2.5','py-2')}/>
            <div className="flex gap-2">
              <input type="number" placeholder="Precio" value={pForm.price} onChange={e=>setPForm(p=>({...p,price:e.target.value}))} className={IC.replace('py-2.5','py-2').replace('w-full','flex-1')}/>
              <select value={pForm.category} onChange={e=>setPForm(p=>({...p,category:e.target.value}))} className={IC.replace('py-2.5','py-2').replace('w-full','flex-1')}>
                <option value="">Categoría</option>
                {cats.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <textarea placeholder="Descripción" value={pForm.description} onChange={e=>setPForm(p=>({...p,description:e.target.value}))} rows={2} className={IC.replace('py-2.5','py-2')+' resize-none'}/>
            <input placeholder="URL de imagen (opcional)" value={pForm.image} onChange={e=>setPForm(p=>({...p,image:e.target.value}))} className={IC.replace('py-2.5','py-2')}/>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-1.5 text-xs text-white/50 cursor-pointer">
                <input type="checkbox" checked={pForm.controlStock} onChange={e=>setPForm(p=>({...p,controlStock:e.target.checked}))} className="accent-primary"/> Stock
              </label>
              {pForm.controlStock&&<input type="number" placeholder="Cant." value={pForm.stock} onChange={e=>setPForm(p=>({...p,stock:e.target.value}))} min={0} className={IC.replace('py-2.5','py-2').replace('w-full','w-20')}/>}
            </div>
            <div className="flex gap-2">
              <button onClick={saveProduct} className="flex-1 bg-primary text-black font-bold py-2 rounded-lg text-sm hover:bg-primary/90 active:scale-95 transition-all">
                {pEditId?'Guardar cambios':'Crear producto'}
              </button>
              {pEditId&&<button onClick={()=>{setPForm({...PBLANK});setPEditId(null);setPErr('');}} className="bg-white/5 text-white/50 px-3 py-2 rounded-lg text-sm hover:text-white">✕</button>}
            </div>
          </div>
        </div>

        <div className={CARD}>
          <h2 className="font-semibold text-white text-sm mb-3">Tus Productos</h2>
          <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto overscroll-contain scrollbar-none">
            {products.map(p=>{
              const catName = typeof p.category==='object'?p.category?.name:(cats.find(c=>c._id===p.category)?.name??'—');
              return (
                <div key={p._id} className="flex items-center gap-3 bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2.5">
                  {p.image&&<img src={p.image} alt={p.title} className="w-9 h-9 rounded-lg object-cover shrink-0 bg-zinc-900"/>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold truncate ${p.active?'text-white':'text-white/30 line-through'}`}>{p.title}</p>
                      {p.controlStock&&<span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${(p.stock??0)>0?'bg-green-900/40 text-green-300':'bg-red-900/40 text-red-300'}`}>{p.stock??0}</span>}
                    </div>
                    <p className="text-[11px] text-white/30">{catName} · <span className="text-primary">${p.price?.toLocaleString('es-AR')}</span></p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={()=>editProduct(p)} className="text-white/20 hover:text-white text-xs transition-colors">✏</button>
                    <button onClick={async()=>{await api.put(`/products/admin/toggleActive/${p._id}`);fetchMenu();}} className={`text-xs transition-colors ${p.active?'text-white/20 hover:text-white':'text-green-400/50 hover:text-green-400'}`}>{p.active?'◉':'○'}</button>
                    <button onClick={async()=>{if(!confirm('¿Eliminar?'))return;await api.delete(`/products/admin/${p._id}`);fetchMenu();}} className="text-white/20 hover:text-red-400 text-xs transition-colors">✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Panic button compact */}
      <div className={CARD}>
        <h2 className="font-semibold text-white text-sm mb-3">Estado del Local</h2>
        <div className={INN+' flex items-center gap-4'}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-primary/70 shrink-0"/>
              <p className="text-white text-sm font-semibold">Botón de Pánico</p>
            </div>
            <p className="text-white/40 text-xs">Cierra la recepción de pedidos de forma inmediata, ignorando los horarios.</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`w-2 h-2 rounded-full ${emergency?'bg-red-500':'bg-green-500'}`}/>
              <span className="text-white/50 text-xs font-semibold uppercase tracking-wide">{emergency?'LOCAL CERRADO':'OPERANDO NORMALMENTE'}</span>
            </div>
          </div>
          <button onClick={toggleEmergency}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 shrink-0 ${emergency?'bg-green-600 hover:bg-green-500 text-white':'bg-red-600 hover:bg-red-500 text-white'}`}>
            <Power className="w-4 h-4"/>
            {emergency?'Reabrir':'Cerrar Local'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className={CARD}>
      <h2 className="font-semibold text-white text-sm mb-4">Panel de Pedidos</h2>
      {ordersPanel}
    </div>
  );

  const renderMenu = () => (
    <div className="space-y-5">
      <div className={CARD}>
        <h2 className="font-semibold text-white text-sm mb-4">Categorías del Menú</h2>
        <div className="flex gap-2 mb-4">
          <input placeholder="Nombre de categoría" value={cForm.name} onChange={e=>setCForm(p=>({...p,name:e.target.value}))} className={IC}/>
          <input type="number" placeholder="Orden" value={cForm.order} onChange={e=>setCForm(p=>({...p,order:e.target.value}))} className={IC.replace('w-full','w-24')}/>
          <button onClick={saveCat} className="bg-primary text-black font-bold px-4 py-2 rounded-lg text-sm hover:bg-primary/90 active:scale-95 transition-all whitespace-nowrap">
            {cEditId?'Guardar':'Crear'}
          </button>
          {cEditId&&<button onClick={()=>{setCForm({name:'',order:'0',active:true});setCEditId(null);}} className="bg-white/5 text-white/50 px-3 py-2 rounded-lg text-sm">✕</button>}
        </div>
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto overscroll-contain scrollbar-none">
          {cats.map(c=>(
            <div key={c._id} className="flex items-center justify-between bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3">
              <div>
                <p className={`font-semibold text-sm ${c.active?'text-white':'text-white/40 line-through'}`}>{c.name}</p>
                <p className="text-white/30 text-xs">Orden: {c.order}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={async()=>{await api.put(`/categories/admin/toggleActive/${c._id}`);fetchMenu();}}
                  className={`text-xs px-2 py-1 rounded-lg ${c.active?'bg-white/5 text-white/50 hover:text-white':'bg-green-900/50 text-green-300 hover:bg-green-900'}`}>
                  {c.active?'Desactivar':'Activar'}
                </button>
                <button onClick={()=>editCat(c)} className="text-xs text-white/40 hover:text-white px-2 py-1 bg-white/5 rounded-lg">Editar</button>
                <button onClick={async()=>{if(!confirm('¿Eliminar?'))return;await api.delete(`/categories/admin/${c._id}`);fetchMenu();}} className="text-xs text-red-400/60 hover:text-red-300 px-2 py-1 bg-white/5 rounded-lg">Borrar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={CARD}>
        <h2 className="font-semibold text-white text-sm mb-4">Adicionales</h2>
        <div className="flex gap-2 mb-4">
          <input placeholder="Nombre" value={aForm.title} onChange={e=>setAForm(p=>({...p,title:e.target.value}))} className={IC}/>
          <input type="number" placeholder="Precio" value={aForm.price} onChange={e=>setAForm(p=>({...p,price:e.target.value}))} className={IC.replace('w-full','w-28')}/>
          <button onClick={saveAddon} className="bg-primary text-black font-bold px-4 py-2 rounded-lg text-sm hover:bg-primary/90 active:scale-95 transition-all whitespace-nowrap">
            {aEditId?'Guardar':'Crear'}
          </button>
          {aEditId&&<button onClick={()=>{setAForm({title:'',price:'',active:true});setAEditId(null);}} className="bg-white/5 text-white/50 px-3 py-2 rounded-lg text-sm">✕</button>}
        </div>
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto overscroll-contain scrollbar-none">
          {addons.map(a=>(
            <div key={a._id} className="flex items-center justify-between bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3">
              <p className={`font-semibold text-sm ${a.active?'text-white':'text-white/40 line-through'}`}>{a.title||a.name} — <span className="text-primary">${a.price?.toLocaleString('es-AR')}</span></p>
              <div className="flex gap-2">
                <button onClick={async()=>{await api.put(`/addons/admin/toggleActive/${a._id}`);fetchMenu();}}
                  className={`text-xs px-2 py-1 rounded-lg ${a.active?'bg-white/5 text-white/50 hover:text-white':'bg-green-900/50 text-green-300 hover:bg-green-900'}`}>
                  {a.active?'Desactivar':'Activar'}
                </button>
                <button onClick={()=>editAddon(a)} className="text-xs text-white/40 hover:text-white px-2 py-1 bg-white/5 rounded-lg">Editar</button>
                <button onClick={async()=>{if(!confirm('¿Eliminar?'))return;await api.delete(`/addons/admin/${a._id}`);fetchMenu();}} className="text-xs text-red-400/60 hover:text-red-300 px-2 py-1 bg-white/5 rounded-lg">Borrar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-[2fr_3fr] gap-5">
        <div className={CARD}>
          <h2 className="font-semibold text-white text-sm mb-4">{pEditId?'Editar Producto':'Nuevo Producto'}</h2>
          {pErr&&<p className="text-red-400 text-xs mb-2">{pErr}</p>}
          <div className="flex flex-col gap-3">
            <input placeholder="Título" value={pForm.title} onChange={e=>setPForm(p=>({...p,title:e.target.value}))} className={IC}/>
            <div className="flex gap-2">
              <input type="number" placeholder="Precio" value={pForm.price} onChange={e=>setPForm(p=>({...p,price:e.target.value}))} className={IC.replace('w-full','w-32')}/>
              <select value={pForm.category} onChange={e=>setPForm(p=>({...p,category:e.target.value}))} className={IC.replace('w-full','flex-1')}>
                <option value="">Seleccionar categoría</option>
                {cats.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <textarea placeholder="Descripción" value={pForm.description} onChange={e=>setPForm(p=>({...p,description:e.target.value}))} rows={2} className={IC+' resize-none'}/>
            <input placeholder="URL de imagen (opcional)" value={pForm.image} onChange={e=>setPForm(p=>({...p,image:e.target.value}))} className={IC}/>
            <label className="flex items-center gap-2 text-sm text-white/50 cursor-pointer">
              <input type="checkbox" checked={pForm.active} onChange={e=>setPForm(p=>({...p,active:e.target.checked}))} className="accent-primary"/> Activo
            </label>
            <label className="flex items-center gap-2 text-sm text-white/50 cursor-pointer">
              <input type="checkbox" checked={pForm.controlStock} onChange={e=>setPForm(p=>({...p,controlStock:e.target.checked}))} className="accent-primary"/> Controlar stock
            </label>
            {pForm.controlStock&&(
              <input type="number" placeholder="Stock disponible" value={pForm.stock} onChange={e=>setPForm(p=>({...p,stock:e.target.value}))} min={0} className={IC}/>
            )}
            <div className="flex gap-2">
              <button onClick={saveProduct} className="flex-1 bg-primary text-black font-bold py-2.5 rounded-lg text-sm hover:bg-primary/90 active:scale-95 transition-all">
                {pEditId?'Guardar cambios':'Crear producto'}
              </button>
              {pEditId&&<button onClick={()=>{setPForm({...PBLANK});setPEditId(null);setPErr('');}} className="bg-white/5 text-white/50 px-4 py-2.5 rounded-lg text-sm hover:text-white">Cancelar</button>}
            </div>
          </div>
        </div>
        <div className={CARD}>
          <h2 className="font-semibold text-white text-sm mb-4">Tus Productos</h2>
          <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto overscroll-contain scrollbar-none">
            {products.map(p=>{
              const catName=typeof p.category==='object'?p.category?.name:(cats.find(c=>c._id===p.category)?.name??'—');
              return (
                <div key={p._id} className="flex items-center gap-3 bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-3">
                  {p.image&&<img src={p.image} alt={p.title} className="w-10 h-10 rounded-lg object-cover shrink-0 bg-zinc-900"/>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold text-sm truncate ${p.active?'text-white':'text-white/40 line-through'}`}>{p.title}</p>
                      {p.controlStock&&<span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${(p.stock??0)>0?'bg-green-900/40 text-green-300':'bg-red-900/40 text-red-300'}`}>Stock: {p.stock??0}</span>}
                    </div>
                    <p className="text-[11px] text-white/30">{catName} · <span className="text-primary">${p.price?.toLocaleString('es-AR')}</span></p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={async()=>{await api.put(`/products/admin/toggleActive/${p._id}`);fetchMenu();}}
                      className={`text-xs px-2 py-1 rounded-lg ${p.active?'bg-white/5 text-white/50 hover:text-white':'bg-green-900/50 text-green-300'}`}>
                      {p.active?'Desactivar':'Activar'}
                    </button>
                    <button onClick={()=>editProduct(p)} className="text-xs text-white/40 hover:text-white px-2 py-1 bg-white/5 rounded-lg">Editar</button>
                    <button onClick={async()=>{if(!confirm('¿Eliminar?'))return;await api.delete(`/products/admin/${p._id}`);fetchMenu();}} className="text-xs text-red-400/60 hover:text-red-300 px-2 py-1 bg-white/5 rounded-lg">Borrar</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCoupons = () => (
    <div className="grid md:grid-cols-2 gap-5">
      <div className={CARD}>
        <h2 className="font-semibold text-white text-sm mb-4">{cpEditId?'Editar Cupón':'Nuevo Cupón'}</h2>
        {couponForm(false)}
      </div>
      <div className={CARD}>
        <h2 className="font-semibold text-white text-sm mb-4">Cupones</h2>
        <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto overscroll-contain scrollbar-none">
          {coupons.map(c=>(
            <div key={c._id} className="bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-white text-sm">{c.code} — <span className="text-primary">{c.discountPercent}%</span>{!c.active&&<span className="ml-2 text-white/30 font-normal text-xs">(inactivo)</span>}</p>
                <p className="text-white/30 text-xs">{c.validDays?.length?`Días: ${c.validDays.map((d:string)=>DS[d]||d).join(', ')}`:'Todos los días'} · {c.validPaymentMethods?.length?c.validPaymentMethods.join(', '):'Todos los métodos'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>editCoupon(c)} className="text-xs text-white/40 hover:text-white px-2 py-1 bg-white/5 rounded-lg">Editar</button>
                <button onClick={async()=>{if(!confirm('¿Eliminar?'))return;await api.delete(`/coupons/admin/${c._id}`);fetchCoupons();}} className="text-xs text-red-400/60 hover:text-red-300 px-2 py-1 bg-white/5 rounded-lg">Borrar</button>
              </div>
            </div>
          ))}
          {coupons.length===0&&<p className="text-white/20 text-sm text-center py-4">Sin cupones creados.</p>}
        </div>
      </div>
    </div>
  );

  const renderGallery = () => (
    <div className={CARD}>
      <h2 className="font-semibold text-white text-sm mb-4">Gestor de Imágenes</h2>
      <div onClick={()=>fileRef.current?.click()}
        className="border border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all mb-5">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload}/>
        {uploading?<Loader2 className="w-8 h-8 text-primary mx-auto animate-spin mb-3"/>:<Upload className="w-8 h-8 text-white/20 mx-auto mb-3"/>}
        <p className="text-white/60 text-sm font-medium">{uploading?'Subiendo...':'Arrastrá o hacé clic para subir'}</p>
        <p className="text-white/25 text-xs mt-1">JPG, PNG o WEBP</p>
        {!uploading&&<button type="button" className="mt-4 border border-primary/40 text-primary px-4 py-2 rounded-lg text-xs font-semibold hover:bg-primary/10 transition-colors">Seleccionar archivo</button>}
      </div>
      {images.length===0
        ? <p className="text-white/20 text-xs text-center py-4">Sin imágenes cargadas.</p>
        : <div className="max-h-[500px] overflow-y-auto overscroll-contain scrollbar-none"><div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {images.map(img=>(
              <div key={img._id} className="group relative rounded-xl overflow-hidden aspect-square bg-zinc-900 border border-white/10">
                <img src={img.url} alt={img.filename} className="w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
                  <button onClick={()=>copyUrl(img._id,img.url)}
                    className="flex items-center gap-1.5 bg-primary text-black text-[10px] font-bold px-2.5 py-1.5 rounded-lg">
                    {copiedId===img._id?<Check className="w-3 h-3"/>:<Copy className="w-3 h-3"/>}
                    {copiedId===img._id?'Copiado':'Copiar URL'}
                  </button>
                  <button onClick={()=>deleteImage(img._id)} className="flex items-center gap-1 bg-red-600/80 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg">
                    <X className="w-3 h-3"/>Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div></div>
      }
    </div>
  );

  const renderConfig = () => (
    <div className="grid md:grid-cols-2 gap-5">
      {/* Left column */}
      <div className="space-y-4">
        <div className={CARD}>
          <h2 className="font-semibold text-white text-sm mb-4">Estado del Local</h2>
          <div className={INN+' mb-4'}>
            <div className="flex items-start gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-primary/70 shrink-0 mt-0.5"/>
              <p className="text-white/40 text-xs">El botón de pánico ignora los horarios y cierra la recepción de pedidos de forma inmediata.</p>
            </div>
            <button onClick={toggleEmergency}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${emergency?'bg-green-600 hover:bg-green-500 text-white':'bg-red-600 hover:bg-red-500 text-white'}`}>
              <Power className="w-4 h-4"/>
              {emergency?'Reabrir Local':'Cerrar de Emergencia'}
            </button>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className={`w-2 h-2 rounded-full ${emergency?'bg-red-500':'bg-green-500'}`}/>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">{emergency?'CIERRE DE EMERGENCIA ACTIVO':'OPERANDO NORMALMENTE'}</span>
            </div>
          </div>
        </div>

        <div className={CARD}>
          <div className="flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-primary"/><h2 className="font-semibold text-white text-sm">Horarios de Atención</h2></div>
          <div className="flex flex-col gap-2">
            {schedule.map((item,i)=>(
              <div key={item.day} className={`flex items-center gap-2 rounded-lg p-2.5 border transition-colors ${!item.isStoreOpen?'bg-[#111] border-white/5 opacity-60':'bg-[#1A1A1A] border-white/10'}`}>
                <span className="text-white/60 text-xs w-20 shrink-0">{item.day}</span>
                <input type="time" value={item.openTime} disabled={!item.isStoreOpen}
                  onChange={e=>setSchedule(p=>p.map((d,idx)=>idx===i?{...d,openTime:e.target.value}:d))}
                  className="bg-[#0A0A0A] text-white px-2 py-1.5 rounded-lg border border-white/10 text-xs disabled:opacity-40 focus:outline-none focus:border-primary/50 flex-1"/>
                <span className="text-white/25 text-xs">-</span>
                <input type="time" value={item.closeTime} disabled={!item.isStoreOpen}
                  onChange={e=>setSchedule(p=>p.map((d,idx)=>idx===i?{...d,closeTime:e.target.value}:d))}
                  className="bg-[#0A0A0A] text-white px-2 py-1.5 rounded-lg border border-white/10 text-xs disabled:opacity-40 focus:outline-none focus:border-primary/50 flex-1"/>
                <label className="flex items-center gap-1 cursor-pointer shrink-0 text-[11px] text-white/40 ml-auto">
                  <input type="checkbox" checked={!item.isStoreOpen}
                    onChange={e=>setSchedule(p=>p.map((d,idx)=>idx===i?{...d,isStoreOpen:!e.target.checked}:d))}
                    className="accent-primary"/>
                  Cerrado
                </label>
              </div>
            ))}
          </div>
          <button onClick={saveSchedule} className="mt-4 w-full bg-primary text-black font-bold py-2.5 rounded-xl text-sm hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            {schedSaved?<><CheckCircle className="w-4 h-4"/>Guardado</>:'Guardar Horarios'}
          </button>
        </div>

        <div className={CARD}>
          <h2 className="font-semibold text-white text-sm mb-3">Banner del Inicio</h2>
          {banner&&<div className="rounded-xl overflow-hidden mb-3 border border-white/10 aspect-video"><img src={banner} alt="Banner" className="w-full h-full object-cover"/></div>}
          <input type="url" value={banner} onChange={e=>{setBanner(e.target.value);setBannerSaved(false);}} placeholder="https://..." className={IC+' mb-3'}/>
          <button onClick={saveBanner} disabled={!banner.trim()}
            className="w-full bg-primary text-black font-bold py-2.5 rounded-xl text-sm hover:bg-primary/90 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
            {bannerSaved?<><CheckCircle className="w-4 h-4"/>Actualizado</>:'Actualizar Banner'}
          </button>
        </div>
      </div>

      {/* Right column */}
      <div className="space-y-4">
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-4">
            {isRaining?<CloudRain className="w-4 h-4 text-blue-400"/>:<Sun className="w-4 h-4 text-yellow-400"/>}
            <h2 className="font-semibold text-white text-sm">Modo Lluvia</h2>
          </div>
          <div className={INN+' flex items-center justify-between mb-3'}>
            <div>
              <p className="text-white text-sm">Recargo por lluvia</p>
              <p className="text-white/40 text-xs">Se suma al costo base de envío</p>
            </div>
            <button onClick={toggleRain} className={`relative w-11 h-6 rounded-full transition-colors ${isRaining?'bg-blue-500':'bg-white/10'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isRaining?'translate-x-[22px]':'translate-x-0.5'}`}/>
            </button>
          </div>
          <div>
            <p className="text-white/40 text-xs mb-1.5">Recargo extra ($)</p>
            <input type="number" value={extraRain} onChange={e=>setExtraRain(Number(e.target.value))} min={0} className={IC}/>
            {isRaining&&<p className="text-blue-400 text-xs mt-2">🌧 Modo lluvia activo — recargo de ${extraRain.toLocaleString('es-AR')}</p>}
          </div>
        </div>

        <div className={CARD}>
          <div className="flex items-center gap-2 mb-4"><Route className="w-4 h-4 text-primary"/><h2 className="font-semibold text-white text-sm">Rangos por Kilómetro</h2></div>
          <div className="flex flex-col gap-2 mb-4 max-h-52 overflow-y-auto overscroll-contain scrollbar-none">
            {ranges.length===0&&<p className="text-white/25 text-xs text-center py-3">Sin rangos configurados</p>}
            {ranges.map(r=>(
              <div key={r._id} className="flex items-center justify-between bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3">
                <span className="text-white text-sm">Hasta <span className="text-primary">{r.maxKm} km</span></span>
                <div className="flex items-center gap-3">
                  <span className="text-primary">${r.price.toLocaleString('es-AR')}</span>
                  <button onClick={()=>deleteRange(r._id)} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </div>
            ))}
          </div>
          <div className={INN}>
            <p className="text-white/60 text-xs mb-2">Agregar rango</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input type="number" placeholder="Máx. km" value={nRange.maxKm} onChange={e=>setNRange(p=>({...p,maxKm:e.target.value}))} min={0} className={IC.replace('py-2.5','py-2')}/>
              <input type="number" placeholder="Precio ($)" value={nRange.price} onChange={e=>setNRange(p=>({...p,price:e.target.value}))} min={0} className={IC.replace('py-2.5','py-2')}/>
            </div>
            {rErr&&<p className="text-red-400 text-xs mb-2">{rErr}</p>}
            <button onClick={addRange} className="flex items-center gap-1.5 text-primary border border-primary/30 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">
              <Plus className="w-3.5 h-3.5"/>Agregar rango
            </button>
          </div>
        </div>

        <div className={CARD}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary"/><h2 className="font-semibold text-white text-sm">Zonas Especiales</h2></div>
            <button onClick={()=>setShowZoneForm(p=>!p)} className="flex items-center gap-1.5 text-primary border border-primary/30 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">
              <Plus className="w-3.5 h-3.5"/>Nueva zona
            </button>
          </div>
          <div className="flex flex-col gap-2 mb-3 max-h-52 overflow-y-auto overscroll-contain scrollbar-none">
            {zones.length===0&&<p className="text-white/25 text-xs text-center py-3">Sin zonas especiales</p>}
            {zones.map(z=>(
              <div key={z._id} className="bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 flex items-start justify-between">
                <div><p className="text-white text-sm">{z.name}</p><p className="text-white/30 text-xs">Radio: {z.radiusMeters}m · {z.lat.toFixed(4)}, {z.lng.toFixed(4)}</p></div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-primary text-sm">${z.price.toLocaleString('es-AR')}</span>
                  <button onClick={()=>deleteZone(z._id)} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </div>
            ))}
          </div>
          {showZoneForm&&(
            <div className={INN}>
              <p className="text-white/60 text-xs mb-3">Nueva zona especial</p>
              <div className="flex flex-col gap-2">
                <input placeholder="Nombre" value={nZone.name} onChange={e=>setNZone(p=>({...p,name:e.target.value}))} className={IC.replace('py-2.5','py-2')}/>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" step="any" placeholder="Latitud" value={nZone.lat} onChange={e=>setNZone(p=>({...p,lat:e.target.value}))} className={IC.replace('py-2.5','py-2')}/>
                  <input type="number" step="any" placeholder="Longitud" value={nZone.lng} onChange={e=>setNZone(p=>({...p,lng:e.target.value}))} className={IC.replace('py-2.5','py-2')}/>
                  <input type="number" placeholder="Radio (m)" value={nZone.radiusMeters} onChange={e=>setNZone(p=>({...p,radiusMeters:e.target.value}))} className={IC.replace('py-2.5','py-2')}/>
                  <input type="number" placeholder="Precio ($)" value={nZone.price} onChange={e=>setNZone(p=>({...p,price:e.target.value}))} className={IC.replace('py-2.5','py-2')}/>
                </div>
                {zErr&&<p className="text-red-400 text-xs">{zErr}</p>}
                <div className="flex gap-2">
                  <button onClick={addZone} className="flex items-center gap-1.5 text-primary border border-primary/30 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"><Plus className="w-3.5 h-3.5"/>Agregar</button>
                  <button onClick={()=>{setShowZoneForm(false);setZErr('');}} className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white text-xs transition-all">Cancelar</button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Tab nav */}
      <nav className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10 bg-[#0A0A0A] overflow-x-auto scrollbar-none shrink-0">
        {NAVT.map(({k,l,I})=>{
          const isA=tab===k;
          return (
            <button key={k} onClick={()=>setTab(k)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all active:scale-95 ${isA?'bg-primary text-black':'border border-white/15 text-white/50 hover:text-white hover:border-white/30'}`}>
              <I className="w-3.5 h-3.5"/>
              {l}
              {k==='orders'&&pendingCount>0&&(
                <span className={`text-[10px] font-bold ml-0.5 px-1.5 py-0.5 rounded-full ${isA?'bg-black/20 text-black':'bg-yellow-400/20 text-yellow-400'}`}>
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-6xl mx-auto p-5 md:p-6">
          {tab==='overview'  && renderOverview()}
          {tab==='orders'    && renderOrders()}
          {tab==='menu'      && renderMenu()}
          {tab==='coupons'   && renderCoupons()}
          {tab==='gallery'   && renderGallery()}
          {tab==='config'    && renderConfig()}
        </div>
      </div>
    </div>
  );
}
