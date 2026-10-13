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
} from 'lucide-react';
import { SignatureResult } from '@/components/SignaturePad';

export interface CanvasSignatureProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSaveSignature: (result: SignatureResult) => void;
  defaultSignerName?: string;
  defaultSignerDpi?: string;
  defaultSignerRole?: string;
  inline?: boolean;
  title?: string;
  subtitle?: string;
}

export const CanvasSignature: React.FC<CanvasSignatureProps> = ({
  isOpen = true,
  onClose,
  onSaveSignature,
  defaultSignerName = 'Don Mario Cifuentes',
  defaultSignerDpi = '2489 10293 0101',
  defaultSignerRole = 'Capataz General de Obra',
  inline = false,
  title = 'Firma Digital del Capataz en Lienzo Táctil',
  subtitle = 'Autorización legal sobre pantalla para reportes de campo y bitácoras diarias de obra.',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([]);
  const [penColor, setPenColor] = useState<string>('#0f172a');
  const [penWidth, setPenWidth] = useState<number>(2.5);

  // Metadata
  const [signerName, setSignerName] = useState(defaultSignerName);
  const [signerDpi, setSignerDpi] = useState(defaultSignerDpi);
  const [signerRole, setSignerRole] = useState(defaultSignerRole);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [gpsStatus, setGpsStatus] = useState<'loading' | 'success' | 'fallback'>('loading');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize canvas with high-DPI scaling
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Get display dimensions
    const rect = canvas.getBoundingClientRect();
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    // Set internal resolution
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Scale context to match DPR
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;

    // Draw clean background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw baseline guide for signing
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(24, rect.height - 35);
    ctx.lineTo(rect.width - 24, rect.height - 35);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Text guide "X  Firma del Capataz"
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 12px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText('✕ Firma autorizada del Capataz sobre lienzo táctil', 24, rect.height - 16);

    // Reset stroke history
    setStrokeHistory([]);
    setHasDrawn(false);
  }, [penColor, penWidth]);

  // Handle resizing / opening
  useEffect(() => {
    if (!isOpen && !inline) return;

    const timer = setTimeout(() => {
      initCanvas();
    }, 120);

    // Acquire GPS location
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setGpsStatus('success');
        },
        () => {
          // Fallback location for Guatemala City
          setGpsCoords({ lat: 14.6133, lng: -90.4875 });
          setGpsStatus('fallback');
        },
        { timeout: 6000, enableHighAccuracy: true }
      );
    } else {
      setGpsCoords({ lat: 14.6133, lng: -90.4875 });
      setGpsStatus('fallback');
    }

    return () => clearTimeout(timer);
  }, [isOpen, inline, initCanvas]);

  // Coordinate conversion helper
  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  // Drawing handlers
  const startDrawing = (e: any) => {
    if (e.cancelable && e.type.startsWith('touch')) {
      e.preventDefault();
    }
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Save state for undo
    const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setStrokeHistory((prev) => [...prev.slice(-10), currentFrame]);

    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setHasDrawn(true);
    setValidationError(null);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    if (e.cancelable && e.type.startsWith('touch')) {
      e.preventDefault();
    }
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = (e: any) => {
    if (!isDrawing) return;
    if (e.cancelable && e.type.startsWith('touch')) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.closePath();
    setIsDrawing(false);
  };

  // Undo last stroke
  const handleUndo = () => {
    if (strokeHistory.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const previousState = strokeHistory[strokeHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setStrokeHistory((prev) => prev.slice(0, prev.length - 1));
    if (strokeHistory.length <= 1) {
      setHasDrawn(false);
    }
  };

  // Save Signature
  const handleSave = () => {
    if (!hasDrawn) {
      setValidationError('Por favor dibuje su firma sobre el lienzo antes de autorizar.');
      return;
    }
    if (!signerName.trim()) {
      setValidationError('Indique el nombre completo del capataz que autoriza.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const timestamp = new Date().toLocaleString('es-GT', {
      timeZone: 'America/Guatemala',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const result: SignatureResult = {
      dataUrl,
      signerName: signerName.trim(),
      signerDpi: signerDpi.trim() || 'No especificado',
      signerRole: signerRole.trim() || 'Capataz de Obra',
      timestamp,
      location: gpsCoords,
    };

    onSaveSignature(result);
    if (onClose) onClose();
  };

  const content = (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-w-lg w-full">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white">{title}</h3>
            <p className="text-[11px] text-slate-400">{subtitle}</p>
          </div>
        </div>
        {!inline && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition hover:bg-slate-800"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Signer Identification inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nombre del Capataz / Firmante
            </label>
            <div className="relative">
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Don Mario Cifuentes"
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                required
              />
              <UserCheck className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              DPI / Identificación (Guatemala)
            </label>
            <input
              type="text"
              value={signerDpi}
              onChange={(e) => setSignerDpi(e.target.value)}
              placeholder="2489 10293 0101"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
          <span className="font-semibold text-slate-700">{signerRole}</span>
          <div className="flex items-center gap-1 text-[11px] text-sky-700 font-mono">
            <MapPin className="w-3 h-3 text-sky-600" />
            {gpsCoords ? `${gpsCoords.lat.toFixed(4)}°N, ${gpsCoords.lng.toFixed(4)}°W` : 'Obteniendo GPS...'}
          </div>
        </div>

        {/* Canvas Signature Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800">Lienzo Táctil (HTML5 Canvas)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                Touch Ready
              </span>
            </div>
            {/* Color & Undo Controls */}
            <div className="flex items-center gap-1">
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 mr-1">
                <button
                  type="button"
                  onClick={() => setPenColor('#0f172a')}
                  className={`w-5 h-5 rounded-md transition ${penColor === '#0f172a' ? 'ring-2 ring-blue-500 scale-110' : ''}`}
                  style={{ backgroundColor: '#0f172a' }}
                  title="Tinta Grafito Ejecutivo"
                />
                <button
                  type="button"
                  onClick={() => setPenColor('#1e3a8a')}
                  className={`w-5 h-5 rounded-md transition ml-1 ${penColor === '#1e3a8a' ? 'ring-2 ring-blue-500 scale-110' : ''}`}
                  style={{ backgroundColor: '#1e3a8a' }}
                  title="Tinta Azul Contrato"
                />
              </div>
              <button
                type="button"
                onClick={handleUndo}
                disabled={strokeHistory.length === 0}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition disabled:opacity-30 cursor-pointer"
                title="Deshacer trazo"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={initCanvas}
                className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                title="Limpiar lienzo completo"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={containerRef}
            className="w-full h-48 bg-white border-2 border-slate-300 rounded-xl overflow-hidden shadow-inner touch-none relative select-none cursor-crosshair"
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full block touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              onTouchCancel={stopDrawing}
            />
          </div>
          <p className="text-[10px] text-slate-400 text-center">
            Firme con el dedo o lápiz óptico dentro del recuadro blanco. La firma se estampa con sello de tiempo y GPS.
          </p>
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          {!inline && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              Cancelar
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Guardar y Autorizar Firma
          </button>
        </div>
      </div>
    </div>
  );

  if (inline) {
    return content;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      {content}
    </div>
  );
};
