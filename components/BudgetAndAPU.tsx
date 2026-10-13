'use client';

import React, { useState } from 'react';
import {
  Calculator,
  Plus,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  MapPin,
  RotateCcw,
  Check,
  AlertTriangle,
  Trash2,
  Eye,
  Search,
  Building2,
  Layers,
  ArrowRight,
  Info,
  Clock,
  Compass,
} from 'lucide-react';
import { APUItem, Project, CompanySettings, ExpenseRecord, QuoteRecord, ScheduleTask } from '@/lib/types';
import { formatGTQ, formatUSD } from '@/lib/data';
import {
  GUATEMALA_DEPARTMENTS_INDEX,
  GUATEMALA_BASE_MARKET_CATALOGUE,
  calculateRegionalPrice,
  adjustApuDirectCostsForDepartment,
  MarketMaterialItem,
} from '@/lib/guatemalaMarketData';

interface BudgetAndAPUProps {
  budgetItems: APUItem[];
  activeProjectId: string;
  projects: Project[];
  onAddBudgetItem: (item: APUItem) => void;
  onUpdateBudgetItems?: (items: APUItem[]) => void;
  onDeleteBudgetItem?: (id: string) => void;
  currency: 'GTQ' | 'USD';
  company: CompanySettings;
  expenses: ExpenseRecord[];
  quotes: QuoteRecord[];
  tasks: ScheduleTask[];
}

