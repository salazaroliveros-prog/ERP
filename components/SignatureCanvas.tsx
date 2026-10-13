'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  PenTool,
  RotateCcw,
  CheckCircle2,
  X,
  MapPin,
  Undo2,
  AlertCircle,
  ShieldCheck,
  Calendar,
  UserCheck,
  Sparkles,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { FieldVisit } from '@/lib/types';
import { saveFieldVisitToFirestore, auth } from '@/lib/firebaseService';

export interface SignatureCanvasResult {
  dataUrl: string;
  signerName: string;
  signerDpi: string;
  signerRole: string;
  timestamp: string;
  location?: { lat: number; lng: number };
}

export interface SignatureCanvasProps {
  /** Optional existing field visit to be signed and updated */
  visit?: FieldVisit;
  /** Optional ID of field visit if visit object isn't provided directly */
  visitId?: string;
  /** Project ID context */
  projectId?: string;
  /** Modal open/closed flag if rendered as modal */
  isOpen?: boolean;
  /** Callback fired when user closes or cancels */
  onClose?: () => void;
  onCancel?: () => void;
  /** Callback fired when signature is completed and saved */
  onSave?: (dataUrl: string, metadata: SignatureCanvasResult, updatedVisit?: FieldVisit) => void | Promise<void>;
  /** Default metadata values */
  defaultSignerName?: string;
  defaultSignerDpi?: string;
  defaultSignerRole?: string;
  /** Display as inline component instead of full modal dialog */
  inline?: boolean;
  /** Whether to attempt direct Firestore save (default: true) */
  autoSaveToFirestore?: boolean;
  /** Custom title & subtitle */
  title?: string;
  subtitle?: string;
  className?: string;
}

interface Point {
  x: number;
  y: number;
  time: number;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  visit,
  visitId,
  projectId,
  isOpen = true,
  onClose,
  onCancel,
  onSave,
  defaultSignerName,
  defaultSignerDpi,
  defaultSignerRole,
  inline = false,
  autoSaveToFirestore = true,
  title = 'Firma Digital de Visita de Campo',
  subtitle = 'Autorización formal del capataz para bitácoras y avances diarios de obra',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([]);
  const [penColor, setPenColor] = useState<string>('#1e3a8a'); // Legal Notary Blue by default
  const [penWidth, setPenWidth] = useState<number>(2.5);

  // Signer metadata state
  const [signerName, setSignerName] = useState<string>(
    visit?.foremanName || defaultSignerName || 'Don Mario Cifuentes'
  );
  const [signerDpi, setSignerDpi] = useState<string>(
    visit?.signerDpi || defaultSignerDpi || '2489 10293 0101'
  );
  const [signerRole, setSignerRole] = useState<string>(
    visit?.signerRole || defaultSignerRole || 'Capataz General de Obra'
  );

  // GPS and status state
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | undefined>(
    visit?.gpsCoords || undefined
  );
  const [gpsStatus, setGpsStatus] = useState<'loading' | 'success' | 'fallback'>('loading');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleClose = () => {
    if (onClose) onClose();
    else if (onCancel) onCancel();
  };

  // Draw signature baseline guideline
  const drawBaseline = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    const lineY = height * 0.78;
    ctx.beginPath();
    ctx.moveTo(30, lineY);
    ctx.lineTo(width - 30, lineY);
    ctx.stroke();

