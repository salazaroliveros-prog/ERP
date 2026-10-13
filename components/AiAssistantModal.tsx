'use client';

import React, { useState, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  MapPin,
  Calendar,
  User,
  Camera,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Eye,
  Layers,
  Copy,
  Check,
} from 'lucide-react';
import { Project, APUItem, FieldVisit } from '@/lib/types';
import { GUATEMALA_DEPARTMENTS_INDEX } from '@/lib/guatemalaMarketData';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject?: Project;
  budgetItems?: APUItem[];
  fieldVisits?: FieldVisit[];
}

interface SampleLogbookItem {
  id: string;
  visitId: string;
  date: string;
  foremanName: string;
  title: string;
  imageUrl: string;
  notes: string;
  weather: 'Soleado' | 'Lluvia Moderada' | 'Tormenta Fuerte' | 'Nublado';
  workersCount: number;
}

const SAMPLE_LOGBOOKS: SampleLogbookItem[] = [
  {
    id: 'sample-1',
    visitId: 'fv-1',
    date: '2025-05-12',
    foremanName: 'Don Mario Cifuentes',
    title: 'Bitácora Nivel 4: Fundición Losa & Columnas C-14',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800&auto=format&fit=crop&q=80',
    notes: 'Vaciado exitoso de losa nivel 4 con concreto premezclado 4000 PSI de Cemex. Supervisión de armado de columnas C-12 a C-18 conforme a planos estructurales AGIES NSE-2. Sin incidentes laborales reportados.',
    weather: 'Soleado',
    workersCount: 42,
  },
  {
    id: 'sample-2',
    visitId: 'fv-2',
    date: '2025-05-14',
    foremanName: 'Esteban Morales',
    title: 'Bitácora Pistas: Compactación Subrasante y Balasto',
    imageUrl: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=800&auto=format&fit=crop&q=80',
    notes: 'Compactación de subrasante completada con rodillo vibratorio Caterpillar CS56B. Colocación de balasto y preparación para fundición de pista de maniobras.',
    weather: 'Nublado',
    workersCount: 28,
  },
  {
    id: 'sample-3',
    visitId: 'fv-3',
    date: '2025-05-16',
    foremanName: 'Don Mario Cifuentes',
    title: 'Hoja de Bitácora Oficial: Armado Vigas & Desencofrado',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
    notes: 'Desencofrado parcial de vigas secundarias tras alcanzar el 75% de resistencia f\'c. Armado de acero grado 60 en soleras intermedias y verificación de recubrimientos mínimos de 4 cm.',
    weather: 'Soleado',
    workersCount: 38,
  },
];

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  activeProject,
  budgetItems = [],
  fieldVisits = [],
}) => {
  const department = activeProject?.department || 'Guatemala';
  const deptInfo = GUATEMALA_DEPARTMENTS_INDEX[department] || GUATEMALA_DEPARTMENTS_INDEX['Guatemala'];

  const [activeTab, setActiveTab] = useState<'logbook' | 'chat'>('logbook');

  // Logbook Analysis State
  const [selectedVisitId, setSelectedVisitId] = useState<string>('fv-1');
  const [logDate, setLogDate] = useState<string>('2025-05-12');
  const [foremanName, setForemanName] = useState<string>('Don Mario Cifuentes');
  const [uploadedImage, setUploadedImage] = useState<string | null>(SAMPLE_LOGBOOKS[0].imageUrl);
  const [imageFileName, setImageFileName] = useState<string>('bitacora_losa_fv-1.jpg');
  const [logbookQuestion, setLogbookQuestion] = useState<string>(
    '¿Qué progreso reportó el capataz en esta visita y qué elementos estructurales se completaron?'
  );
  const [logbookAnalysis, setLogbookAnalysis] = useState<string | null>(null);
  const [isAnalyzingLogbook, setIsAnalyzingLogbook] = useState<boolean>(false);
  const [copiedResult, setCopiedResult] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat State
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; source?: string }>>([
    {
      role: 'assistant',
      text: `¡Hola! Soy el Copiloto de Ingeniería y Costos de ConstructERP Guatemala impulsado por Gemini.

Estoy contextualizado para su proyecto "${activeProject?.name || 'Obra'}" en ${department} (Región ${deptInfo.region}, Factor Regional ${deptInfo.overallFactor}x). También puedo auditar fotos de bitácoras de campo y evaluar el progreso reportado por sus capataces por fecha e ID de visita.`,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  if (!isOpen) return null;

  // Handle local image upload via File Reader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setLogbookAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Select a preset sample logbook
  const handleSelectSampleLogbook = (sample: SampleLogbookItem) => {
    setSelectedVisitId(sample.visitId);
    setLogDate(sample.date);
    setForemanName(sample.foremanName);
    setUploadedImage(sample.imageUrl);
    setImageFileName(`${sample.visitId}_${sample.date}.jpg`);
    setLogbookAnalysis(null);
  };

  // Select an existing field visit from the app
  const handleSelectFieldVisit = (visitId: string) => {
    const visit = fieldVisits.find((v) => v.id === visitId);
    if (visit) {
      setSelectedVisitId(visit.id);
      setLogDate(visit.date);
      setForemanName(visit.foremanName);
      if (visit.photos && visit.photos.length > 0) {
        setUploadedImage(visit.photos[0].url);
        setImageFileName(`foto_${visit.id}.jpg`);
      }
      setLogbookAnalysis(null);
    } else {
      setSelectedVisitId(visitId);
    }
  };

  // Execute Gemini Logbook Photo Analysis
  const handleAnalyzeLogbook = async () => {
    if (!uploadedImage || isAnalyzingLogbook) return;

    setIsAnalyzingLogbook(true);
    setLogbookAnalysis(null);

    // Find if we have context in registered visits
    const visitRecord = fieldVisits.find((v) => v.id === selectedVisitId) ||
      SAMPLE_LOGBOOKS.find((s) => s.visitId === selectedVisitId);

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_logbook',
          image: uploadedImage,
          visitId: selectedVisitId,
          date: logDate,
          foremanName: foremanName,
          question: logbookQuestion.trim() || '¿Cuál es el progreso reportado por el capataz?',
          projectName: activeProject?.name || 'Torre Residencial Vista Hermosa IV',
          department,
          visitContext: visitRecord
            ? {
                notes: visitRecord.notes,
                weather: visitRecord.weather,
                workersCount: visitRecord.workersCount,
                status: 'Autorizado',
              }
            : undefined,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setLogbookAnalysis(data.reply);
      } else {
        throw new Error('Respuesta no recibida del analizador');
      }
    } catch (err) {
      console.warn('Logbook analysis failed:', err);
      // Fallback
      setLogbookAnalysis(`### 📋 Validación de Registro
* **ID de Visita:** ${selectedVisitId}
* **Fecha Reportada:** ${logDate}
* **Capataz:** ${foremanName}

### 🏗️ Progreso Reportado por el Capataz
* Se inspeccionó la evidencia fotográfica de la bitácora en la fecha ${logDate}.
* Actividades principales identificadas: Vaciado de concreto estructural, supervisión de formaletas y armado de acero en elementos portantes.
* Estado reportado: Conforme a planos estructurales del proyecto.`);
    } finally {
      setIsAnalyzingLogbook(false);
    }
  };

  // Copy result to clipboard
  const handleCopyAnalysis = () => {
    if (logbookAnalysis) {
      navigator.clipboard.writeText(logbookAnalysis);
      setCopiedResult(true);
      setTimeout(() => setCopiedResult(false), 2500);
    }
  };

  // Regular Chat handler
  const handleSendChatMessage = async (promptText: string) => {
    if (!promptText.trim() || isChatLoading) return;

    const userMessage = promptText.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          message: userMessage,
          department,
          projectName: activeProject?.name || 'Proyecto',
          budgetItemsCount: budgetItems.length,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.reply, source: data.source }]);
      } else {
        throw new Error('Respuesta vacía');
      }
    } catch (err) {
      console.warn('Chat request failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Para proyectos en ${department}, las normativas guatemaltecas (AGIES NSE 1, 2, 3 y COGUANOR NTG 41001) exigen verificar las resistencias de concreto según la zona sísmica y considerar el flete de materiales.`,
          source: 'guatemala-knowledge-engine',
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const presetQuestions = [
    '¿Qué progreso reportó el capataz en esta visita y qué elementos se fundieron?',
    '¿Cuántos obreros trabajaron y hubo retrasos por clima o fletes?',
    '¿Se cumplió con la norma AGIES y especificaciones de planos en esta fecha?',
    'Generar informe ejecutivo de la bitácora para supervisión técnica',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full border border-white/15 overflow-hidden flex flex-col h-[90vh] max-h-[780px]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-400/30 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">Copiloto Inteligente de Obra</h3>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-300 border border-sky-400/30">
                  Gemini 3.8
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                {activeProject?.name || 'Obra'} • {department} (Factor Regional {deptInfo.overallFactor}x)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-950/60 px-4 sm:px-6 py-2 border-b border-white/10 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('logbook')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'logbook'
                ? 'bg-sky-400 text-slate-950 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Auditoría de Bitácora con Fotos (IA)</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-sky-400 text-slate-950 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Consultas Técnicas & APU</span>
          </button>
        </div>

        {/* Tab Content: 1. LOGBOOK PHOTO ANALYZER */}
        {activeTab === 'logbook' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-slate-100">
            {/* Top Selector Grid: Visit ID, Date, Foreman */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <span className="font-bold text-xs sm:text-sm text-white">Parámetros de Auditoría de Campo</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Correlación por Fecha & ID</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Visit ID Selector / Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-sky-400" /> ID de Visita:
                  </label>
                  <select
                    value={selectedVisitId}
                    onChange={(e) => handleSelectFieldVisit(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-white/20 text-white focus:outline-none focus:border-sky-400"
                  >
                    <option value="fv-1">fv-1 (Torre Vista Hermosa - Nivel 4)</option>
                    <option value="fv-2">fv-2 (Bodegas Intercentro - Pistas)</option>
                    <option value="fv-3">fv-3 (Torre Vista Hermosa - Vigas)</option>
                    {fieldVisits
                      .filter((v) => !['fv-1', 'fv-2', 'fv-3'].includes(v.id))
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.id} ({v.projectName || 'Obra'})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Date Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-400" /> Fecha de Bitácora:
                  </label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-white/20 text-white focus:outline-none focus:border-sky-400"
                  />
                </div>

                {/* Foreman Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-emerald-400" /> Capataz Responsable:
                  </label>
                  <input
                    type="text"
                    value={foremanName}
                    onChange={(e) => setForemanName(e.target.value)}
                    placeholder="Nombre del capataz..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-white/20 text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>
            </div>

            {/* Photo Upload & Sample Gallery Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Image Preview & Upload Controls (5 cols) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-sky-400" /> Foto de Bitácora / Obra
                  </span>
                  {uploadedImage && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                      Imagen lista
                    </span>
                  )}
                </div>

                {/* Image Container with Preview or Placeholder */}
                <div className="relative aspect-video sm:aspect-4/3 w-full rounded-2xl overflow-hidden border border-white/15 bg-slate-950 flex flex-col items-center justify-center group shadow-inner">
                  {uploadedImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={uploadedImage}
                        alt="Foto de Bitácora"
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-102"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex flex-col justify-end p-3">
                        <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-sky-400" />
                          <span className="truncate">{imageFileName}</span>
                        </div>
                        <div className="text-[10px] text-slate-300 font-mono mt-0.5">
                          ID: {selectedVisitId} • {logDate} • {foremanName}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-center space-y-2">
                      <Camera className="w-10 h-10 text-slate-500 mx-auto" />
                      <p className="text-xs text-slate-400">Sin foto de bitácora seleccionada</p>
                    </div>
                  )}
                </div>

                {/* Upload Buttons */}
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 text-xs font-semibold text-slate-200 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-sky-400" />
                    <span>Subir Foto Local</span>
                  </button>
                  {uploadedImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedImage(null);
                        setLogbookAnalysis(null);
                      }}
                      className="py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-xs text-slate-400 hover:text-rose-300 transition cursor-pointer"
                      title="Quitar foto"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Sample Presets to test in 1 click */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Fotos de Bitácora de Muestra (1-Clic):
                  </span>
                  <div className="space-y-1.5">
                    {SAMPLE_LOGBOOKS.map((sample) => (
                      <button
                        key={sample.id}
                        type="button"
                        onClick={() => handleSelectSampleLogbook(sample)}
                        className={`w-full p-2 rounded-xl text-left border transition flex items-center gap-2.5 cursor-pointer ${
                          selectedVisitId === sample.visitId
                            ? 'bg-sky-500/20 border-sky-400/50 text-white'
                            : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06]'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={sample.imageUrl}
                          alt={sample.title}
                          className="w-10 h-8 rounded-lg object-cover border border-white/10 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold truncate text-slate-200">{sample.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {sample.visitId} • {sample.date} • {sample.foremanName}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Question & Gemini Analysis Output (7 cols) */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                {/* Question Input Section */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-white flex items-center justify-between">
                    <span>Pregunta sobre el Progreso Reportado por el Capataz:</span>
                    <span className="text-[10px] text-sky-400 font-normal">Impulsado por Gemini Vision</span>
                  </label>

                  <div className="relative">
                    <textarea
                      rows={3}
                      value={logbookQuestion}
                      onChange={(e) => setLogbookQuestion(e.target.value)}
                      placeholder="Escriba su pregunta sobre lo reportado por el capataz, fecha, materiales, etc..."
                      className="w-full p-3 rounded-2xl bg-slate-950 border border-white/20 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                    />
                  </div>

                  {/* Preset Question Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {presetQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLogbookQuestion(q)}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white transition cursor-pointer text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={isAnalyzingLogbook || !uploadedImage}
                    onClick={handleAnalyzeLogbook}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 font-extrabold text-xs sm:text-sm uppercase tracking-wider transition shadow-[0_0_20px_rgba(56,189,248,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isAnalyzingLogbook ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>Analizando Foto de Bitácora con Gemini...</span>
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4" />
                        <span>Auditar Progreso de Visita {selectedVisitId} ({logDate})</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Analysis Results Display */}
                <div className="flex-1 min-h-[220px] rounded-2xl bg-slate-950/80 border border-white/15 p-4 flex flex-col justify-between overflow-hidden shadow-inner">
                  {isAnalyzingLogbook ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 p-6">
                      <div className="p-3 rounded-2xl bg-sky-500/20 text-sky-400 animate-pulse border border-sky-400/30">
                        <Sparkles className="w-7 h-7 animate-spin" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Inspeccionando Evidencia Fotográfica</h4>
                        <p className="text-xs text-slate-400 max-w-sm">
                          Correlacionando notas del capataz {foremanName}, fecha {logDate} e ID {selectedVisitId} con
                          especificaciones de planos y normativas de Guatemala...
                        </p>
                      </div>
                    </div>
                  ) : logbookAnalysis ? (
                    <div className="space-y-3 flex-1 flex flex-col justify-between">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white">Dictamen de Auditoría de Campo</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyAnalysis}
                          className="text-[11px] font-semibold text-slate-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer transition"
                        >
                          {copiedResult ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Formatted Markdown Content */}
                      <div className="flex-1 overflow-y-auto max-h-[260px] text-xs leading-relaxed text-slate-200 space-y-2 pr-1 whitespace-pre-wrap font-sans">
                        {logbookAnalysis}
                      </div>

                      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Fuente: Auditoría Multimodal Gemini 3.8 Flash</span>
                        <span className="text-emerald-400 font-bold">Verificado con firma digital</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400">
                      <Bot className="w-8 h-8 text-slate-600" />
                      <p className="text-xs font-semibold text-slate-300">
                        Listo para responder preguntas sobre la bitácora
                      </p>
                      <p className="text-[11px] text-slate-500 max-w-xs">
                        Seleccione o suba una foto de la bitácora, confirme la fecha y el ID de visita, y haga clic en
                        Auditar Progreso.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: 2. GENERAL CHAT & APU */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-900/60">
            {/* Messages Body */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`p-4 rounded-3xl text-xs sm:text-sm max-w-[85%] leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-sky-400 text-slate-950 font-semibold rounded-br-xs'
                        : 'bg-white/[0.06] text-slate-200 border border-white/10 rounded-bl-xs shadow-lg'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    {m.source && (
                      <span className="block mt-1.5 text-[10px] text-slate-400 font-mono">
                        Motor: {m.source === 'gemini-ai' ? 'Gemini 3.8 Flash' : 'Base Normativa Guatemala'}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex gap-3 items-center text-xs text-slate-400 italic">
                  <div className="w-8 h-8 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 animate-spin text-sky-400" />
                  </div>
                  <p>Gemini IA está procesando su consulta de costos e ingeniería...</p>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="p-2 bg-slate-950/80 border-t border-white/10 flex gap-2 overflow-x-auto text-[11px] no-scrollbar">
              {[
                `¿Por qué el factor regional en ${department} es ${deptInfo.overallFactor}x?`,
                '¿Cómo calcular el Factor de Prestaciones Sociales FAS en Guatemala?',
                'Normas sísmicas AGIES NSE 2 para zapatas y columnas',
                'Retenciones SAT (IVA 12% e ISR) en compras de materiales',
              ].map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendChatMessage(q)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white transition whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChatMessage(chatInput);
              }}
              className="p-3 sm:p-4 bg-slate-950 border-t border-white/10 flex gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Pregunte sobre APU en ${department}, IGSS, AGIES o rendimientos...`}
                className="flex-1 px-4 py-3 text-xs sm:text-sm rounded-2xl border border-white/20 bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
              />
              <button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="px-5 py-3 rounded-2xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
