'use client';

import { useEffect } from 'react';
import { useAdminConfig } from '../hooks/useAdminConfig';
import { EmergencySection } from './EmergencySection';
import { ScheduleSection } from './ScheduleSection';
import { BannerSection } from './BannerSection';
import { RainSection } from './RainSection';
import { RangesSection } from './RangesSection';

export function ConfigTab() {
  const {
    emergency, toggleEmergency,
    schedule, setSchedule, schedSaved, saveSchedule,
    banner, setBanner, bannerSaved, setBannerSaved, saveBanner,
    isRaining, extraRain, setExtraRain, toggleRain,
    ranges, nRange, setNRange, rErr, addRange, deleteRange,
    reload,
  } = useAdminConfig();

  useEffect(() => { reload(); }, [reload]);

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      {/* ═══ FILA SUPERIOR: BANNER (ancho completo) ═══ */}
      <BannerSection
        banner={banner}
        setBanner={setBanner}
        bannerSaved={bannerSaved}
        setBannerSaved={setBannerSaved}
        saveBanner={saveBanner}
      />

      {/* ═══ FILA MEDIA: Horarios y Rangos (Misma altura en PC gracias al comportamiento Grid por defecto) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        <ScheduleSection
          schedule={schedule}
          setSchedule={setSchedule}
          schedSaved={schedSaved}
          saveSchedule={saveSchedule}
        />
        <RangesSection
          ranges={ranges}
          nRange={nRange}
          setNRange={setNRange}
          rErr={rErr}
          addRange={addRange}
          deleteRange={deleteRange}
        />
      </div>

      {/* ═══ FILA INFERIOR: Pánico y Lluvia (Alineación superior perfecta en PC) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 items-start">
        <EmergencySection emergency={emergency} onToggle={toggleEmergency} />
        <RainSection
          isRaining={isRaining}
          extraRain={extraRain}
          setExtraRain={setExtraRain}
          toggleRain={toggleRain}
        />
      </div>
    </div>
  );
}