    // Baseline marker label
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('✕ FIRMA DEL CAPATAZ O INGENIERO RESIDENTE (SOBRE LA LÍNEA)', 32, lineY - 8);
    ctx.restore();
  };

  // Canvas initialization with high-DPI scaling
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const displayWidth = rect.width || 480;
    const displayHeight = rect.height || 200;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.scale(dpr, dpr);

    // Initial crisp white fill
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    drawBaseline(ctx, displayWidth, displayHeight);

    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    setHasDrawn(false);
    setStrokeHistory([]);
    setValidationError(null);
  }, [penColor, penWidth]);

  // Handle resizing with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      initCanvas();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [initCanvas]);

  // Capture Geolocation for digital field certification
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
          });
          setGpsStatus('success');
        },
        () => {
          // Fallback to Guatemala City coordinates
          setGpsCoords({ lat: 14.6349, lng: -90.5069 });
          setGpsStatus('fallback');
        },
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 60000 }
      );
    } else {
      setGpsCoords({ lat: 14.6349, lng: -90.5069 });
      setGpsStatus('fallback');
    }
  }, []);

  // Coordinate helper
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Pointer drawing handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Save state for undo
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setStrokeHistory((prev) => [...prev.slice(-15), currentState]);

    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    setValidationError(null);

    const { x, y } = getCanvasCoords(e);
    setPoints([{ x, y, time: Date.now() }]);

    ctx.beginPath();
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    const newPoints = [...points, { x, y, time: Date.now() }];
    setPoints(newPoints);

    if (newPoints.length >= 3) {
      const p1 = newPoints[newPoints.length - 2];
      const p2 = newPoints[newPoints.length - 1];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      ctx.beginPath();
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      ctx.stroke();
    }

    if (!hasDrawn) setHasDrawn(true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // benign
    }
    setIsDrawing(false);
    setPoints([]);
  };

  // Undo last stroke
  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || strokeHistory.length === 0) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const previousState = strokeHistory[strokeHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setStrokeHistory((prev) => prev.slice(0, -1));

    if (strokeHistory.length <= 1) {
      setHasDrawn(false);
    }
  };

  // Clear canvas
  const handleClear = () => {
    initCanvas();
  };

  // Save Signature & persist to Firestore
  const handleSave = async () => {
    if (!hasDrawn) {
      setValidationError('Debe plasmar su firma en el lienzo antes de guardar el reporte.');
      return;
    }
    if (!signerName.trim()) {
      setValidationError('Por favor ingrese el nombre del capataz o responsable.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSaving(true);
    setValidationError(null);

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const timestamp = new Date().toLocaleString('es-GT', {
        timeZone: 'America/Guatemala',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const metadata: SignatureCanvasResult = {
        dataUrl,
        signerName: signerName.trim(),
        signerDpi: signerDpi.trim(),
        signerRole: signerRole.trim(),
        timestamp,
        location: gpsCoords,
      };

      // If we have a visit or visitId, prepare the updated visit object
      const targetVisitId = visit?.id || visitId;
      let updatedVisit: FieldVisit | undefined;

      if (visit) {
        updatedVisit = {
          ...visit,
          signatureDataUrl: dataUrl,
          foremanName: metadata.signerName,
          signerDpi: metadata.signerDpi,
          signerRole: metadata.signerRole,
          gpsCoords: metadata.location || visit.gpsCoords,
          status: 'Autorizado',
        };
      } else if (targetVisitId) {
        updatedVisit = {
          id: targetVisitId,
          projectId: projectId || 'p1',
          projectName: 'Visita de Campo',
          date: new Date().toISOString().split('T')[0],
          foremanName: metadata.signerName,
          signerDpi: metadata.signerDpi,
          signerRole: metadata.signerRole,
          notes: 'Autorizado en obra con firma digital',
          weather: 'Soleado',
          workersCount: 15,
          signatureDataUrl: dataUrl,
          gpsCoords: metadata.location,
          status: 'Autorizado',
        };
      }

      // Persist directly to Firestore if autoSaveToFirestore is enabled and we have an authorized user or visit
      if (autoSaveToFirestore && updatedVisit) {
        const userId = auth.currentUser?.uid || 'anonymous-foreman';
        try {
          await saveFieldVisitToFirestore(updatedVisit, userId);
        } catch (firestoreErr) {
          console.warn('Could not persist to Firestore directly, proceeding with local callback:', firestoreErr);
        }
      }

      // Invoke parent onSave callback
      if (onSave) {
        await onSave(dataUrl, metadata, updatedVisit);
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSaving(false);
        setIsSuccess(false);
        handleClose();
      }, 900);
    } catch (err) {
      console.error('Error saving signature:', err);
      setValidationError('Ocurrió un error al procesar y guardar la firma digital.');
      setIsSaving(false);
    }
  };

  if (!inline && !isOpen) return null;

  const content = (
    <div className={`bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="bg-slate-800/80 px-5 py-4 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>

        {!inline && (
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-5 space-y-4 flex-1">
        {/* Signer Info Form */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">
              Nombre del Capataz / Firmante
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Ej: Don Mario Cifuentes"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-sky-400 font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">
              DPI (13 Dígitos - Guatemala)
            </label>
            <input
              type="text"
              value={signerDpi}
              onChange={(e) => setSignerDpi(e.target.value)}
              placeholder="Ej: 2489 10293 0101"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-sky-400 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">
              Cargo / Rol en Obra
            </label>
            <select
              value={signerRole}
              onChange={(e) => setSignerRole(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-sky-400"
            >
              <option value="Capataz General de Obra">Capataz General de Obra</option>
              <option value="Maestro de Obra">Maestro de Obra</option>
              <option value="Ingeniero Residente">Ingeniero Residente</option>
              <option value="Supervisor de Calidad">Supervisor de Calidad</option>
              <option value="Encargado de Bodega">Encargado de Bodega</option>
            </select>
          </div>
        </div>

        {/* Canvas Tools Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {/* Color & Size selectors */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">Tinta:</span>
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setPenColor('#1e3a8a')}
                className={`w-6 h-6 rounded-lg bg-blue-900 border-2 transition ${
                  penColor === '#1e3a8a' ? 'border-sky-400 scale-110 shadow-sm' : 'border-transparent opacity-60'
                }`}
                title="Azul Notarial / Jurídico"
              />
              <button
                type="button"
                onClick={() => setPenColor('#0f172a')}
                className={`w-6 h-6 rounded-lg bg-slate-950 border-2 transition ${
                  penColor === '#0f172a' ? 'border-sky-400 scale-110 shadow-sm' : 'border-slate-700 opacity-60'
                }`}
                title="Negro Carbón Legal"
              />
            </div>

            <span className="text-xs text-slate-400 font-medium ml-2">Grosor:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[1.8, 2.5, 4.0].map((w, idx) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setPenWidth(w)}
                  className={`px-2 py-1 text-[11px] rounded-lg font-mono transition ${
                    penWidth === w ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-400/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {idx === 0 ? 'Fino' : idx === 1 ? 'Medio' : 'Grueso'}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons: Undo & Clear */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={strokeHistory.length === 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <Undo2 className="w-3.5 h-3.5" /> Deshacer
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-medium border border-slate-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Limpiar
            </button>
          </div>
        </div>

        {/* The Interactive Canvas Area */}
        <div
          ref={containerRef}
          className="relative w-full h-48 sm:h-56 bg-white rounded-xl border-2 border-dashed border-slate-600 overflow-hidden shadow-inner cursor-crosshair touch-none select-none"
        >
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-full block"
            style={{ touchAction: 'none' }}
          />

          {!hasDrawn && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 gap-1 opacity-60">
              <PenTool className="w-8 h-8 text-slate-400" />
              <p className="text-xs font-medium">Firme aquí con el dedo o puntero táctil</p>
            </div>
          )}
        </div>

        {/* Validation error display */}
        {validationError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Forensic & Legal Footnote */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Certificación digital de campo • Art. 89 Código de Trabajo de Guatemala
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[10px] text-slate-400">
            {gpsCoords && (
              <span className="flex items-center gap-1 text-sky-400">
                <MapPin className="w-3 h-3" /> {gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)}
              </span>
            )}
            <span className="flex items-center gap-1 text-slate-400">
              <Calendar className="w-3 h-3" /> {new Date().toLocaleDateString('es-GT')}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="bg-slate-800/80 px-5 py-3 border-t border-slate-700/60 flex items-center justify-end gap-3">
        {!inline && (
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Cancelar
          </button>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !hasDrawn}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shadow-lg ${
            isSuccess
              ? 'bg-emerald-500 text-white'
              : 'bg-sky-400 hover:bg-sky-300 text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(56,189,248,0.3)]'
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Guardando en Firestore...</span>
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>¡Firmado y Sincronizado!</span>
            </>
          ) : (
            <>
              <FileCheck className="w-4 h-4" />
              <span>Firmar y Guardar en Firestore</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[95vh] overflow-y-auto">{content}</div>
    </div>
  );
};
export default SignatureCanvas;
