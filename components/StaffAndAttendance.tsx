'use client';

import React, { useState } from 'react';
import {
  Users,
  Plus,
  CheckCircle2,
  MapPin,
  Navigation,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Clock,
  Trash2,
  Building2,
  Compass,
  Check,
  Filter,
  Smartphone,
  Calendar,
} from 'lucide-react';
import { Employee, AttendanceRecord, Project } from '@/lib/types';
import { formatGTQ } from '@/lib/data';
import {
  calculateDistanceMeters,
  validateProjectGeofence,
  getCurrentGpsPosition,
  DEFAULT_GEOFENCE_RADIUS_METERS,
} from '@/lib/geofencing';

interface StaffAndAttendanceProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  projects: Project[];
  activeProjectId: string;
  onAddEmployee: (emp: Employee) => void;
  onAddAttendance?: (record: AttendanceRecord) => void;
  onDeleteAttendance?: (id: string) => void;
}

export const StaffAndAttendance: React.FC<StaffAndAttendanceProps> = ({
  employees,
  attendance,
  projects,
  activeProjectId,
  onAddEmployee,
  onAddAttendance,
  onDeleteAttendance,
}) => {
  // Navigation Tabs: 'asistencia' or 'personal'
  const [activeTab, setActiveTab] = useState<'asistencia' | 'personal'>('asistencia');

  // Employee creation modal
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<
    'Capataz' | 'Albañil' | 'Ayudante' | 'Arquitecto Residente' | 'Bodeguero' | 'Electricista'
  >('Albañil');
  const [rate, setRate] = useState('175');
  const [phone, setPhone] = useState('+502 ');

  // Attendance Form State
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees[0]?.id || '');
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<'Presente' | 'Ausente' | 'Permiso' | 'Incapacidad IGSS'>(
    'Presente'
  );
  const [overtimeHours, setOvertimeHours] = useState<number>(0);

  // GPS Verification State
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [isWithinGeofence, setIsWithinGeofence] = useState<boolean | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [showOverrideInput, setShowOverrideInput] = useState<boolean>(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);

  // Filter for history
  const [historyProjectFilter, setHistoryProjectFilter] = useState<string>(activeProjectId);

  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Recalculate distance whenever user coords or selected project changes
  const runGeofenceCheck = (coords: { lat: number; lng: number }) => {
    const res = validateProjectGeofence(
      coords.lat,
      coords.lng,
      currentProject.lat,
      currentProject.lng,
      DEFAULT_GEOFENCE_RADIUS_METERS
    );
    setDistanceMeters(res.distanceMeters);
    setIsWithinGeofence(res.isWithinGeofence);
    if (!res.isWithinGeofence) {
      setShowOverrideInput(true);
    } else {
      setShowOverrideInput(false);
      setOverrideReason('');
    }
  };

  // Real GPS Capture from device
  const handleGetLiveGps = async () => {
    setIsLocating(true);
    setGpsError(null);
    try {
      const pos = await getCurrentGpsPosition();
      const coords = { lat: pos.lat, lng: pos.lng };
      setUserCoords(coords);
      setGpsAccuracy(Math.round(pos.accuracy));
      runGeofenceCheck(coords);
    } catch (err: any) {
      console.warn('GPS location error:', err);
      let errorMsg = 'No se pudo obtener la señal GPS del dispositivo.';
      if (err.code === 1) {
        errorMsg = 'Permiso de ubicación denegado en el navegador. Active el GPS o use la simulación de prueba.';
      } else if (err.code === 2) {
        errorMsg = 'Posición no disponible o sin señal satelital.';
      } else if (err.code === 3) {
        errorMsg = 'Tiempo de espera agotado al consultar coordenadas GPS.';
      }
      setGpsError(errorMsg);
    } finally {
      setIsLocating(false);
    }
  };

  // Test / Demo: simulate employee directly on-site (within 35m)
  const handleSimulateOnSite = () => {
    setGpsError(null);
    // Add micro-offset (~30m)
    const simulated = {
      lat: currentProject.lat + 0.00022,
      lng: currentProject.lng + 0.00018,
    };
    setUserCoords(simulated);
    setGpsAccuracy(8);
    runGeofenceCheck(simulated);
  };

  // Test / Demo: simulate employee outside geofence (e.g. 1.4km away)
  const handleSimulateOffSite = () => {
    setGpsError(null);
    // Add ~1.4km offset
    const simulated = {
      lat: currentProject.lat + 0.0125,
      lng: currentProject.lng + 0.0095,
    };
    setUserCoords(simulated);
    setGpsAccuracy(15);
    runGeofenceCheck(simulated);
  };

  // Register Attendance Form Submit with 500-meter Geolocation Validation Layer
  const handleRegisterAttendance = async (e: React.FormEvent) => {
    e.preventDefault();

    const emp = employees.find((x) => x.id === selectedEmployeeId) || employees[0];
    if (!emp) return;

    let activeCoords = userCoords;
    let activeWithin = isWithinGeofence;
    let activeDist = distanceMeters;

    // Validation layer for "Presente" status using Geolocation API
    if (status === 'Presente') {
      if (!activeCoords) {
        setIsLocating(true);
        setGpsError(null);
        try {
          const pos = await getCurrentGpsPosition();
          activeCoords = { lat: pos.lat, lng: pos.lng };
          setUserCoords(activeCoords);
          setGpsAccuracy(Math.round(pos.accuracy));

          const res = validateProjectGeofence(
            activeCoords.lat,
            activeCoords.lng,
            currentProject.lat,
            currentProject.lng,
            DEFAULT_GEOFENCE_RADIUS_METERS
          );
          activeDist = res.distanceMeters;
          activeWithin = res.isWithinGeofence;
          setDistanceMeters(activeDist);
          setIsWithinGeofence(activeWithin);
        } catch (err: any) {
          setIsLocating(false);
          let errorMsg = 'Validación Geográfica Obligatoria: Active los permisos de GPS del navegador para verificar que el empleado se encuentre dentro del radio de 500 metros de la obra.';
          if (err.code === 1) {
            errorMsg = 'Permiso de ubicación denegado en el navegador. Por favor autorice el acceso GPS o use la simulación "En Obra" para verificar.';
          }
          setGpsError(errorMsg);
          return;
        } finally {
          setIsLocating(false);
        }
      }

      // Strict validation check: Must be within 500-meter radius
      if (activeWithin === false && !overrideReason.trim()) {
        setGpsError(
          `⛔ Bloqueo de Asistencia por Geocerca: El empleado se encuentra a ${activeDist}m del proyecto (radio máximo permitido: ${DEFAULT_GEOFENCE_RADIUS_METERS} metros). Para registrar asistencia fuera de la obra se requiere una justificación autorizada por el supervisor.`
        );
        setShowOverrideInput(true);
        return;
      }
    }

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      projectId: selectedProjectId,
      date: attendanceDate,
      employeeId: emp.id,
      employeeName: emp.name,
      status,
      overtimeHours: Number(overtimeHours) || 0,
      gpsCoords: activeCoords || undefined,
      gpsVerified: activeWithin ?? undefined,
      distanceMeters: activeDist ?? undefined,
      gpsTimestamp: activeCoords
        ? `${attendanceDate} ${new Date().toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}`
        : undefined,
      overrideReason: activeWithin === false ? overrideReason : undefined,
    };

    if (onAddAttendance) {
      onAddAttendance(newRecord);
    }

    setSaveSuccessToast(`Asistencia de ${emp.name} registrada correctamente (Validación: ${activeWithin ? 'En Obra <500m' : 'Excepción auditada'}).`);
    setTimeout(() => setSaveSuccessToast(null), 4000);

    // Reset temporary state
    setUserCoords(null);
    setDistanceMeters(null);
    setIsWithinGeofence(null);
    setOverrideReason('');
    setShowOverrideInput(false);
    setGpsError(null);
  };

  // Employee creation submit
  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const emp: Employee = {
      id: `emp-${Date.now()}`,
      name,
      role,
      dailyRateGTQ: Number(rate) || 150,
      igssAffiliated: true,
      phone,
    };

    onAddEmployee(emp);
    setIsOpenModal(false);
    setName('');
  };

  // Attendance metrics
  const filteredAttendance = attendance.filter(
    (a) => historyProjectFilter === 'all' || a.projectId === historyProjectFilter
  );

  const totalRegistered = filteredAttendance.length;
  const verifiedGpsCount = filteredAttendance.filter((a) => a.gpsVerified === true).length;
  const outsideCount = filteredAttendance.filter((a) => a.gpsVerified === false).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Navigation className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Control de Personal, Cuadrillas & Asistencia con Geocerca GPS
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Validación satelital en tiempo real: compara las coordenadas del empleado con el perímetro del proyecto ({DEFAULT_GEOFENCE_RADIUS_METERS}m de radio).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation Pill Buttons */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('asistencia')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'asistencia'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Registro & Marcaje GPS
            </button>
            <button
              onClick={() => setActiveTab('personal')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'personal'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cuadrillas ({employees.length})
            </button>
          </div>

          <button
            onClick={() => setIsOpenModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nuevo Empleado
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Nómina Total</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{employees.length} trabajadores</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Albañiles, ayudantes y capataces</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-blue-600 uppercase">Marcajes Registrados</p>
          <p className="text-xl font-bold text-blue-950 mt-1">{totalRegistered} asistencias</p>
          <p className="text-[10px] text-blue-600 mt-0.5">En historial del proyecto</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase">Verificados en Obra (GPS)</p>
          <p className="text-xl font-bold text-emerald-950 mt-1">{verifiedGpsCount} en sitio</p>
          <p className="text-[10px] text-emerald-700 mt-0.5">Dentro del radio de {DEFAULT_GEOFENCE_RADIUS_METERS}m</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-amber-600 uppercase">Excepciones / Fuera Obra</p>
          <p className="text-xl font-bold text-amber-950 mt-1">{outsideCount} advertencias</p>
          <p className="text-[10px] text-amber-700 mt-0.5">Con justificación autorizada</p>
        </div>
      </div>

      {/* SUCCESS TOAST */}
      {saveSuccessToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-900 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <p className="text-xs font-bold">{saveSuccessToast}</p>
          </div>
          <button
            onClick={() => setSaveSuccessToast(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* VIEW 1: ATTENDANCE REGISTRATION & GPS AUDIT */}
      {activeTab === 'asistencia' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Geofence Check-in Form (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Compass className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Registrar Asistencia en Obra</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                  Geocerca Activa
                </span>
              </div>

              <form onSubmit={handleRegisterAttendance} className="space-y-4">
                {/* Project selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Proyecto / Frente de Obra
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      if (userCoords) {
                        const proj = projects.find((p) => p.id === e.target.value);
                        if (proj) {
                          const res = validateProjectGeofence(
                            userCoords.lat,
                            userCoords.lng,
                            proj.lat,
                            proj.lng,
                            DEFAULT_GEOFENCE_RADIUS_METERS
                          );
                          setDistanceMeters(res.distanceMeters);
                          setIsWithinGeofence(res.isWithinGeofence);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-800 font-medium"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    Coords Obra: {currentProject.lat.toFixed(4)}° N, {currentProject.lng.toFixed(4)}° W ({currentProject.municipality})
                  </p>
                </div>

                {/* Employee selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Empleado / Miembro de Cuadrilla
                  </label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-800 font-medium"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} — {emp.role} ({formatGTQ(emp.dailyRateGTQ)}/día)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date and Overtime */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha</label>
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Horas Extras</label>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      value={overtimeHours}
                      onChange={(e) => setOvertimeHours(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-800"
                    />
                  </div>
                </div>

                {/* Status selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estado de Asistencia</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-800 font-medium"
                  >
                    <option value="Presente">Presente en Sitio</option>
                    <option value="Ausente">Ausente / Inasistencia</option>
                    <option value="Permiso">Permiso Autorizado</option>
                    <option value="Incapacidad IGSS">Incapacidad Médica IGSS</option>
                  </select>
                </div>

                {/* GPS VALIDATION BOX */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                      Validación GPS de Ubicación
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Radio max: {DEFAULT_GEOFENCE_RADIUS_METERS}m
                    </span>
                  </div>

                  {/* Actions to get or simulate GPS */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={handleGetLiveGps}
                      disabled={isLocating}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
                    >
                      <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                      {isLocating ? 'Detectando GPS...' : 'Obtener GPS en Vivo'}
                    </button>

                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={handleSimulateOnSite}
                        className="px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold transition cursor-pointer"
                        title="Simular ubicación dentro de la obra (30m de distancia)"
                      >
                        En Obra
                      </button>
                      <button
                        type="button"
                        onClick={handleSimulateOffSite}
                        className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold transition cursor-pointer"
                        title="Simular ubicación fuera de la obra (1.4km de distancia)"
                      >
                        Fuera
                      </button>
                    </div>
                  </div>

                  {/* GPS Error Alert */}
                  {gpsError && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p>{gpsError}</p>
                    </div>
                  )}

                  {/* GPS Coordinates & Result Display */}
                  {userCoords && distanceMeters !== null && (
                    <div
                      className={`p-3 rounded-xl border text-xs space-y-2 transition ${
                        isWithinGeofence
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                          : 'bg-rose-50/80 border-rose-200 text-rose-950'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {isWithinGeofence ? (
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <span className="font-bold">
                            {isWithinGeofence ? 'EN OBRA — GPS CONFIRMADO' : 'FUERA DEL PERÍMETRO'}
                          </span>
                        </div>
                        <span
                          className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded-full ${
                            isWithinGeofence
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {distanceMeters} metros
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 space-y-0.5 pt-1 border-t border-slate-200/60 font-mono">
                        <p>GPS Empleado: {userCoords.lat.toFixed(5)}°, {userCoords.lng.toFixed(5)}°</p>
                        <p>Punto Proyecto: {currentProject.lat.toFixed(5)}°, {currentProject.lng.toFixed(5)}°</p>
                        {gpsAccuracy && <p>Precisión Satelital: ±{gpsAccuracy}m</p>}
                      </div>

                      {!isWithinGeofence && (
                        <p className="text-[11px] text-rose-800 font-semibold pt-1">
                          ⚠️ El empleado excede la tolerancia permitida ({DEFAULT_GEOFENCE_RADIUS_METERS}m). Se registrará una excepción auditada.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Override input when outside geofence */}
                  {showOverrideInput && isWithinGeofence === false && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
                      <label className="block text-[11px] font-bold text-amber-900">
                        Justificación de Excepción (Obligatoria para Capataz/Supervisor)
                      </label>
                      <input
                        type="text"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="Ej. Comisión de compra de insumos en ferretería central"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white text-slate-900 placeholder:text-slate-400"
                        required
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Guardar Registro de Asistencia
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: History Table with GPS Badges (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Historial de Marcajes y Auditoría GPS</h3>
                    <p className="text-[11px] text-slate-500">
                      Verificación de presencia física con geocerca en obras de Guatemala.
                    </p>
                  </div>
                </div>

                {/* Filter by project */}
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={historyProjectFilter}
                    onChange={(e) => setHistoryProjectFilter(e.target.value)}
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-slate-50 text-slate-800"
                  >
                    <option value="all">Todos los Proyectos</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Records List */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="pb-2.5 pl-1">Fecha</th>
                      <th className="pb-2.5">Empleado</th>
                      <th className="pb-2.5">Proyecto</th>
                      <th className="pb-2.5">Estado</th>
                      <th className="pb-2.5">Verificación GPS</th>
                      <th className="pb-2.5 text-right pr-1">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAttendance.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                          No hay registros de asistencia para este filtro.
                        </td>
                      </tr>
                    ) : (
                      filteredAttendance.map((rec) => {
                        const proj = projects.find((p) => p.id === rec.projectId);
                        return (
                          <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 pl-1 font-mono text-[11px] text-slate-600">
                              {rec.date}
                            </td>
                            <td className="py-3">
                              <p className="font-bold text-slate-900">{rec.employeeName}</p>
                              {rec.overtimeHours > 0 && (
                                <span className="text-[10px] text-amber-700 font-semibold">
                                  +{rec.overtimeHours}h extras
                                </span>
                              )}
                            </td>
                            <td className="py-3">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                {proj?.code || rec.projectId}
                              </span>
                            </td>
                            <td className="py-3">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  rec.status === 'Presente'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : rec.status === 'Ausente'
                                    ? 'bg-rose-50 text-rose-700'
                                    : 'bg-blue-50 text-blue-700'
                                }`}
                              >
                                {rec.status}
                              </span>
                            </td>
                            <td className="py-3">
                              {rec.gpsVerified === true ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                    <ShieldCheck className="w-3 h-3" />
                                    En Obra ({rec.distanceMeters ?? '< 250'}m)
                                  </span>
                                  {rec.gpsCoords && (
                                    <p className="text-[9px] font-mono text-slate-400">
                                      {rec.gpsCoords.lat.toFixed(4)}, {rec.gpsCoords.lng.toFixed(4)}
                                    </p>
                                  )}
                                </div>
                              ) : rec.gpsVerified === false ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    Fuera ({rec.distanceMeters ?? '> 250'}m)
                                  </span>
                                  {rec.overrideReason && (
                                    <p className="text-[10px] text-amber-800 italic max-w-[140px] truncate" title={rec.overrideReason}>
                                      "{rec.overrideReason}"
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">
                                  Sin GPS
                                </span>
                              )}
                            </td>
                            <td className="py-3 text-right pr-1">
                              {onDeleteAttendance && (
                                <button
                                  onClick={() => onDeleteAttendance(rec.id)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                  title="Eliminar registro"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: EMPLOYEES ROSTER & CUADRILLAS */}
      {activeTab === 'personal' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {employees.map((emp) => (
            <div key={emp.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                  {emp.role}
                </span>
                {emp.igssAffiliated && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                    IGSS Afiliado
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">{emp.name}</h3>
                <p className="text-xs text-slate-500">{emp.phone}</p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500">Jornal Diario:</span>
                <span className="font-bold text-slate-900">{formatGTQ(emp.dailyRateGTQ)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE EMPLOYEE MODAL */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Registrar Nuevo Empleado</h3>
              <button
                onClick={() => setIsOpenModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateEmployee} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Juan Carlos Tumax"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Puesto / Rol</label>
                  <select
                    value={role}
                    onChange={(e: any) => setRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                  >
                    <option value="Capataz">Capataz</option>
                    <option value="Albañil">Albañil</option>
                    <option value="Ayudante">Ayudante</option>
                    <option value="Arquitecto Residente">Arquitecto Residente</option>
                    <option value="Bodeguero">Bodeguero</option>
                    <option value="Electricista">Electricista</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jornal Diario (Q)</label>
                  <input
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-700 bg-slate-100 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                  Guardar Empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
