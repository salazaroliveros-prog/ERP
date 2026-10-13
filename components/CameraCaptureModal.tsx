'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  CameraOff,
  RotateCcw,
  Check,
  X,
  Upload,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  AlertCircle,
  HardHat,
  Receipt,
  Eye,
} from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string, metadata: {
    coords?: { lat: number; lng: number };
    timestamp: string;
    caption?: string;
  }) => void;
  mode?: 'construction_site' | 'receipt';
  title?: string;
  subtitle?: string;
  defaultLocation?: { lat: number; lng: number };
  projectCode?: string;
  foremanName?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  mode = 'construction_site',
  title,
  subtitle,
  defaultLocation,
  projectCode = 'OBRA-2025',
  foremanName = 'Supervisor de Obra',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isFlashing, setIsFlashing] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [addWatermark, setAddWatermark] = useState(true);

  // GPS state
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(defaultLocation || null);
  const [gpsStatus, setGpsStatus] = useState<'searching' | 'ready' | 'fallback'>('searching');

  // Active tab: 'camera' vs 'upload'
  const [inputTab, setInputTab] = useState<'camera' | 'upload'>('camera');

  // Audio shutter effect using Web Audio API
  const playShutterSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Audio playback fails gracefully if blocked by browser policy
    }
  };

  // Acquire GPS Location
  const requestLocation = () => {
    setGpsStatus('searching');
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
          if (defaultLocation) {
            setCoords(defaultLocation);
          } else {
            setCoords({ lat: 14.6349, lng: -90.5069 }); // Guatemala City
          }
          setGpsStatus('fallback');
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setCoords(defaultLocation || { lat: 14.6349, lng: -90.5069 });
      setGpsStatus('fallback');
    }
  };

  // Start Camera
  const startCameraStream = async (targetFacing: 'environment' | 'user') => {
    stopCameraStream();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La API de cámara no está disponible en este navegador o contexto.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: targetFacing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('getUserMedia error:', err);
      let msg = 'No se pudo activar la cámara del dispositivo.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Permiso denegado para acceder a la cámara. Permita el acceso a la cámara o use la opción de subir archivo.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No se encontró ninguna cámara conectada en este equipo.';
      }
      setCameraError(msg);
      setInputTab('upload');
    }
  };

  // Stop Camera
  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setPreviewDataUrl(null);
      setCaption('');
      requestLocation();
      if (inputTab === 'camera') {
        startCameraStream(facingMode);
      }
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, facingMode]);

  // Toggle Camera Facing Mode
  const handleToggleFacingMode = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    if (inputTab === 'camera') {
      startCameraStream(nextFacing);
    }
  };

  // Capture Snapshot from Video Stream
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // Trigger visual flash and audio shutter
    setIsFlashing(true);
    playShutterSound();
    setTimeout(() => setIsFlashing(false), 200);

    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, mirror for natural selfie preview, otherwise standard
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);
    if (facingMode === 'user') {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // Optional Watermark
    if (addWatermark) {
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      ctx.save();
      const bannerHeight = Math.max(48, Math.round(height * 0.08));
      ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
      ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

      ctx.fillStyle = '#f8fafc';
      const fontSize = Math.max(13, Math.round(height * 0.024));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'left';

      if (mode === 'receipt') {
        ctx.fillText(`COMPROBANTE / FACTURA FEL • ${dateStr} ${timeStr}`, 16, height - bannerHeight / 2 + fontSize / 3);
      } else {
        ctx.fillText(`CONSTRUCTERP • ${projectCode} • ${dateStr} ${timeStr}`, 16, height - bannerHeight / 2 + fontSize / 3);
      }

      if (coords) {
        ctx.textAlign = 'right';
        ctx.font = `${fontSize - 1}px monospace`;
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`GPS: ${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°W`, width - 16, height - bannerHeight / 2 + fontSize / 3);
      }
      ctx.restore();
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setPreviewDataUrl(dataUrl);
    stopCameraStream();
  };

  // Handle File Upload Fallback
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewDataUrl(reader.result as string);
      stopCameraStream();
    };
    reader.readAsDataURL(file);
  };

  // Confirm and save
  const handleConfirm = () => {
    if (!previewDataUrl) return;
    const now = new Date();
    const timestamp = `${now.toLocaleDateString('es-GT')} ${now.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}`;

    onCapture(previewDataUrl, {
      coords: coords || undefined,
      timestamp,
      caption: caption.trim() || (mode === 'receipt' ? 'Comprobante / Factura FEL' : 'Fotografía de avance en obra'),
    });
    handleModalClose();
  };

  const handleRetake = () => {
    setPreviewDataUrl(null);
    if (inputTab === 'camera') {
      startCameraStream(facingMode);
    }
  };

  const handleModalClose = () => {
    stopCameraStream();
    setPreviewDataUrl(null);
    onClose();
  };

  if (!isOpen) return null;

  const modalTitle = title || (mode === 'receipt' ? 'Capturar Comprobante o Factura con Cámara' : 'Capturar Fotografía de Obra con Cámara');
  const modalSubtitle = subtitle || (mode === 'receipt'
    ? 'Tome una foto nítida de la factura física, ticket de caja o recibo de compra con la cámara del dispositivo.'
    : 'Registre evidencia fotográfica del avance físico, fundiciones o acabados directamente desde la obra.');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${mode === 'receipt' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {mode === 'receipt' ? <Receipt className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">{modalTitle}</h3>
              <p className="text-[11px] text-slate-400 hidden sm:block">{modalSubtitle}</p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Cámara vs Archivo */}
        {!previewDataUrl && (
          <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs">
            <button
              onClick={() => {
                setInputTab('camera');
                startCameraStream(facingMode);
              }}
              className={`pb-2 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                inputTab === 'camera'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Cámara en Vivo
            </button>
            <button
              onClick={() => {
                setInputTab('upload');
                stopCameraStream();
              }}
              className={`pb-2 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                inputTab === 'upload'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Subir Imagen / Archivo
            </button>
          </div>
        )}

        {/* Viewport Area */}
        <div className="relative bg-slate-950 flex-1 min-h-[320px] max-h-[500px] flex items-center justify-center overflow-hidden">
          {/* Flash animation */}
          {isFlashing && <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-200" />}

          {previewDataUrl ? (
            /* Snapshot Preview */
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img src={previewDataUrl} alt="Vista previa capturada" className="max-h-[460px] w-auto object-contain" />
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Fotografía capturada con éxito
              </div>
            </div>
          ) : inputTab === 'camera' ? (
            /* Live Camera Stream */
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Viewfinder Overlay Guides */}
              {mode === 'receipt' ? (
                /* Document Viewfinder Overlay for Invoices/Receipts */
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6 sm:p-8">
                  <div className="relative w-full max-w-sm h-full max-h-[360px] border-2 border-dashed border-amber-400/80 rounded-xl bg-amber-400/5 shadow-2xl flex flex-col justify-between p-3">
                    {/* Corner Reticles */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-amber-400" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-amber-400" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-amber-400" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-amber-400" />

                    <div className="self-center bg-slate-950/70 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-400/40">
                      Enfoque la Factura / Recibo dentro del marco
                    </div>
                    <div className="self-center text-center text-[10px] text-slate-300 bg-slate-950/60 px-2 py-0.5 rounded">
                      Asegure buena iluminación sobre los datos del emisor y total
                    </div>
                  </div>
                </div>
              ) : (
                /* Construction Site Viewfinder Guide */
                <div className="absolute inset-0 pointer-events-none">
                  {/* Grid lines for rule of thirds */}
                  <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-25">
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-white" />
                    <div className="border-r border-white" />
                    <div />
                  </div>
                  {/* Center Level Crosshair */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border border-white/50 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                    </div>
                  </div>
                </div>
              )}

              {/* Status and Controls Over Video */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <div className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-2 py-1 rounded-lg border border-slate-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Cámara Activa ({facingMode === 'environment' ? 'Trasera' : 'Frontal'})
                </div>
                {coords && (
                  <div className="bg-slate-900/80 backdrop-blur-xs text-sky-300 text-[10px] px-2 py-1 rounded-lg border border-slate-700 flex items-center gap-1 font-mono">
                    <MapPin className="w-3 h-3 text-sky-400" />
                    {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°W
                  </div>
                )}
              </div>

              {/* Camera Switch Button */}
              <div className="absolute top-3 right-3">
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  className="bg-slate-900/80 hover:bg-slate-800 backdrop-blur-xs text-white p-2 rounded-xl border border-slate-700 transition flex items-center gap-1 text-xs cursor-pointer"
                  title="Cambiar entre cámara trasera y frontal"
                >
                  <RotateCcw className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] hidden sm:inline">Girar Cámara</span>
                </button>
              </div>

              {/* Error warning if any */}
              {cameraError && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center text-white">
                  <CameraOff className="w-10 h-10 text-rose-400 mb-2" />
                  <p className="text-sm font-bold text-rose-300 mb-1">Acceso a cámara no disponible</p>
                  <p className="text-xs text-slate-400 max-w-sm mb-4">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    Subir foto desde este dispositivo
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* File Upload Tab */
            <div className="w-full h-full p-8 flex flex-col items-center justify-center text-center text-slate-300">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-blue-400">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Cargar Fotografía o Recibo</h4>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                Seleccione una imagen PNG, JPG o WEBP tomada previamente o use el explorador de archivos.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <Upload className="w-4 h-4" />
                Examinar Archivos
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="p-4 bg-white border-t border-slate-200 space-y-3">
          {previewDataUrl ? (
            /* Post-capture controls */
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {mode === 'receipt' ? 'Nota o Detalle del Comprobante' : 'Descripción / Pie de Foto de la Obra'}
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={
                    mode === 'receipt'
                      ? 'Ej. Factura FEL de Cemento Progreso #A-49201'
                      : 'Ej. Fundición y armado de columnas eje 4-C'
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-blue-600"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Tomar de Nuevo
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    {mode === 'receipt' ? 'Adjuntar Recibo' : 'Adjuntar a Bitácora'}
                  </button>
                </div>
              </div>
            </div>
          ) : inputTab === 'camera' ? (
            /* Live Camera Snapshot trigger */
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={addWatermark}
                    onChange={(e) => setAddWatermark(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Estampar marca de agua (Fecha, Hora & GPS)</span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>

                {/* Shutter Button */}
                <button
                  type="button"
                  onClick={handleCaptureSnapshot}
                  disabled={!stream}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition cursor-pointer active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capturar Foto</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
