'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  MapPin,
  Calendar,
  User,
  X,
  Plus,
  Trash2,
  Download,
  Eye,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  HardHat,
} from 'lucide-react';
import { FieldPhoto, FieldVisit, Project } from '@/lib/types';

interface FieldPhotoGalleryProps {
  project: Project;
  fieldVisits: FieldVisit[];
  onAddPhoto: (visitId: string, photo: FieldPhoto) => void;
  onDeletePhoto?: (visitId: string, photoId: string) => void;
}

export const FieldPhotoGallery: React.FC<FieldPhotoGalleryProps> = ({
  project,
  fieldVisits,
  onAddPhoto,
  onDeletePhoto,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<FieldPhoto | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string>(
    fieldVisits.find((v) => v.projectId === project.id)?.id || fieldVisits[0]?.id || ''
  );

  // Camera capture state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [takenByName, setTakenByName] = useState('Don Mario Cifuentes');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'acquiring' | 'ready' | 'fallback'>('acquiring');

  // Filter state
  const [selectedFilterVisit, setSelectedFilterVisit] = useState<string>('all');

  // Gather all photos for this project
  const projectVisits = fieldVisits.filter((v) => v.projectId === project.id);
  const allPhotos: { visit: FieldVisit; photo: FieldPhoto }[] = [];

  projectVisits.forEach((visit) => {
    if (visit.photos && visit.photos.length > 0) {
      visit.photos.forEach((photo) => {
        allPhotos.push({ visit, photo });
      });
    }
  });

  const filteredPhotos =
    selectedFilterVisit === 'all'
      ? allPhotos
      : allPhotos.filter((item) => item.visit.id === selectedFilterVisit);

  // Geolocation lookup
  const fetchLocation = () => {
    setGpsStatus('acquiring');
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setGpsStatus('ready');
        },
        () => {
          // Use project coordinates as fallback
          setCoords({ lat: project.lat, lng: project.lng });
          setGpsStatus('fallback');
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
    } else {
      setCoords({ lat: project.lat, lng: project.lng });
      setGpsStatus('fallback');
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    setCapturedDataUrl(null);
    fetchLocation();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError('No se pudo acceder a la cámara web. Puede subir una foto desde sus archivos.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const handleOpenModal = () => {
    setIsCameraModalOpen(true);
    setCaption('');
    setCapturedDataUrl(null);
    startCamera();
  };

  const handleCloseModal = () => {
    stopCamera();
    setIsCameraModalOpen(false);
    setCapturedDataUrl(null);
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Optional: draw watermark with GPS & Date
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(
      `ConstructERP • ${project.code} • ${new Date().toLocaleDateString('es-GT')} ${new Date().toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}`,
      15,
      canvas.height - 22
    );
    if (coords) {
      ctx.font = '12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`GPS: ${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°W`, canvas.width - 15, canvas.height - 22);
    }
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedDataUrl(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    fetchLocation();
    const reader = new FileReader();
    reader.onload = () => {
      setCapturedDataUrl(reader.result as string);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = () => {
    if (!capturedDataUrl) return;
    const targetVisitId = selectedVisitId || projectVisits[0]?.id;
    if (!targetVisitId) return;

    const newPhoto: FieldPhoto = {
      id: `pht-${Date.now()}`,
      url: capturedDataUrl,
      caption: caption.trim() || 'Fotografía de avance de obra en campo',
      date: new Date().toISOString().split('T')[0],
      timestamp: `${new Date().toLocaleDateString('es-GT')} ${new Date().toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}`,
      coords: coords || { lat: project.lat, lng: project.lng },
      takenBy: takenByName.trim() || 'Capataz de Obra',
    };

    onAddPhoto(targetVisitId, newPhoto);
    handleCloseModal();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Galería Fotográfica de Campo con GPS</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registro visual geolocalizado de avances, colados de losas, inspecciones y maquinaria en {project.name}.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {projectVisits.length > 0 && (
            <select
              value={selectedFilterVisit}
              onChange={(e) => setSelectedFilterVisit(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 font-medium"
            >
              <option value="all">Todas las Bitácoras ({allPhotos.length} fotos)</option>
              {projectVisits.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.date} - {v.foremanName}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <Camera className="w-4 h-4" /> Tomar / Subir Foto
          </button>
        </div>
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Camera className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-700 text-sm">No hay fotografías registradas aún</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Utilice la cámara de su dispositivo móvil o computadora para capturar evidencias con coordenadas GPS de obra.
          </p>
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer mt-2"
          >
            <Plus className="w-4 h-4" /> Capturar Primera Fotografía
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPhotos.map(({ visit, photo }) => (
            <div
              key={photo.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col group"
            >
              {/* Image Container with GPS Badge */}
              <div className="relative aspect-4/3 bg-slate-900 overflow-hidden cursor-pointer" onClick={() => setSelectedPhoto(photo)}>
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-90" />

                {/* Coordinate Badge */}
                {photo.coords && (
                  <div className="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-1 rounded-md flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-400" />
                    <span>
                      {photo.coords.lat.toFixed(4)}°, {photo.coords.lng.toFixed(4)}°
                    </span>
                  </div>
                )}

                {/* Date stamp */}
                <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-xs text-slate-200 text-[10px] px-2 py-1 rounded-md flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-400" />
                  <span>{photo.date}</span>
                </div>

                {/* Caption overlay */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                  <p className="text-xs font-semibold line-clamp-2">{photo.caption}</p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-3.5 bg-white flex items-center justify-between text-xs text-slate-600 border-t border-slate-100">
                <div className="flex items-center gap-1.5 truncate">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate text-slate-700 font-medium">{photo.takenBy || visit.foremanName}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setSelectedPhoto(photo)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition"
                    title="Ver Fotografía Completa"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {onDeletePhoto && (
                    <button
                      onClick={() => onDeletePhoto(visit.id, photo.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                      title="Eliminar Foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CAMERA & UPLOAD MODAL */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-6">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Cámara de Campo con Geolocalización</h3>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Video Preview or Captured Image */}
              <div className="relative aspect-4/3 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
                {capturedDataUrl ? (
                  <img src={capturedDataUrl} alt="Captura" className="w-full h-full object-contain" />
                ) : cameraError ? (
                  <div className="p-6 text-center space-y-3 text-slate-300">
                    <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                    <p className="text-xs">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                    >
                      <Upload className="w-4 h-4" /> Seleccionar Archivo / Foto
                    </button>
                  </div>
                ) : (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    {/* Viewfinder crosshairs */}
                    <div className="absolute inset-0 pointer-events-none border-2 border-white/20 m-6 rounded-lg flex items-center justify-center">
                      <div className="w-8 h-8 border-t-2 border-l-2 border-amber-400 absolute top-0 left-0" />
                      <div className="w-8 h-8 border-t-2 border-r-2 border-amber-400 absolute top-0 right-0" />
                      <div className="w-8 h-8 border-b-2 border-l-2 border-amber-400 absolute bottom-0 left-0" />
                      <div className="w-8 h-8 border-b-2 border-r-2 border-amber-400 absolute bottom-0 right-0" />
                    </div>
                  </>
                )}

                {/* GPS Stamp in preview */}
                {coords && (
                  <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-1 rounded">
                    📍 GPS: {coords.lat.toFixed(5)}°N, {coords.lng.toFixed(5)}°W
                  </div>
                )}
              </div>

              {/* Camera Action Buttons */}
              <div className="flex items-center justify-between gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                {!capturedDataUrl ? (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" /> Subir desde Galería
                    </button>

                    <button
                      type="button"
                      onClick={handleCaptureSnapshot}
                      disabled={!!cameraError}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md cursor-pointer disabled:opacity-40"
                    >
                      <Camera className="w-4 h-4" /> Disparar Foto
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedDataUrl(null);
                      startCamera();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Tomar Otra Foto
                  </button>
                )}
              </div>

              {/* Metadata Form Inputs */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vincular a Bitácora / Reporte de Obra
                  </label>
                  <select
                    value={selectedVisitId}
                    onChange={(e) => setSelectedVisitId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    {projectVisits.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.date} — {v.foremanName} ({v.weather})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción / Pie de Foto</label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Ej. Armado de acero en columna C-14, nivel 4"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tomada por (Capataz / Residente)</label>
                  <input
                    type="text"
                    value={takenByName}
                    onChange={(e) => setTakenByName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSavePhoto}
                  disabled={!capturedDataUrl}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> Guardar en Galería
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL PHOTO LIGHTBOX MODAL */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
          <div className="max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-slate-800 text-white">
              <div>
                <h4 className="font-bold text-sm text-slate-100">{selectedPhoto.caption}</h4>
                <p className="text-xs text-slate-400">
                  {selectedPhoto.date} • {selectedPhoto.takenBy}
                </p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-black flex items-center justify-center max-h-[65vh]">
              <img src={selectedPhoto.url} alt={selectedPhoto.caption} className="max-h-[65vh] w-auto object-contain" />
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              {selectedPhoto.coords && (
                <div className="flex items-center gap-2 text-slate-300 font-mono">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>
                    Coordenadas: {selectedPhoto.coords.lat.toFixed(5)}°N, {selectedPhoto.coords.lng.toFixed(5)}°W
                  </span>
                </div>
              )}

              <a
                href={selectedPhoto.url}
                download={`foto_obra_${selectedPhoto.id}.jpg`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" /> Descargar Fotografía
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
