'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  CloudRain,
  Wind,
  Thermometer,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Navigation,
  HardHat,
  Search,
  CloudLightning,
  CloudSun,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Project } from '@/lib/types';
import { formatGTQ, formatUSD } from '@/lib/data';

interface GoogleMapsSafetyViewProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  currency: 'GTQ' | 'USD';
}

interface WeatherAlertItem {
  id: string;
  region: string;
  temperature: string;
  condition: string;
  rainProbability: string;
  windSpeed: string;
  insivumehLevel: 'Verde' | 'Amarillo' | 'Naranja' | 'Rojo';
  safetyDirectives: string[];
  lastUpdated: string;
  source: string;
}

export const GoogleMapsSafetyView: React.FC<GoogleMapsSafetyViewProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  currency,
}) => {
  const [selectedSiteId, setSelectedSiteId] = useState<string>(activeProjectId);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [alerts, setAlerts] = useState<WeatherAlertItem[]>([]);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('Actualizado hace 2 min');
  const [weatherSource, setWeatherSource] = useState<string>('INSIVUMEH & Red Meteorológica');
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'critical'>('all');

  const activeProject = projects.find((p) => p.id === selectedSiteId) || projects[0];

  const fetchWeatherAlerts = async () => {
    setIsLoadingWeather(true);
    try {
      const res = await fetch('/api/weather/safety-alerts');
      const data = await res.json();
      if (data && data.alerts) {
        setAlerts(data.alerts);
        if (data.source) setWeatherSource(data.source);
        setLastRefreshed(`Actualizado a las ${new Date().toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}`);
      }
    } catch (err) {
      console.error('Error fetching weather alerts:', err);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  useEffect(() => {
    fetchWeatherAlerts();
  }, []);

  const formatMoney = (amount: number) => {
    return currency === 'GTQ' ? formatGTQ(amount) : formatUSD(amount);
  };

  // Google Maps embed URL with query coordinates
  const mapEmbedUrl = `https://maps.google.com/maps?q=${activeProject.lat},${activeProject.lng}&t=${mapType === 'satellite' ? 'k' : 'm'}&z=16&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg">
              <MapPin className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-base text-white">
              Centro de Monitoreo Geográfico de Obras & Alertas Meteorológicas
            </h3>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Integración de Google Maps con geolocalización de obras activas en Guatemala y alertas meteorológicas en tiempo real (INSIVUMEH / Google Search) para prevención de riesgos y seguridad ocupacional.
          </p>
        </div>

        <button
          onClick={fetchWeatherAlerts}
          disabled={isLoadingWeather}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWeather ? 'animate-spin' : ''}`} />
          {isLoadingWeather ? 'Consultando Alertas...' : 'Actualizar Alertas (Google Search)'}
        </button>
      </div>

      {/* Main Grid: Map + Project Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Map View */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Map Top Bar */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-800 truncate">
                  {activeProject.name} — {activeProject.location}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  {activeProject.lat.toFixed(4)}°N, {activeProject.lng.toFixed(4)}°W
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Map Type Toggle */}
                <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 text-xs">
                  <button
                    onClick={() => setMapType('roadmap')}
                    className={`px-2.5 py-1 rounded font-medium transition ${
                      mapType === 'roadmap' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Plano
                  </button>
                  <button
                    onClick={() => setMapType('satellite')}
                    className={`px-2.5 py-1 rounded font-medium transition ${
                      mapType === 'satellite' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Satelital
                  </button>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${activeProject.lat},${activeProject.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition border border-blue-200"
                >
                  <ExternalLink className="w-3 h-3" />
                  Abrir en Google Maps
                </a>
              </div>
            </div>

            {/* Google Maps Iframe Container */}
            <div className="relative w-full h-[380px] bg-slate-100">
              <iframe
                title="Google Maps Obra de Construcción"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={mapEmbedUrl}
                className="w-full h-full filter contrast-[1.02]"
              />

              {/* Overlay Marker Card */}
              <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-xs bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/90 shadow-lg text-xs space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      {activeProject.code}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs mt-1">{activeProject.name}</h4>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {activeProject.status}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Avance Físico:</span>
                    <span className="font-bold text-slate-800">{activeProject.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${activeProject.progressPercent}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-600">
                  <span>Presupuesto:</span>
                  <span className="font-bold text-slate-900">{formatMoney(activeProject.budgetTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Construction Safety Protocol Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-amber-900">
              <p className="font-bold text-sm">Protocolo Oficial de Seguridad en Terreno (CONRED / INSIVUMEH)</p>
              <p className="leading-relaxed">
                Todas las cuadrillas deben acatar la suspensión de trabajos en alturas cuando las ráfagas superen los 30 km/h o ante tormentas eléctricas. En colados de concreto con más del 30% de probabilidad de lluvia, es obligatorio mantener lonas listas y acelerante de fraguado disponible.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Construction Sites Pin Selector */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-blue-600" />
                Obras Georreferenciadas ({projects.length})
              </h4>
              <span className="text-[10px] text-slate-500 font-medium">Guatemala</span>
            </div>

            <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
              {projects.map((proj) => {
                const isSelected = proj.id === selectedSiteId;
                return (
                  <div
                    key={proj.id}
                    onClick={() => {
                      setSelectedSiteId(proj.id);
                      onSelectProject(proj.id);
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer text-xs ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isSelected ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-slate-400'
                            }`}
                          />
                          <span className="font-bold text-slate-900">{proj.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          <span className="truncate">{proj.location}</span>
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {proj.code}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                      <span>Avance: <strong className="text-slate-900">{proj.progressPercent}%</strong></span>
                      <span className="font-mono text-[10px] text-blue-700">
                        {proj.lat.toFixed(3)}°, {proj.lng.toFixed(3)}°
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Weather Alerts & Safety Monitoring Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <CloudSun className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-base text-slate-900">
                Alertas Meteorológicas en Tiempo Real & Monitoreo de Seguridad
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Datos verificados vía {weatherSource} • {lastRefreshed}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Monitoreo Activo INSIVUMEH
            </span>
          </div>
        </div>

        {/* Alerts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {alerts.map((alert) => {
            const isYellow = alert.insivumehLevel === 'Amarillo';
            const isOrange = alert.insivumehLevel === 'Naranja';
            const isGreen = alert.insivumehLevel === 'Verde';

            return (
              <div
                key={alert.id}
                className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-slate-900">{alert.region}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        isYellow
                          ? 'bg-amber-100 text-amber-800'
                          : isOrange
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      Nivel {alert.insivumehLevel}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-lg border border-slate-200/80 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Temp</span>
                      <span className="font-bold text-xs text-slate-800 flex items-center justify-center gap-0.5">
                        <Thermometer className="w-3 h-3 text-rose-500" />
                        {alert.temperature}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Lluvia</span>
                      <span className="font-bold text-xs text-blue-600 flex items-center justify-center gap-0.5">
                        <CloudRain className="w-3 h-3 text-blue-500" />
                        {alert.rainProbability}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Viento</span>
                      <span className="font-bold text-xs text-slate-700 flex items-center justify-center gap-0.5">
                        <Wind className="w-3 h-3 text-slate-400" />
                        {alert.windSpeed}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 font-medium italic">
                    "{alert.condition}"
                  </p>

                  <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Directivas de Seguridad para Obra:
                    </span>
                    <ul className="space-y-1">
                      {alert.safetyDirectives.map((dir, idx) => (
                        <li key={idx} className="text-[11px] text-slate-700 flex items-start gap-1.5 leading-snug">
                          <span className="text-blue-600 font-bold shrink-0 mt-0.5">•</span>
                          <span>{dir}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Fuente: {alert.source}</span>
                  <span>{alert.lastUpdated}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
