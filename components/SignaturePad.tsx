'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PenTool, RotateCcw, CheckCircle2, X, MapPin, Undo2, AlertCircle } from 'lucide-react';

export interface SignatureResult {
  dataUrl: string;
  signerName: string;
  signerDpi: string;
  signerRole: string;
  timestamp: string;
  location?: { lat: number; lng: number };
}

export interface SignaturePadProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSaveSignature?: (result: SignatureResult) => void;
  onSave?: (result: SignatureResult | string) => void;
  onConfirm?: (result: SignatureResult) => void;
  defaultSignerName?: string;
  defaultSignerDpi?: string;
  defaultSignerRole?: string;
  inline?: boolean;
  title?: string;
  subtitle?: string;
  visitId?: string;
  className?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  isOpen = true,
  onClose,
  onSaveSignature,
  onSave,
  onConfirm,
  defaultSignerName = 'Don Mario Cifuentes',
  defaultSignerDpi = '2489 10293 0101',
  defaultSignerRole = 'Capataz General de Obra',
  inline = false,
  title = 'Firma Digital del Capataz (HTML5 Canvas)',
  subtitle = 'Autorización formal de bitácora y reporte de campo',
  visitId,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState(defaultSignerName);
  const [signerDpi, setSignerDpi] = useState(defaultSignerDpi);
  const [signerRole, setSignerRole] = useState(defaultSignerRole);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [gpsStatus, setGpsStatus] = useState<'loading' | 'success' | 'fallback'>('loading');
  const [penColor, setPenColor] = useState<string>('#0f172a');
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Support high-DPI displays
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = (rect.width || 440) * dpr;
    canvas.height = (rect.height || 180) * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Clear background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width || 440, rect.height || 180);

    // Baseline guide
    drawBaseline(ctx, rect.width || 440, rect.height || 180);

    setHasDrawn(false);
    setStrokeHistory([]);
  }, [penColor]);

  const drawBaseline = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(30, height - 35);
    ctx.lineTo(width - 30, height - 35);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('X  Firma del Capataz / Supervisor Responsable', 32, height - 20);
    ctx.restore();
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(initCanvas, 50);

      // Acquire browser geolocation
      if (typeof window !== 'undefined' && navigator.geolocation) {
        setGpsStatus('loading');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setGpsCoords({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
            setGpsStatus('success');
          },
          () => {
            // Default Guatemala construction site coordinates if denied or unavailable
            setGpsCoords({ lat: 14.6133, lng: -90.4875 });
            setGpsStatus('fallback');
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else {
        setGpsCoords({ lat: 14.6133, lng: -90.4875 });
        setGpsStatus('fallback');
      }
    }
  }, [isOpen, initCanvas]);

  if (!isOpen && !inline) return null;

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setStrokeHistory((prev) => [...prev.slice(-10), imageData]);
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setValidationError(null);
    saveState();
    setIsDrawing(true);
    setHasDrawn(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    initCanvas();
    setValidationError(null);
  };

  const handleUndo = () => {
    if (strokeHistory.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const newHistory = [...strokeHistory];
    const previousState = newHistory.pop();
    setStrokeHistory(newHistory);

    if (previousState) {
      ctx.putImageData(previousState, 0, 0);
      if (newHistory.length === 0) {
        setHasDrawn(false);
      }
    }
  };

  const handleConfirm = () => {
    if (!hasDrawn) {
      setValidationError('Por favor, estampe su firma sobre el recuadro antes de autorizar.');
      return;
    }
    if (!signerName.trim()) {
      setValidationError('Ingrese el nombre completo del capataz.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const timestamp = new Date().toLocaleString('es-GT', { timeZone: 'America/Guatemala' });

    const result: SignatureResult = {
      dataUrl,
      signerName: signerName.trim(),
      signerDpi: signerDpi.trim(),
      signerRole: signerRole.trim(),
      timestamp,
      location: gpsCoords,
    };

    if (onSaveSignature) onSaveSignature(result);
    if (onSave) onSave(result);
    if (onConfirm) onConfirm(result);

    if (onClose) onClose();
  };

  const content = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nombre del Capataz / Residente <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="Ej. Don Mario Cifuentes"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            DPI (CUI Guatemala) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={signerDpi}
            onChange={(e) => setSignerDpi(e.target.value)}
            placeholder="XXXX XXXXX XXXX"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Puesto o Cargo en Obra</label>
        <input
          type="text"
          value={signerRole}
          onChange={(e) => setSignerRole(e.target.value)}
          placeholder="Ej. Capataz General de Obra"
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Canvas Area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <PenTool className="w-3.5 h-3.5 text-blue-600" />
            Lienzo de Firma Digital (HTML5 Canvas):
          </label>

          <div className="flex items-center gap-3">
            {/* Pen color picker */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPenColor('#0f172a')}
                className={`w-4 h-4 rounded-full bg-slate-900 border ${penColor === '#0f172a' ? 'ring-2 ring-blue-500' : ''}`}
                title="Tinta Negra"
              />
              <button
                type="button"
                onClick={() => setPenColor('#1e40af')}
                className={`w-4 h-4 rounded-full bg-blue-800 border ${penColor === '#1e40af' ? 'ring-2 ring-blue-500' : ''}`}
                title="Tinta Azul Obra"
              />
            </div>

            <button
              type="button"
              onClick={handleUndo}
              disabled={strokeHistory.length === 0}
              className="text-xs text-slate-600 hover:text-slate-900 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" /> Deshacer
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Limpiar
            </button>
          </div>
        </div>

        <div className="border-2 border-slate-300 rounded-xl bg-white overflow-hidden touch-none shadow-inner flex justify-center">
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '180px', touchAction: 'none' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="cursor-crosshair bg-white"
          />
        </div>
      </div>

      {/* Validation alert */}
      {validationError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{validationError}</span>
        </div>
      )}

      {/* GPS, Timestamp & Compliance stamp */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {gpsCoords && (
            <p className="flex items-center gap-1 font-mono text-[11px] text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>GPS Obra: {gpsCoords.lat.toFixed(5)}° N, {gpsCoords.lng.toFixed(5)}° W</span>
              {gpsStatus === 'success' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-sans font-bold">
                  En Vivo
                </span>
              )}
            </p>
          )}
          <span className="text-[11px] text-slate-500">Hora: {new Date().toLocaleTimeString('es-GT')}</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-tight">
          Sello digital vinculante: La firma en lienzo HTML5 valida las partidas de obra y garantiza trazabilidad jurídica en Guatemala.
        </p>
      </div>

      {/* Actions */}
      <div className="pt-2 flex items-center justify-end gap-2.5">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer transition"
          >
            Cancelar
          </button>
        )}
        <button
          type="button"
          onClick={handleConfirm}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm cursor-pointer transition"
        >
          <CheckCircle2 className="w-4 h-4" /> Autorizar con Firma Digital
        </button>
      </div>
    </div>
  );

  if (inline) {
    return <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base">{title}</h3>
                {visitId && (
                  <span className="text-[10px] font-mono font-bold bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded">
                    ID: {visitId}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">{subtitle}</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-5">{content}</div>
      </div>
    </div>
  );
};

export default SignaturePad;
