import { Clock, CheckCircle } from 'lucide-react';
import { AdminCard } from './ui/AdminCard';

interface ScheduleDay {
  day: string;
  openTime: string;
  closeTime: string;
  isStoreOpen: boolean;
}

interface Props {
  schedule: ScheduleDay[];
  setSchedule: (updater: (prev: ScheduleDay[]) => ScheduleDay[]) => void;
  schedSaved: boolean;
  saveSchedule: () => void;
}

export function ScheduleSection({ schedule, setSchedule, schedSaved, saveSchedule }: Props) {
  return (
    <AdminCard>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-primary" />
        <h2 className="font-semibold text-white text-sm">Horarios de Atención</h2>
      </div>
      <div className="flex flex-col gap-2">
        {schedule.map((item, i) => (
          <div key={item.day} className={`flex items-center gap-2 rounded-lg p-2.5 border transition-colors ${!item.isStoreOpen ? 'bg-[#111] border-white/5 opacity-60' : 'bg-[#1A1A1A] border-white/10'}`}>
            <span className="text-white/60 text-xs w-20 shrink-0">{item.day}</span>
            <input type="time" value={item.openTime} disabled={!item.isStoreOpen}
              onChange={e => setSchedule(p => p.map((d, idx) => idx === i ? { ...d, openTime: e.target.value } : d))}
              className="bg-[#0A0A0A] text-white px-2 py-1.5 rounded-lg border border-white/10 text-xs disabled:opacity-40 focus:outline-none focus:border-primary/50 flex-1" />
            <span className="text-white/25 text-xs">-</span>
            <input type="time" value={item.closeTime} disabled={!item.isStoreOpen}
              onChange={e => setSchedule(p => p.map((d, idx) => idx === i ? { ...d, closeTime: e.target.value } : d))}
              className="bg-[#0A0A0A] text-white px-2 py-1.5 rounded-lg border border-white/10 text-xs disabled:opacity-40 focus:outline-none focus:border-primary/50 flex-1" />
            <label className="flex items-center gap-1 cursor-pointer shrink-0 text-[11px] text-white/40 ml-auto">
              <input type="checkbox" checked={!item.isStoreOpen}
                onChange={e => setSchedule(p => p.map((d, idx) => idx === i ? { ...d, isStoreOpen: !e.target.checked } : d))}
                className="accent-primary" />
              Cerrado
            </label>
          </div>
        ))}
      </div>
      <button onClick={saveSchedule} className="mt-4 w-full bg-primary text-black font-bold py-2.5 rounded-xl text-sm hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
        {schedSaved ? <><CheckCircle className="w-4 h-4" />Guardado</> : 'Guardar Horarios'}
      </button>
    </AdminCard>
  );
}