export const BudgetAndAPU: React.FC<BudgetAndAPUProps> = ({
  budgetItems,
  activeProjectId,
  projects,
  onAddBudgetItem,
  onUpdateBudgetItems,
  onDeleteBudgetItem,
  currency,
  company,
}) => {
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  // Regional Department State
  const [selectedDept, setSelectedDept] = useState<string>(activeProject.department || 'Guatemala');
  const [appliedDept, setAppliedDept] = useState<string>(activeProject.department || 'Guatemala');

  // Modals
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isAiStudioOpen, setIsAiStudioOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isMarketCatalogueOpen, setIsMarketCatalogueOpen] = useState(false);
  const [inspectingItem, setInspectingItem] = useState<APUItem | null>(null);
  const [recalcToast, setRecalcToast] = useState<string | null>(null);

  // Manual Form State
  const [code, setCode] = useState('03.01');
  const [desc, setDesc] = useState('');
  const [unit, setUnit] = useState('m²');
  const [qty, setQty] = useState('100');
  const [matCost, setMatCost] = useState('240');
  const [labCost, setLabCost] = useState('110');
  const [eqCost, setEqCost] = useState('25');

  // AI APU Studio State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiUnit, setAiUnit] = useState('m²');
  const [aiQty, setAiQty] = useState('100');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // AI Audit State
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any | null>(null);

  // Market Catalogue Filter State
  const [marketCategoryFilter, setMarketCategoryFilter] = useState<string>('todos');
  const [marketSearchQuery, setMarketSearchQuery] = useState('');

  const currentDeptInfo = GUATEMALA_DEPARTMENTS_INDEX[selectedDept] || GUATEMALA_DEPARTMENTS_INDEX['Guatemala'];
  const appliedDeptInfo = GUATEMALA_DEPARTMENTS_INDEX[appliedDept] || GUATEMALA_DEPARTMENTS_INDEX['Guatemala'];

  const formatMoney = (amount: number) => {
    return currency === 'GTQ' ? formatGTQ(amount) : formatUSD(amount, company.exchangeRate);
  };

  // Recalculate all APU items direct costs for target department
  const handleRecalculateBudgetForDepartment = () => {
    if (!onUpdateBudgetItems) return;
    const updated = budgetItems.map((item) => {
      const adjusted = adjustApuDirectCostsForDepartment(
        item.materialUnitCostGTQ,
        item.laborUnitCostGTQ,
        item.equipmentUnitCostGTQ,
        selectedDept,
        appliedDept
      );
      return {
        ...item,
        materialUnitCostGTQ: adjusted.materialUnitCostGTQ,
        laborUnitCostGTQ: adjusted.laborUnitCostGTQ,
        equipmentUnitCostGTQ: adjusted.equipmentUnitCostGTQ,
        totalUnitCostGTQ: adjusted.totalUnitCostGTQ,
        totalPriceGTQ: Math.round(adjusted.totalUnitCostGTQ * item.quantity * 100) / 100,
        department: selectedDept,
      };
    });

    onUpdateBudgetItems(updated);
    setAppliedDept(selectedDept);
    setRecalcToast(
      `Presupuesto recalculado para ${selectedDept}. Factor de flete: ${currentDeptInfo.freightFactor}x, mano de obra: ${currentDeptInfo.laborFactor}x.`
    );
    setTimeout(() => setRecalcToast(null), 5000);
  };

  // Manual APU creation
  const handleCreateManualAPU = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) return;

    const m = Number(matCost) || 0;
    const l = Number(labCost) || 0;
    const eq = Number(eqCost) || 0;
    const totalUnit = m + l + eq;
    const q = Number(qty) || 1;

    const newItem: APUItem = {
      id: `apu-${Date.now()}`,
      code,
      description: desc,
      unit,
      quantity: q,
      materialUnitCostGTQ: m,
      laborUnitCostGTQ: l,
      equipmentUnitCostGTQ: eq,
      totalUnitCostGTQ: totalUnit,
      totalPriceGTQ: totalUnit * q,
      department: appliedDept,
    };

    onAddBudgetItem(newItem);
    setIsManualModalOpen(false);
    setDesc('');
  };

  // AI APU Generation
  const handleGenerateAiApu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsGeneratingAi(true);
    setAiError(null);
    setAiResult(null);

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_apu',
          description: aiPrompt,
          department: selectedDept,
          unit: aiUnit,
          quantity: Number(aiQty) || 100,
          projectName: activeProject.name,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al generar APU con IA');
      }

      setAiResult(data.data);
    } catch (err: any) {
      console.error('Error generating AI APU:', err);
      setAiError(err.message || 'No se pudo conectar con el motor de IA.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Add AI Result to Project Budget
  const handleAddAiApuToBudget = () => {
    if (!aiResult) return;

    const newItem: APUItem = {
      id: `apu-${Date.now()}`,
      code: aiResult.code || '03.99',
      description: aiResult.title || aiPrompt,
      unit: aiResult.unit || aiUnit,
      quantity: Number(aiResult.quantity) || Number(aiQty) || 100,
      materialUnitCostGTQ: Number(aiResult.materialUnitCostGTQ) || 0,
      laborUnitCostGTQ: Number(aiResult.laborUnitCostGTQ) || 0,
      equipmentUnitCostGTQ: Number(aiResult.equipmentUnitCostGTQ) || 0,
      totalUnitCostGTQ: Number(aiResult.totalUnitCostGTQ) || 0,
      totalPriceGTQ: Number(aiResult.totalPriceGTQ) || 0,
      department: selectedDept,
      breakdown: {
        materials: aiResult.materialsBreakdown,
        labor: aiResult.laborBreakdown,
        equipment: aiResult.equipmentBreakdown,
        notes: aiResult.regionalAdjustmentNote,
        technicalNorm: aiResult.technicalNorm,
      },
    };

    onAddBudgetItem(newItem);
    setIsAiStudioOpen(false);
    setAiPrompt('');
    setAiResult(null);
  };

  // AI Budget Audit
  const handleRunAiAudit = async () => {
    setIsAuditModalOpen(true);
    setIsAuditing(true);
    setAuditResult(null);

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'audit_budget',
          department: appliedDept,
          budgetItems,
          projectName: activeProject.name,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setAuditResult(data.data);
      }
    } catch (err) {
      console.error('Error running budget audit:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  const totalBudgetGTQ = budgetItems.reduce((acc, item) => acc + item.totalPriceGTQ, 0);

  // Quick prompt suggestions
  const promptSuggestions = [
    'Zapata Z-1 1.20x1.20x0.35m con parrilla No. 4 @ 0.15m y pedestal',
    'Muro de block 14x19x39 50kg/cm² con solera intermedia y pines',
    'Fundición de losa tradicional de 10cm con concreto 3000 PSI',
    'Columna C-1 0.30x0.30m con 4 varillas No. 5 y estribos No. 3',
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Regional Market Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Calculator className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Presupuesto & Análisis de Precios Unitarios (APU) Inteligente
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Desglose de costos directos (materiales, mano de obra y equipo) calibrados con precios de plaza de Guatemala y normas AGIES / COGUANOR.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsAiStudioOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Generar APU con IA
            </button>

            <button
              onClick={handleRunAiAudit}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Auditar con IA
            </button>

            <button
              onClick={() => setIsMarketCatalogueOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs transition cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Precios Mercado GT
            </button>

            <button
              onClick={() => setIsManualModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Renglón Manual
            </button>
          </div>
        </div>

        {/* REGIONAL MARKET SELECTOR & LIVE LOGISTICS INDEX */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              Área o Departamento de la Obra:
            </span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.keys(GUATEMALA_DEPARTMENTS_INDEX).map((dept) => (
                <option key={dept} value={dept}>
                  {dept} ({GUATEMALA_DEPARTMENTS_INDEX[dept].region}) — Factor {GUATEMALA_DEPARTMENTS_INDEX[dept].overallFactor}x
                </option>
              ))}
            </select>

            <span className="text-[11px] font-mono px-2 py-1 rounded bg-blue-100 text-blue-800 font-bold">
              Flete: {currentDeptInfo.freightFactor >= 1 ? `+${Math.round((currentDeptInfo.freightFactor - 1) * 100)}%` : `-${Math.round((1 - currentDeptInfo.freightFactor) * 100)}%`}
            </span>
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-slate-200 text-slate-800 font-bold">
              Distancia: {currentDeptInfo.distanceKmFromCapital} km
            </span>
          </div>

          <div className="flex items-center gap-2">
            {appliedDept !== selectedDept ? (
              <button
                onClick={handleRecalculateBudgetForDepartment}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition cursor-pointer animate-pulse"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Actualizar Costos a {selectedDept}
              </button>
            ) : (
              <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Costos sincronizados con {appliedDept}
              </span>
            )}
          </div>
        </div>

        {/* Logistics Note Bar */}
        <div className="text-[11px] text-slate-600 bg-blue-50/60 p-2.5 rounded-lg border border-blue-100 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p>
            <strong>Condiciones de Plaza ({currentDeptInfo.name}):</strong> {currentDeptInfo.logisticsNotes}
          </p>
        </div>
      </div>

      {/* RECALCULATION SUCCESS TOAST */}
      {recalcToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-900 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Check className="w-5 h-5 text-emerald-600" />
            <p className="text-xs font-bold">{recalcToast}</p>
          </div>
          <button onClick={() => setRecalcToast(null)} className="text-xs text-emerald-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Costo Total Presupuestado</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatMoney(totalBudgetGTQ)}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Suma de costos directos de obra</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Renglones Activos</p>
          <h3 className="text-2xl font-bold text-blue-600 mt-1">{budgetItems.length} Partidas</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Promedio: {budgetItems.length > 0 ? formatMoney(totalBudgetGTQ / budgetItems.length) : 'Q0.00'} / partida
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Ubicación y Factor Activo</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{appliedDept}</h3>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            Índice Ponderado: {appliedDeptInfo.overallFactor}x sobre Plaza Central
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Normativa Técnica</p>
          <h3 className="text-lg font-bold text-slate-900 mt-1">AGIES / COGUANOR</h3>
          <p className="text-[11px] text-blue-600 font-medium mt-0.5">
            Sismo-resistencia NSE 2 y 3
          </p>
        </div>
      </div>

      {/* APU ITEMS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Listado de Renglones de Obra (Presupuesto)</h3>
          </div>
          <span className="text-xs text-slate-500">
            Región: <strong className="text-slate-800">{appliedDept}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase border-b border-slate-200">
              <tr>
                <th className="p-3.5">Código</th>
                <th className="p-3.5">Descripción del Renglón</th>
                <th className="p-3.5">Unidad</th>
                <th className="p-3.5">Cant.</th>
                <th className="p-3.5">Materiales</th>
                <th className="p-3.5">Mano Obra</th>
                <th className="p-3.5">Equipo</th>
                <th className="p-3.5">Costo Unitario</th>
                <th className="p-3.5">Total Parcial</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {budgetItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-mono font-bold text-blue-600">{item.code}</td>
                  <td className="p-3.5 font-medium text-slate-900 max-w-xs">
                    <p className="truncate" title={item.description}>{item.description}</p>
                    {item.department && item.department !== appliedDept && (
                      <span className="text-[10px] text-amber-600 font-medium">
                        (Base: {item.department})
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 font-mono">{item.unit}</td>
                  <td className="p-3.5 font-bold">{item.quantity}</td>
                  <td className="p-3.5">{formatMoney(item.materialUnitCostGTQ)}</td>
                  <td className="p-3.5">{formatMoney(item.laborUnitCostGTQ)}</td>
                  <td className="p-3.5">{formatMoney(item.equipmentUnitCostGTQ)}</td>
                  <td className="p-3.5 font-bold text-slate-900">{formatMoney(item.totalUnitCostGTQ)}</td>
                  <td className="p-3.5 font-bold text-blue-900">{formatMoney(item.totalPriceGTQ)}</td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setInspectingItem(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                        title="Ver desglose detallado de materiales, mano de obra y equipo"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {onDeleteBudgetItem && (
                        <button
                          onClick={() => onDeleteBudgetItem(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Eliminar partida"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: AI APU GENERATION STUDIO */}
      {isAiStudioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </span>
                <div>
                  <h3 className="font-bold text-base">Generador Inteligente de APU con IA</h3>
                  <p className="text-xs text-slate-300">
                    Cálculo automático de rendimiento, materiales y mano de obra para {selectedDept}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAiStudioOpen(false);
                  setAiResult(null);
                  setAiError(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <form onSubmit={handleGenerateAiApu} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Descripción del Renglón o Partida Constructiva
                  </label>
                  <textarea
                    rows={2}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ej. Muro perimetral de block 14x19x39 de 50 kg/cm² con solera intermedia y columnas de amarre..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>

                {/* Suggestions */}
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-500 font-semibold">Sugerencias rápidas:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {promptSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAiPrompt(s)}
                        className="text-[10px] px-2 py-1 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 transition cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Unidad</label>
                    <select
                      value={aiUnit}
                      onChange={(e) => setAiUnit(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50"
                    >
                      <option value="m²">m² (Metro cuadrado)</option>
                      <option value="m³">m³ (Metro cúbico)</option>
                      <option value="m">m (Metro lineal)</option>
                      <option value="Unidad">Unidad</option>
                      <option value="Global">Global</option>
                      <option value="Punto">Punto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cantidad de Obra</label>
                    <input
                      type="number"
                      value={aiQty}
                      onChange={(e) => setAiQty(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Departamento</label>
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50"
                    >
                      {Object.keys(GUATEMALA_DEPARTMENTS_INDEX).map((dept) => (
                        <option key={dept} value={dept}>
                          {dept} ({GUATEMALA_DEPARTMENTS_INDEX[dept].overallFactor}x)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isGeneratingAi}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Sparkles className={`w-4 h-4 ${isGeneratingAi ? 'animate-spin text-amber-300' : ''}`} />
                  {isGeneratingAi ? 'Calculando Precios Unitarios en Guatemala...' : 'Calcular Análisis APU con IA'}
                </button>
              </form>

              {/* AI Error */}
              {aiError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {aiError}
                </div>
              )}

              {/* AI RESULT DISPLAY */}
              {aiResult && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-4 animate-in fade-in">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        Código: {aiResult.code || '03.01'}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 mt-1">{aiResult.title || aiPrompt}</h4>
                      <p className="text-[11px] text-slate-500">
                        Norma técnica: <strong>{aiResult.technicalNorm || 'AGIES NSE 3'}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-500 uppercase font-bold">Costo Unitario</p>
                      <p className="text-xl font-bold text-blue-900">{formatMoney(aiResult.totalUnitCostGTQ)}</p>
                      <p className="text-[10px] text-slate-400">Total: {formatMoney(aiResult.totalPriceGTQ)}</p>
                    </div>
                  </div>

                  {/* Cost Summary Cards */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-white border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-semibold">Materiales</p>
                      <p className="font-bold text-slate-900 mt-0.5">{formatMoney(aiResult.materialUnitCostGTQ)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-semibold">Mano de Obra</p>
                      <p className="font-bold text-slate-900 mt-0.5">{formatMoney(aiResult.laborUnitCostGTQ)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-semibold">Equipo/Herr.</p>
                      <p className="font-bold text-slate-900 mt-0.5">{formatMoney(aiResult.equipmentUnitCostGTQ)}</p>
                    </div>
                  </div>

                  {/* Materials breakdown list */}
                  {aiResult.materialsBreakdown && aiResult.materialsBreakdown.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-slate-700">Insumos y Materiales de Plaza:</p>
                      <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 text-[11px]">
                        {aiResult.materialsBreakdown.map((m: any, idx: number) => (
                          <div key={idx} className="p-2 flex items-center justify-between">
                            <span className="text-slate-800">{m.name}</span>
                            <span className="font-mono font-bold text-slate-700">
                              {m.quantity} {m.unit} @ {formatMoney(m.unitPriceGTQ)} = {formatMoney(m.subtotalGTQ)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Regional Note */}
                  {aiResult.regionalAdjustmentNote && (
                    <div className="text-[11px] p-2.5 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 flex items-start gap-1.5">
                      <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <p>{aiResult.regionalAdjustmentNote}</p>
                    </div>
                  )}

                  <button
                    onClick={handleAddAiApuToBudget}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Incorporar este Renglón al Presupuesto
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: AI BUDGET AUDIT */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-base">Auditoría Financiera & de Riesgos con IA</h3>
                  <p className="text-xs text-slate-400">
                    Análisis comparativo de presupuesto contra índices de la CGC en {appliedDept}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsAuditModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {isAuditing ? (
                <div className="py-12 text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Analizando partidas con el modelo Gemini 3.8 Flash...</p>
                  <p className="text-[11px] text-slate-400">Verificando precios de mercado, fletes e insumos críticos omitidos.</p>
                </div>
              ) : auditResult ? (
                <div className="space-y-4">
                  {/* Risk Badge Header */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase">Nivel de Riesgo Financiero</p>
                      <h4 className="text-xl font-bold text-slate-900 mt-0.5">{auditResult.riskLevel}</h4>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        auditResult.riskLevel === 'Bajo'
                          ? 'bg-emerald-100 text-emerald-800'
                          : auditResult.riskLevel === 'Medio'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      Variación Estimada: {auditResult.estimatedVariancePercent}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">{auditResult.summary}</p>

                  {/* Alerts List */}
                  {auditResult.alerts && auditResult.alerts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Observaciones y Alertas de Costos:
                      </p>
                      <div className="space-y-2">
                        {auditResult.alerts.map((al: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1">
                            <div className="flex items-center justify-between font-bold">
                              <span>Partida {al.itemCode || 'General'}</span>
                              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-100">
                                {al.type}
                              </span>
                            </div>
                            <p>{al.description}</p>
                            <p className="text-[11px] text-amber-800 font-semibold pt-1 border-t border-amber-200/50">
                              💡 {al.recommendation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {auditResult.recommendations && auditResult.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-800">Recomendaciones Estratégicas:</p>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {auditResult.recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: GUATEMALA MARKET REFERENCE PRICING CATALOGUE */}
      {isMarketCatalogueOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-base">Catálogo de Precios de Referencia - Mercado de Guatemala</h3>
                  <p className="text-xs text-slate-400">
                    Ajustado automáticamente para: <strong className="text-white">{selectedDept}</strong>
                  </p>
                </div>
              </div>
              <button onClick={() => setIsMarketCatalogueOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={marketSearchQuery}
                  onChange={(e) => setMarketSearchQuery(e.target.value)}
                  placeholder="Buscar insumo (ej. cemento, hierro, arena, block)..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
              >
                {Object.keys(GUATEMALA_DEPARTMENTS_INDEX).map((dept) => (
                  <option key={dept} value={dept}>
                    {dept} ({GUATEMALA_DEPARTMENTS_INDEX[dept].overallFactor}x)
                  </option>
                ))}
              </select>
            </div>

            <div className="p-5 overflow-y-auto space-y-2">
              <div className="divide-y divide-slate-100">
                {GUATEMALA_BASE_MARKET_CATALOGUE.filter((item) => {
                  if (marketCategoryFilter !== 'todos' && item.category !== marketCategoryFilter) return false;
                  if (marketSearchQuery.trim()) {
                    const q = marketSearchQuery.toLowerCase();
                    return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
                  }
                  return true;
                }).map((item) => {
                  const reg = calculateRegionalPrice(item.basePriceGTQ, selectedDept, item.category);
                  return (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {item.category}
                        </span>
                        <h5 className="font-bold text-xs text-slate-900 mt-1">{item.name}</h5>
                        <p className="text-[10px] text-slate-500">{item.specifications}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-slate-900">{formatGTQ(reg.adjustedPrice)}</p>
                        <p className="text-[10px] text-slate-400">por {item.unit}</p>
                        {reg.diffPercent !== 0 && (
                          <span
                            className={`text-[9px] font-mono font-bold ${
                              reg.diffPercent > 0 ? 'text-amber-700' : 'text-emerald-700'
                            }`}
                          >
                            {reg.diffPercent > 0 ? `+${reg.diffPercent}%` : `${reg.diffPercent}%`} en {selectedDept}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: INSPECT ITEM APU BREAKDOWN */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-600 text-white font-bold">
                  {inspectingItem.code}
                </span>
                <h3 className="font-bold text-sm mt-1">{inspectingItem.description}</h3>
              </div>
              <button onClick={() => setInspectingItem(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Materiales</p>
                  <p className="font-bold text-slate-900 mt-1">{formatMoney(inspectingItem.materialUnitCostGTQ)}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Mano de Obra</p>
                  <p className="font-bold text-slate-900 mt-1">{formatMoney(inspectingItem.laborUnitCostGTQ)}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Equipo / Herr.</p>
                  <p className="font-bold text-slate-900 mt-1">{formatMoney(inspectingItem.equipmentUnitCostGTQ)}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-blue-900 font-semibold">Costo Total por {inspectingItem.unit}:</p>
                  <p className="text-lg font-bold text-blue-950">{formatMoney(inspectingItem.totalUnitCostGTQ)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-blue-900 font-semibold">Total Partida ({inspectingItem.quantity} {inspectingItem.unit}):</p>
                  <p className="text-lg font-bold text-blue-950">{formatMoney(inspectingItem.totalPriceGTQ)}</p>
                </div>
              </div>

              {inspectingItem.breakdown && (
                <div className="space-y-3">
                  {inspectingItem.breakdown.technicalNorm && (
                    <p className="text-[11px] text-slate-600">
                      <strong>Norma técnica:</strong> {inspectingItem.breakdown.technicalNorm}
                    </p>
                  )}
                  {inspectingItem.breakdown.notes && (
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      {inspectingItem.breakdown.notes}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setInspectingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: MANUAL APU CREATION */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Nuevo Renglón APU Manual</h3>
              <button onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateManualAPU} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Código</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unidad</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción del Renglón</label>
                <input
                  type="text"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Ej. Zapata de concreto f'c=280 kg/cm²"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cantidad Total</label>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Costo Materiales (Q)</label>
                  <input
                    type="number"
                    value={matCost}
                    onChange={(e) => setMatCost(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Costo Mano de Obra (Q)</label>
                  <input
                    type="number"
                    value={labCost}
                    onChange={(e) => setLabCost(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Costo Equipo & Herram. (Q)</label>
                  <input
                    type="number"
                    value={eqCost}
                    onChange={(e) => setEqCost(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-700 bg-slate-100 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                  Guardar Renglón APU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
