'use client';

import { useEffect } from 'react';
import { useAdminConfig } from '../hooks/useAdminConfig';
import { EmergencySection } from './EmergencySection';
import { ScheduleSection } from './ScheduleSection';
import { BannerSection } from './BannerSection';
import { RainSection } from './RainSection';
import { RangesSection } from './RangesSection';
import { ZonesSection } from './ZonesSection';

export function ConfigTab() {
  const {
    emergency, toggleEmergency,
    schedule, setSchedule, schedSaved, saveSchedule,
    banner, setBanner, bannerSaved, setBannerSaved, saveBanner,
    isRaining, extraRain, setExtraRain, toggleRain,
    ranges, nRange, setNRange, rErr, addRange, deleteRange,
    zones, showZoneForm, setShowZoneForm, nZone, setNZone, zErr, addZone, deleteZone,
    reload,
  } = useAdminConfig();

  // Trae de forma reactiva la información real de Mongo apenas se monta la pestaña
  useEffect(() => { 
    reload(); 
  }, [reload]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 items-start">
      {/* Columna Izquierda: Estado, Horarios y Banner */}
      <div className="flex flex-col gap-4">
        <EmergencySection 
          emergency={emergency} 
          onToggle={toggleEmergency} 
        />
        <ScheduleSection 
          schedule={schedule} 
          setSchedule={setSchedule} 
          schedSaved={schedSaved} 
          saveSchedule={saveSchedule} 
        />
        <BannerSection 
          banner={banner} 
          setBanner={setBanner} 
          bannerSaved={bannerSaved} 
          setBannerSaved={setBannerSaved} 
          saveBanner={saveBanner} 
        />
      </div>

      {/* Columna Derecha: Lluvia, Rangos de Envío y Zonas */}
      <div className="flex flex-col gap-4">
        <RainSection 
          isRaining={isRaining} 
          extraRain={extraRain}
          setExtraRain={setExtraRain}
          toggleRain={toggleRain} 
        />
        <RangesSection 
          ranges={ranges} 
          nRange={nRange} 
          setNRange={setNRange} 
          rErr={rErr} 
          addRange={addRange} 
          deleteRange={deleteRange} 
        />
        <ZonesSection 
          zones={zones} 
          showZoneForm={showZoneForm} 
          setShowZoneForm={setShowZoneForm} 
          nZone={nZone} 
          setNZone={setNZone} 
          zErr={zErr} 
          addZone={addZone} 
          deleteZone={deleteZone} 
        />
      </div>
    </div>
  );
}