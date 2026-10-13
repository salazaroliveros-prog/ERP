'use client';

import React, { useState } from 'react';
import {
  FileText,
  PenTool,
  CheckCircle2,
  MapPin,
  Camera,
  Eye,
  Printer,
  ShieldCheck,
  Users,
  CloudSun,
  AlertCircle,
  Clock,
  Sparkles,
  Plus,
} from 'lucide-react';
import { FieldVisit as FieldVisitType, FieldPhoto, Project } from '@/lib/types';
import { SignaturePad, SignatureResult } from '@/components/SignaturePad';
import { SignatureCanvas, SignatureCanvasResult } from '@/components/SignatureCanvas';

export interface FieldVisitProps {
  visit?: FieldVisitType;
  visits?: FieldVisitType[];
  project?: Project;
  onUpdateVisit?: (updatedVisit: FieldVisitType) => void;
  onAddVisit?: (newVisit: FieldVisitType) => void;
  onSignVisit?: (visitId: string, signatureResult: SignatureResult) => void;
  className?: string;
  allowInlineSign?: boolean;
}

/**
 * FieldVisit Component
 * Renders field reports (Bitácoras de Obra) with integrated HTML5 Canvas SignaturePad,
 * enabling foremen (capataces) and resident engineers to formally sign and authorize reports.
 */
