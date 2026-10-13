'use client';

import React, { useState } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  Calendar,
  HardHat,
  ShieldCheck,
  CheckCircle2,
  Clock,
  CloudSun,
  PenTool,
  Printer,
  ChevronRight,
  X,
  FileText,
  UserCheck,
  Camera,
  Image as ImageIcon,
  Eye,
  Trash2,
  Navigation,
  Radio,
  LocateFixed,
  ExternalLink,
} from 'lucide-react';
import { Project, FieldVisit, FieldPhoto, CompanySettings, MachineryLog, ExpenseRecord, AttendanceRecord } from '@/lib/types';
import { formatGTQ, formatUSD } from '@/lib/data';
import { captureExactFieldGps, ExactGpsCapture } from '@/lib/geofencing';
import { SignaturePad, SignatureResult } from '@/components/SignaturePad';
import { SignatureCanvas, SignatureCanvasResult } from '@/components/SignatureCanvas';
import { GoogleMapsSafetyView } from '@/components/GoogleMapsSafetyView';
import { FieldPhotoGallery } from '@/components/FieldPhotoGallery';
import { CameraCaptureModal } from '@/components/CameraCaptureModal';

interface ProjectsAndVisitsProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onAddProject: (project: Project) => void;
  fieldVisits: FieldVisit[];
  onAddFieldVisit: (visit: FieldVisit) => void;
  onUpdateFieldVisit?: (visit: FieldVisit) => void;
  currency: 'GTQ' | 'USD';
  company: CompanySettings;
  expenses: ExpenseRecord[];
  machineryLogs: MachineryLog[];
  machinery: any[];
  attendance: AttendanceRecord[];
}