export const FieldVisit: React.FC<FieldVisitProps> = ({
  visit,
  visits,
  project,
  onUpdateVisit,
  onAddVisit,
  onSignVisit,
  className = '',
  allowInlineSign = true,
}) => {
  const [activeSigningVisitId, setActiveSigningVisitId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<FieldPhoto | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // New Visit Form State
  const [newForeman, setNewForeman] = useState('Don Mario Cifuentes');
  const [newDpi, setNewDpi] = useState('2489 10293 0101');
  const [newNotes, setNewNotes] = useState('');
  const [newWeather, setNewWeather] = useState<'Soleado' | 'Lluvia Moderada' | 'Tormenta Fuerte' | 'Nublado'>('Soleado');
  const [newWorkersCount, setNewWorkersCount] = useState<number>(18);
  const [newSignatureResult, setNewSignatureResult] = useState<SignatureResult | null>(null);
  const [isNewVisitSigningOpen, setIsNewVisitSigningOpen] = useState(false);

  // Determine list of visits to display
  const displayVisits: FieldVisitType[] = visits || (visit ? [visit] : []);

  const handleSignatureSaved = (visitId: string, result: SignatureResult) => {
    if (onSignVisit) {
      onSignVisit(visitId, result);
    }

    if (onUpdateVisit) {
      const target = displayVisits.find((v) => v.id === visitId);
      if (target) {
        const updated: FieldVisitType = {
          ...target,
          signatureDataUrl: result.dataUrl,
          foremanName: result.signerName,
          signerDpi: result.signerDpi,
          signerRole: result.signerRole,
          gpsCoords: result.location || target.gpsCoords,
          status: 'Autorizado',
        };
        onUpdateVisit(updated);
      }
    }

    setActiveSigningVisitId(null);
  };

  const handleCreateVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotes.trim()) return;

    const newRecord: FieldVisitType = {
      id: `fv-${Date.now()}`,
      projectId: project?.id || 'p1',
      projectName: project?.name || 'Proyecto Activo',
      date: new Date().toISOString().split('T')[0],
      foremanName: newSignatureResult ? newSignatureResult.signerName : newForeman,
      signerDpi: newSignatureResult ? newSignatureResult.signerDpi : newDpi,
      signerRole: newSignatureResult ? newSignatureResult.signerRole : 'Capataz General de Obra',
      notes: newNotes.trim(),
      weather: newWeather,
      workersCount: Number(newWorkersCount) || 1,
      signatureDataUrl: newSignatureResult ? newSignatureResult.dataUrl : undefined,
      gpsCoords: newSignatureResult?.location || (project ? { lat: project.lat, lng: project.lng } : undefined),
      status: newSignatureResult ? 'Autorizado' : 'Pendiente',
      photos: [],
    };

    if (onAddVisit) {
      onAddVisit(newRecord);
    }

    // Reset
    setNewNotes('');
    setNewSignatureResult(null);
    setIsCreatingNew(false);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Bitácora de Campo & Firmas de Capataces</h3>
            <p className="text-xs text-slate-500">
              Validación legal y técnica de avances diarios mediante firma digital HTML5 Canvas
            </p>
          </div>
        </div>

        {onAddVisit && (
          <button
            type="button"
            onClick={() => setIsCreatingNew(!isCreatingNew)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
          >
            {isCreatingNew ? (
              'Cerrar Formulario'
            ) : (
              <>
                <Plus className="w-4 h-4" /> Nueva Bitácora con Firma
              </>
            )}
          </button>
        )}
      </div>

      {/* New Field Visit Form (if active) */}
      {isCreatingNew && (
        <form
          onSubmit={handleCreateVisitSubmit}
          className="bg-white p-5 rounded-2xl border-2 border-blue-200 shadow-sm space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Redactar Nuevo Reporte de Bitácora
            </h4>
            <span className="text-xs text-slate-500 font-mono">
              Fecha: {new Date().toLocaleDateString('es-GT')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Capataz</label>
              <input
                type="text"
                value={newForeman}
                onChange={(e) => setNewForeman(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">DPI del Capataz</label>
              <input
                type="text"
                value={newDpi}
                onChange={(e) => setNewDpi(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Condición Climática</label>
              <select
                value={newWeather}
                onChange={(e) => setNewWeather(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="Soleado">Soleado (Óptimo)</option>
                <option value="Nublado">Nublado</option>
                <option value="Lluvia Moderada">Lluvia Moderada</option>
                <option value="Tormenta Fuerte">Tormenta Fuerte (Paro)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cantidad de Trabajadores / Cuadrillas en Sitio
            </label>
            <input
              type="number"
              min="1"
              value={newWorkersCount}
              onChange={(e) => setNewWorkersCount(Number(e.target.value))}
              className="w-full max-w-xs px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descripción de Trabajos Realizados & Observaciones Técnicas
            </label>
            <textarea
              rows={3}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Describa los frentes avanzados, fundiciones, recepción de materiales o incidencias del día..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Canvas Signature Section */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-blue-600" />
                  Firma Digital del Capataz (Lienzo Canvas)
                </p>
                <p className="text-[11px] text-slate-500">
                  {newSignatureResult ? 'Firma estampada con coordenadas GPS.' : 'Requerida para autorizar la validez técnica de la bitácora.'}
                </p>
              </div>

              {newSignatureResult ? (
                <div className="flex items-center gap-3">
                  <div className="bg-white p-1 rounded-lg border border-slate-300 w-28 h-10 flex items-center justify-center">
                    <img src={newSignatureResult.dataUrl} alt="Firma Capataz" className="max-h-full object-contain" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNewVisitSigningOpen(true)}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    Modificar Firma
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsNewVisitSigningOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer"
                >
                  <PenTool className="w-3.5 h-3.5" /> Abrir SignaturePad Canvas
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" /> Guardar Reporte de Bitácora
            </button>
          </div>
        </form>
      )}

      {/* Visits List */}
      {displayVisits.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">No hay bitácoras de campo registradas</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Utilice el botón &quot;Nueva Bitácora con Firma&quot; para crear reportes diarios y autorizarlos con el componente SignaturePad.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayVisits.map((item) => {
            const isSigned = !!item.signatureDataUrl;

            return (
              <div
                key={item.id}
                id={`field-visit-${item.id}`}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 hover:border-slate-300 transition"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{item.projectName}</h4>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {item.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> {item.date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <CloudSun className="w-3 h-3 text-amber-500" /> {item.weather}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isSigned
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isSigned ? 'Autorizado en Obra' : 'Pendiente de Firma'}
                    </span>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                      title="Imprimir Bitácora"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left 2 cols: Notes, Workers, Photos */}
                  <div className="md:col-span-2 space-y-3">
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Reporte Diario de Actividades
                      </p>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        {item.notes}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        Obreros en Frentes: <strong className="text-slate-800">{item.workersCount}</strong>
                      </span>
                      {item.gpsCoords && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          GPS: {item.gpsCoords.lat.toFixed(4)}°N, {item.gpsCoords.lng.toFixed(4)}°W
                        </span>
                      )}
                    </div>

                    {/* Photos Preview */}
                    {item.photos && item.photos.length > 0 && (
                      <div className="pt-2 space-y-1.5">
                        <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5 text-blue-600" />
                          Fotografías de Evidencia ({item.photos.length})
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {item.photos.map((ph) => (
                            <div
                              key={ph.id}
                              onClick={() => setSelectedPhoto(ph)}
                              className="relative aspect-4/3 rounded-lg overflow-hidden border border-slate-200 group cursor-pointer shadow-2xs"
                            >
                              <img src={ph.url} alt={ph.caption} className="w-full h-full object-cover group-hover:scale-105 transition" />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                <Eye className="w-4 h-4" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right col: Signature Card */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-blue-600" />
                        Aprobación del Capataz
                      </p>
                      <p className="font-bold text-sm text-slate-900 mt-1">{item.foremanName}</p>
                      <p className="text-xs text-slate-500">{item.signerRole || 'Capataz General de Obra'}</p>
                      <p className="text-[11px] font-mono text-slate-600 mt-1">
                        DPI: {item.signerDpi || '2489 10293 0101'}
                      </p>
                    </div>

                    <div className="border-t border-slate-200 pt-3 space-y-2">
                      {isSigned ? (
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold mb-1">Firma en Pantalla (Canvas):</p>
                          <div className="bg-white p-1 rounded-lg border border-slate-300 h-14 flex items-center justify-center shadow-2xs">
                            <img
                              src={item.signatureDataUrl}
                              alt="Firma Digital Canvas"
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Certificado
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveSigningVisitId(item.id)}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                            >
                              Re-firmar en Canvas
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="bg-amber-100/70 border border-amber-200 p-2 rounded-lg text-[11px] text-amber-800 mb-2 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            Reporte pendiente de firma formal del capataz.
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveSigningVisitId(item.id)}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                          >
                            <PenTool className="w-3.5 h-3.5" /> Firmar con SignaturePad
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SignatureCanvas Modal for existing visit */}
      {activeSigningVisitId && (
        <SignatureCanvas
          isOpen={!!activeSigningVisitId}
          onClose={() => setActiveSigningVisitId(null)}
          visit={displayVisits.find((v) => v.id === activeSigningVisitId)}
          visitId={activeSigningVisitId}
          onSave={(dataUrl, result) => handleSignatureSaved(activeSigningVisitId, result as SignatureResult)}
          defaultSignerName={displayVisits.find((v) => v.id === activeSigningVisitId)?.foremanName || 'Don Mario Cifuentes'}
          defaultSignerDpi={displayVisits.find((v) => v.id === activeSigningVisitId)?.signerDpi || '2489 10293 0101'}
          title="Firma Digital del Capataz (SignatureCanvas)"
          subtitle={`Autorización legal de bitácora #${activeSigningVisitId}`}
        />
      )}

      {/* SignatureCanvas Modal for new visit */}
      {isNewVisitSigningOpen && (
        <SignatureCanvas
          isOpen={isNewVisitSigningOpen}
          onClose={() => setIsNewVisitSigningOpen(false)}
          onSave={(dataUrl, result) => {
            setNewSignatureResult(result as SignatureResult);
            setNewForeman(result.signerName);
            setNewDpi(result.signerDpi);
            setIsNewVisitSigningOpen(false);
          }}
          defaultSignerName={newForeman}
          defaultSignerDpi={newDpi}
          title="Firma Digital para Nueva Bitácora"
          subtitle="Estampe su firma en el lienzo para autorizar el reporte antes de guardarlo"
        />
      )}

      {/* Lightbox Photo Preview */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <p className="text-xs font-bold text-slate-800">{selectedPhoto.caption}</p>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-slate-100 max-h-96 flex items-center justify-center">
              <img src={selectedPhoto.url} alt={selectedPhoto.caption} className="max-h-96 object-contain" />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{selectedPhoto.date} {selectedPhoto.timestamp}</span>
              {selectedPhoto.coords && (
                <span>GPS: {selectedPhoto.coords.lat.toFixed(4)}°N, {selectedPhoto.coords.lng.toFixed(4)}°W</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldVisit;