export const ProjectsAndVisits: React.FC<ProjectsAndVisitsProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onAddProject,
  fieldVisits,
  onAddFieldVisit,
  onUpdateFieldVisit,
  currency,
  company,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'bitacoras' | 'galeria' | 'mapa_clima' | 'proyectos'>('bitacoras');

  // Modal new project
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('OBRA-2025-04');
  const [newName, setNewName] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newMunicipality, setNewMunicipality] = useState('Guatemala');
  const [newBudget, setNewBudget] = useState('5000000');

  // Modal new field visit / bitácora with Digital Signature & Photos
  const [isNewVisitModalOpen, setIsNewVisitModalOpen] = useState(false);
  const [visitNotes, setVisitNotes] = useState('');
  const [visitForeman, setVisitForeman] = useState('Don Mario Cifuentes');
  const [visitWeather, setVisitWeather] = useState<'Soleado' | 'Lluvia Moderada' | 'Tormenta Fuerte' | 'Nublado'>('Soleado');
  const [visitWorkersCount, setVisitWorkersCount] = useState('35');
  const [visitAttachedPhotos, setVisitAttachedPhotos] = useState<FieldPhoto[]>([]);

  // Real-time GPS Geolocation state for field visit
  const [capturedGps, setCapturedGps] = useState<ExactGpsCapture | null>(null);
  const [isCapturingGps, setIsCapturingGps] = useState(false);

  const handleAcquireExactGps = async (projLat?: number, projLng?: number) => {
    setIsCapturingGps(true);
    try {
      const lat = projLat ?? activeProject.lat;
      const lng = projLng ?? activeProject.lng;
      const res = await captureExactFieldGps(lat, lng, 500);
      setCapturedGps(res);
    } catch (err) {
      console.error('Error capturando GPS:', err);
    } finally {
      setIsCapturingGps(false);
    }
  };

  const handleOpenNewVisitModal = () => {
    setIsNewVisitModalOpen(true);
    // Automatically trigger GPS acquisition immediately
    handleAcquireExactGps(activeProject.lat, activeProject.lng);
  };

  // Signing state (can sign new visit or an existing pending visit)
  const [isSignaturePadOpen, setIsSignaturePadOpen] = useState(false);
  const [signingVisitId, setSigningVisitId] = useState<string | null>(null); // null means new visit
  const [signedData, setSignedData] = useState<SignatureResult | null>(null);

  // Lightbox preview for photos
  const [lightboxPhoto, setLightboxPhoto] = useState<FieldPhoto | null>(null);

  // Camera Modal for construction site photos
  const [isSiteCameraOpen, setIsSiteCameraOpen] = useState(false);
  const [cameraVisitTargetId, setCameraVisitTargetId] = useState<string | null>(null);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  const formatMoney = (amount: number) => {
    return currency === 'GTQ' ? formatGTQ(amount) : formatUSD(amount, company.exchangeRate);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const proj: Project = {
      id: `p-${Date.now()}`,
      code: newCode,
      name: newName,
      client: newClient || 'Cliente General',
      location: newLocation || 'Guatemala',
      municipality: newMunicipality,
      department: 'Guatemala',
      budgetTotal: Number(newBudget) || 1000000,
      spentTotal: 0,
      progressPercent: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-12-31',
      status: 'Planificación',
      lat: 14.6349,
      lng: -90.5069,
    };

    onAddProject(proj);
    setIsNewProjectModalOpen(false);
    setNewName('');
    setNewClient('');
    setNewLocation('');
  };

  const handleSaveSignature = (signatureResult: SignatureResult) => {
    if (signingVisitId) {
      // Signing an existing visit
      const targetVisit = fieldVisits.find((v) => v.id === signingVisitId);
      if (targetVisit) {
        const updatedVisit: FieldVisit = {
          ...targetVisit,
          signatureDataUrl: signatureResult.dataUrl,
          signerDpi: signatureResult.signerDpi,
          signerRole: signatureResult.signerRole,
          foremanName: signatureResult.signerName,
          gpsCoords: signatureResult.location || targetVisit.gpsCoords,
          status: 'Autorizado',
        };
        if (onUpdateFieldVisit) {
          onUpdateFieldVisit(updatedVisit);
        }
      }
      setSigningVisitId(null);
    } else {
      // Signing a new visit before publish
      setSignedData(signatureResult);
      setVisitForeman(signatureResult.signerName);
    }
  };

  const handlePublishVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitNotes.trim()) return;

    const finalLat = capturedGps ? capturedGps.latitude : activeProject.lat;
    const finalLng = capturedGps ? capturedGps.longitude : activeProject.lng;
    const finalAccuracy = capturedGps ? capturedGps.accuracy : 12.5;
    const finalGeofenceValid = capturedGps ? capturedGps.geofenceValid : true;
    const finalGeofenceDist = capturedGps ? capturedGps.geofenceDistanceMeters : 0;
    const finalGpsTimestamp = capturedGps ? capturedGps.timestamp : new Date().toISOString();

    const newVisit: FieldVisit = {
      id: `fv-${Date.now()}`,
      projectId: activeProject.id,
      projectName: activeProject.name,
      date: new Date().toISOString().split('T')[0],
      foremanName: visitForeman,
      notes: visitNotes,
      weather: visitWeather,
      workersCount: Number(visitWorkersCount) || 30,
      signatureDataUrl: signedData ? signedData.dataUrl : undefined,
      signerDpi: signedData ? signedData.signerDpi : '2489 10293 0101',
      signerRole: signedData ? signedData.signerRole : 'Capataz General de Obra',
      gpsCoords: { lat: finalLat, lng: finalLng },
      latitude: finalLat,
      longitude: finalLng,
      accuracy: finalAccuracy,
      geofenceValid: finalGeofenceValid,
      geofenceDistanceMeters: finalGeofenceDist,
      gpsTimestamp: finalGpsTimestamp,
      status: signedData ? 'Autorizado' : 'Pendiente',
      photos: visitAttachedPhotos,
    };

    onAddFieldVisit(newVisit);
    setIsNewVisitModalOpen(false);
    setVisitNotes('');
    setSignedData(null);
    setVisitAttachedPhotos([]);
    setCapturedGps(null);
  };

  // Add photo to an existing visit
  const handleAddPhotoToVisit = (visitId: string, photo: FieldPhoto) => {
    const targetVisit = fieldVisits.find((v) => v.id === visitId);
    if (!targetVisit) return;

    const updatedPhotos = [...(targetVisit.photos || []), photo];
    const updatedVisit: FieldVisit = {
      ...targetVisit,
      photos: updatedPhotos,
    };

    if (onUpdateFieldVisit) {
      onUpdateFieldVisit(updatedVisit);
    }
  };

  const handleDeletePhotoFromVisit = (visitId: string, photoId: string) => {
    const targetVisit = fieldVisits.find((v) => v.id === visitId);
    if (!targetVisit) return;

    const updatedPhotos = (targetVisit.photos || []).filter((p) => p.id !== photoId);
    const updatedVisit: FieldVisit = {
      ...targetVisit,
      photos: updatedPhotos,
    };

    if (onUpdateFieldVisit) {
      onUpdateFieldVisit(updatedVisit);
    }
  };

  // Quick camera snapshot for new visit
  const handleAttachSnapshotToNewVisit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const photo: FieldPhoto = {
        id: `pht-new-${Date.now()}`,
        url: reader.result as string,
        caption: 'Evidencia fotográfica tomada en campo',
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toLocaleTimeString('es-GT'),
        coords: { lat: activeProject.lat, lng: activeProject.lng },
        takenBy: visitForeman,
      };
      setVisitAttachedPhotos((prev) => [...prev, photo]);
    };
    reader.readAsDataURL(file);
  };

  const handleCaptureSitePhoto = (
    dataUrl: string,
    meta: { coords?: { lat: number; lng: number }; timestamp: string; caption?: string }
  ) => {
    const photo: FieldPhoto = {
      id: `pht-${Date.now()}`,
      url: dataUrl,
      caption: meta.caption || 'Fotografía de avance de obra en campo',
      date: new Date().toISOString().split('T')[0],
      timestamp: meta.timestamp,
      coords: meta.coords || { lat: activeProject.lat, lng: activeProject.lng },
      takenBy: visitForeman || 'Supervisor de Obra',
    };

    if (cameraVisitTargetId) {
      handleAddPhotoToVisit(cameraVisitTargetId, photo);
      setCameraVisitTargetId(null);
    } else {
      setVisitAttachedPhotos((prev) => [...prev, photo]);
    }
  };

  // Count total photos for the active project
  const projectPhotosCount = fieldVisits
    .filter((v) => v.projectId === activeProject.id)
    .reduce((sum, v) => sum + (v.photos?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Sub-header navigation */}
      <div className="glass-panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Gestión de Proyectos, Bitácoras & Galería GPS</h2>
          <p className="text-xs text-slate-400">
            Control satelital de campo, reportes diarios de avance, fotografías con georreferenciación y firma en lienzo.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-white/[0.06] border border-white/10 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setActiveSubTab('bitacoras')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'bitacoras' ? 'bg-sky-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bitácoras & Firmas
            </button>
            <button
              onClick={() => setActiveSubTab('galeria')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'galeria' ? 'bg-sky-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Galería GPS ({projectPhotosCount})
            </button>
            <button
              onClick={() => setActiveSubTab('mapa_clima')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'mapa_clima' ? 'bg-sky-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              Mapa Google & Clima
            </button>
            <button
              onClick={() => setActiveSubTab('proyectos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'proyectos' ? 'bg-sky-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Proyectos ({projects.length})
            </button>
          </div>

          {activeSubTab === 'proyectos' ? (
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Nuevo Proyecto
            </button>
          ) : (
            <button
              onClick={() => {
                setSignedData(null);
                setVisitAttachedPhotos([]);
                setIsNewVisitModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer"
            >
              <PenTool className="w-4 h-4" /> Nueva Bitácora con Firma
            </button>
          )}
        </div>
      </div>

      {/* Projects SubView */}
      {activeSubTab === 'proyectos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => {
            const isSelected = proj.id === activeProjectId;
            return (
              <div
                key={proj.id}
                className={`glass-panel flex flex-col justify-between transition ${
                  isSelected ? 'border-sky-400 ring-2 ring-sky-400/30' : 'hover:border-white/20'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-sky-400/10 text-sky-300 border border-sky-400/20">
                      {proj.code}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        proj.status === 'En Ejecución'
                          ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/30'
                          : 'bg-amber-400/10 text-amber-300 border border-amber-400/30'
                      }`}
                    >
                      {proj.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-white">{proj.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Cliente: {proj.client}</p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">{proj.location}</span>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                      <span>Avance Físico</span>
                      <span className="font-bold text-sky-400">{proj.progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full"
                        style={{ width: `${proj.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400">Presupuesto</p>
                    <p className="text-xs font-bold text-white">{formatMoney(proj.budgetTotal)}</p>
                  </div>
                  <button
                    onClick={() => onSelectProject(proj.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isSelected ? 'bg-sky-400 text-slate-950 shadow-sm' : 'bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/10'
                    }`}
                  >
                    {isSelected ? 'Proyecto Activo' : 'Seleccionar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bitácoras & Digital Signature SubView */}
      {activeSubTab === 'bitacoras' && (
        <div className="space-y-5">
          <div className="glass-panel border-amber-400/30 bg-amber-400/5 p-4 flex items-start gap-3">
            <div className="p-2 bg-amber-400 text-slate-950 rounded-xl shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs text-amber-200">
              <p className="font-bold text-sm text-amber-300">Firma Digital sobre Lienzo Canvas & Fotos con GPS</p>
              <p className="leading-relaxed">
                Cada reporte diario y bitácora de obra cuenta con validación oficial del capataz en HTML5 canvas y soporte de evidencias fotográficas capturadas en obra con coordenadas geográficas y sello de tiempo inalterable.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {fieldVisits.map((visit) => (
              <div key={visit.id} className="glass-panel space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-400/20 text-sky-400 border border-sky-400/30 flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{visit.projectName}</h4>
                      <p className="text-xs text-slate-400">Fecha: {visit.date} • Clima: {visit.weather}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        visit.status === 'Autorizado'
                          ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> {visit.status}
                    </span>
                    <button
                      onClick={() => window.print()}
                      className="p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-slate-300 hover:text-white transition cursor-pointer"
                      title="Imprimir Bitácora"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-3">
                    <p className="font-mono text-xs font-semibold text-slate-400 uppercase tracking-wider">Bitácora de Campo & Novedades</p>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-white/[0.04] p-3.5 rounded-xl border border-white/10">
                      {visit.notes}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                      <span>Obreros en Frentes: <strong className="text-white">{visit.workersCount}</strong></span>
                      <span className="flex items-center gap-1 text-emerald-400 font-mono">
                        <LocateFixed className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        GPS: {(visit.latitude ?? visit.gpsCoords?.lat ?? activeProject.lat).toFixed(6)}°, {(visit.longitude ?? visit.gpsCoords?.lng ?? activeProject.lng).toFixed(6)}°
                        <span className="text-slate-400 text-[10px]">(±{visit.accuracy ?? 10}m)</span>
                      </span>
                    </div>

                    {/* Photo Gallery Thumbnail Strip for this Visit */}
                    <div className="pt-2 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                        <span className="font-semibold flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5 text-blue-600" />
                          Fotografías en Obra ({visit.photos?.length || 0})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCameraVisitTargetId(visit.id);
                              setIsSiteCameraOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition border border-blue-200 cursor-pointer"
                            title="Tomar fotografía con cámara para esta bitácora"
                          >
                            <Camera className="w-3 h-3 text-blue-600" />
                            + Tomar Foto con Cámara
                          </button>
                          <button
                            onClick={() => setActiveSubTab('galeria')}
                            className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer text-[11px]"
                          >
                            Ver en Galería GPS →
                          </button>
                        </div>
                      </div>

                      {visit.photos && visit.photos.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {visit.photos.map((photo) => (
                            <div
                              key={photo.id}
                              onClick={() => setLightboxPhoto(photo)}
                              className="relative aspect-4/3 rounded-lg overflow-hidden border border-slate-200 group cursor-pointer shadow-2xs"
                            >
                              <img
                                src={photo.url}
                                alt={photo.caption}
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                <Eye className="w-4 h-4" />
                              </div>
                              {photo.coords && (
                                <div className="absolute bottom-1 left-1 bg-slate-900/80 text-white text-[8px] font-mono px-1 rounded">
                                  GPS
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">
                          Sin fotos registradas aún. Use el botón &quot;+ Tomar Foto con Cámara&quot; para documentar este frente.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Verification Column: Signature & Exact GPS Card */}
                  <div className="space-y-3">
                    {/* GPS Verification Card */}
                    <div className="bg-slate-900/90 text-white p-3.5 rounded-xl border border-slate-700 space-y-2.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                          <LocateFixed className="w-3.5 h-3.5 text-emerald-400" />
                          GPS Satelital Exacto
                        </p>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                            (visit.geofenceValid ?? true)
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {(visit.geofenceValid ?? true) ? '✓ En Perímetro' : '⚠️ Fuera de Perímetro'}
                        </span>
                      </div>

                      <div className="space-y-1 font-mono text-[11px] bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-sans">Latitud:</span>
                          <span className="text-emerald-400 font-bold">
                            {(visit.latitude ?? visit.gpsCoords?.lat ?? activeProject.lat).toFixed(6)}°
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-sans">Longitud:</span>
                          <span className="text-emerald-400 font-bold">
                            {(visit.longitude ?? visit.gpsCoords?.lng ?? activeProject.lng).toFixed(6)}°
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-sans">Precisión:</span>
                          <span className="text-sky-300 font-bold">±{visit.accuracy ?? 10} m</span>
                        </div>
                        {visit.geofenceDistanceMeters !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-sans">Distancia Obra:</span>
                            <span className="text-slate-200">{visit.geofenceDistanceMeters} m</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">
                          {visit.gpsTimestamp ? new Date(visit.gpsTimestamp).toLocaleTimeString('es-GT') : 'Sincronizado'}
                        </span>
                        <a
                          href={`https://www.google.com/maps?q=${visit.latitude ?? visit.gpsCoords?.lat ?? activeProject.lat},${visit.longitude ?? visit.gpsCoords?.lng ?? activeProject.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 font-bold hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" /> Ver en Google Maps
                        </a>
                      </div>
                    </div>

                    {/* Signature Verification Card */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Autorizado por Capataz</p>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">{visit.foremanName}</p>
                        <p className="text-xs text-slate-500">{visit.signerRole || 'Capataz General'}</p>
                        <p className="text-[11px] font-mono text-slate-600 mt-1">DPI: {visit.signerDpi || '2489 10293 0101'}</p>
                      </div>

                      <div className="border-t border-slate-200 pt-2 flex items-center justify-between gap-2">
                        {visit.signatureDataUrl ? (
                          <div className="flex items-center gap-2">
                            <div className="bg-white p-1 rounded-lg border border-slate-300 w-28 h-11 flex items-center justify-center shadow-2xs">
                              <img src={visit.signatureDataUrl} alt="Firma Digital" className="max-h-full max-w-full object-contain" />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSigningVisitId(visit.id);
                                setIsSignaturePadOpen(true);
                              }}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold hover:underline cursor-pointer"
                              title="Reemplazar o re-firmar esta bitácora"
                            >
                              Re-firmar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSigningVisitId(visit.id);
                              setIsSignaturePadOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition shadow-2xs"
                          >
                            <PenTool className="w-3.5 h-3.5" /> Firmar con SignaturePad
                          </button>
                        )}
                        <span className={`text-[10px] font-semibold flex items-center gap-1 ${visit.signatureDataUrl ? 'text-emerald-600' : 'text-amber-600'}`}>
                          <CheckCircle2 className="w-3 h-3" /> {visit.signatureDataUrl ? 'Autorizado' : 'Pendiente Firma'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo Gallery SubView */}
      {activeSubTab === 'galeria' && (
        <FieldPhotoGallery
          project={activeProject}
          fieldVisits={fieldVisits}
          onAddPhoto={handleAddPhotoToVisit}
          onDeletePhoto={handleDeletePhotoFromVisit}
        />
      )}

      {/* Google Maps & Weather Safety Monitoring SubView */}
      {activeSubTab === 'mapa_clima' && (
        <GoogleMapsSafetyView
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={onSelectProject}
          currency={currency}
        />
      )}

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Registrar Nueva Obra en Guatemala</h3>
              <button onClick={() => setIsNewProjectModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Código de Obra</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Proyecto</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Edificio Comercial Zona 10"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cliente / Propietario</label>
                <input
                  type="text"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  placeholder="Ej. Inmobiliaria Constructiva, S.A."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección / Ubicación en Guatemala</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Ej. 4a Avenida 10-21 Zona 14"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Presupuesto Inicial (GTQ)</label>
                <input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                  required
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-700 bg-slate-100 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                  Guardar Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Visit / Bitácora Modal with Digital Signature & Photo Capture */}
      {isNewVisitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Nueva Bitácora con Firma de Capataz</h3>
              </div>
              <button onClick={() => setIsNewVisitModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePublishVisit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Obra Asignada</label>
                <input
                  type="text"
                  disabled
                  value={`${activeProject.code} - ${activeProject.name}`}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-100 text-slate-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Condición Climática</label>
                  <select
                    value={visitWeather}
                    onChange={(e: any) => setVisitWeather(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                  >
                    <option value="Soleado">Soleado</option>
                    <option value="Nublado">Nublado</option>
                    <option value="Lluvia Moderada">Lluvia Moderada</option>
                    <option value="Tormenta Fuerte">Tormenta Fuerte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Obreros en Frentes</label>
                  <input
                    type="number"
                    value={visitWorkersCount}
                    onChange={(e) => setVisitWorkersCount(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                  />
                </div>
              </div>

              {/* Servicio de Geolocalización Satelital GPS */}
              <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-700 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <LocateFixed className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        Geolocalización GPS de Campo
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                          {capturedGps ? 'Coordenadas Fijadas' : 'Buscando Satélite'}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400">Captura de coordenadas exactas y validación de perímetro</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAcquireExactGps(activeProject.lat, activeProject.lng)}
                    disabled={isCapturingGps}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600 transition disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    <Radio className={`w-3 h-3 text-emerald-400 ${isCapturingGps ? 'animate-spin' : ''}`} />
                    {isCapturingGps ? 'Fijando GPS...' : 'Recapturar GPS'}
                  </button>
                </div>

                {capturedGps ? (
                  <div className="bg-slate-950/70 rounded-lg p-2.5 border border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Latitud:</span>
                      <span className="text-emerald-400 font-bold">{capturedGps.latitude.toFixed(6)}°</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Longitud:</span>
                      <span className="text-emerald-400 font-bold">{capturedGps.longitude.toFixed(6)}°</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Precisión Satelital:</span>
                      <span className="text-sky-300 font-bold">±{capturedGps.accuracy} m</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Geocerca de Obra (500m):</span>
                      <span className={`font-bold ${capturedGps.geofenceValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {capturedGps.geofenceValid ? `✓ En obra (${capturedGps.geofenceDistanceMeters}m)` : `⚠️ Fuera (${capturedGps.geofenceDistanceMeters}m)`}
                      </span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-800 text-[10px] text-slate-400 font-sans">
                      {capturedGps.statusMessage}
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-300 flex items-center gap-2 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                    <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>Conectando con el sensor de geolocalización satelital del dispositivo...</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bitácora / Novedades de Campo</label>
                <textarea
                  rows={3}
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="Describa avances de fundición, recepción de materiales, inspección estructural o incidentes..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              {/* Photo attachment in bitácora */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    Adjuntar Fotos de Campo (GPS & Timestamp)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCameraVisitTargetId(null);
                        setIsSiteCameraOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Tomar Foto con Cámara
                    </button>
                    <label className="cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition">
                      <Plus className="w-3.5 h-3.5" /> Subir Archivo
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleAttachSnapshotToNewVisit}
                      />
                    </label>
                  </div>
                </div>

                {visitAttachedPhotos.length > 0 ? (
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {visitAttachedPhotos.map((p, idx) => (
                      <div key={p.id} className="relative w-20 h-16 rounded-lg overflow-hidden border border-slate-300 shrink-0 bg-slate-900 group">
                        <img src={p.url} alt="Foto" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setVisitAttachedPhotos((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 bg-rose-600 text-white rounded p-0.5 shadow transition hover:bg-rose-700 cursor-pointer"
                          title="Eliminar foto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {p.coords && (
                          <div className="absolute bottom-0.5 left-0.5 bg-slate-950/80 text-[8px] font-mono text-sky-400 px-1 rounded">
                            GPS
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Opcional: Adjunte evidencias fotográficas geolocalizadas con la cámara del dispositivo a esta bitácora.
                  </p>
                )}
              </div>

              {/* Digital Signature status box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Firma en Pantalla (HTML5 Canvas)</p>
                  <p className="text-xs text-slate-500">
                    {signedData ? `Firmado por: ${signedData.signerName}` : 'Requerido para autorizar bitácora'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSigningVisitId(null);
                    setIsSignaturePadOpen(true);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                    signedData ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  {signedData ? 'Actualizar Firma' : 'Firmar en Pantalla'}
                </button>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewVisitModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!signedData}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  Publicar Bitácora Autorizada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SignatureCanvas Modal for Foremen */}
      {isSignaturePadOpen && (
        <SignatureCanvas
          isOpen={isSignaturePadOpen}
          onClose={() => {
            setIsSignaturePadOpen(false);
            setSigningVisitId(null);
          }}
          visit={signingVisitId ? fieldVisits.find((v) => v.id === signingVisitId) : undefined}
          visitId={signingVisitId || undefined}
          projectId={activeProject.id}
          onSave={(dataUrl, result, updatedVisit) => {
            handleSaveSignature(result as SignatureResult);
            if (updatedVisit && onUpdateFieldVisit) {
              onUpdateFieldVisit(updatedVisit);
            }
            setIsSignaturePadOpen(false);
            setSigningVisitId(null);
          }}
          defaultSignerName={visitForeman}
          title="Firma Digital del Capataz (SignatureCanvas)"
          subtitle={
            signingVisitId
              ? `Autorización formal de bitácora vinculada al registro #${signingVisitId}`
              : 'Autorización táctil para reportes diarios de campo y bitácoras de obra.'
          }
        />
      )}

      {/* Site Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isSiteCameraOpen}
        onClose={() => {
          setIsSiteCameraOpen(false);
          setCameraVisitTargetId(null);
        }}
        onCapture={handleCaptureSitePhoto}
        mode="construction_site"
        title="Capturar Fotografía de Obra con Cámara"
        subtitle="Enfoque el avance estructural o frente de trabajo con la cámara del dispositivo."
        defaultLocation={{ lat: activeProject.lat, lng: activeProject.lng }}
        projectCode={activeProject.code}
        foremanName={visitForeman}
      />

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
          <div className="max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <div className="p-3 flex items-center justify-between text-white border-b border-slate-800">
              <span className="text-xs font-bold">{lightboxPhoto.caption}</span>
              <button onClick={() => setLightboxPhoto(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-black flex items-center justify-center max-h-[60vh]">
              <img src={lightboxPhoto.url} alt={lightboxPhoto.caption} className="max-h-[60vh] object-contain" />
            </div>
            <div className="p-3 text-xs text-slate-400 flex items-center justify-between">
              {lightboxPhoto.coords && (
                <span>GPS: {lightboxPhoto.coords.lat.toFixed(5)}°N, {lightboxPhoto.coords.lng.toFixed(5)}°W</span>
              )}
              <span>{lightboxPhoto.date} • {lightboxPhoto.takenBy}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
