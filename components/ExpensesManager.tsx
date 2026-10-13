'use client';

import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Camera,
  Upload,
  Eye,
  Trash2,
  MapPin,
  Calendar,
  X,
  Download,
  Printer,
  CheckCircle2,
  FileText,
  RotateCw,
  ShieldCheck,
  AlertTriangle,
  Clock,
  History,
  FileSearch,
  Check,
  Ban,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { ExpenseRecord, Project, CompanySettings, APUItem, ExpenseAuditEntry } from '@/lib/types';
import { formatGTQ, formatUSD, initialAPUItems } from '@/lib/data';
import { CameraCaptureModal } from '@/components/CameraCaptureModal';

interface ExpensesManagerProps {
  expenses: ExpenseRecord[];
  projects: Project[];
  activeProjectId: string;
  onAddExpense: (e: ExpenseRecord) => void;
  onUpdateExpense?: (e: ExpenseRecord) => void;
  currency: 'GTQ' | 'USD';
  company: CompanySettings;
  budgetItems?: APUItem[];
}

export const ExpensesManager: React.FC<ExpensesManagerProps> = ({
  expenses,
  projects,
  activeProjectId,
  onAddExpense,
  onUpdateExpense,
  currency,
  company,
  budgetItems = initialAPUItems,
}) => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [category, setCategory] = useState<
    | 'Materiales (Cementos, Hierro)'
    | 'Mano de Obra'
    | 'Maquinaria y Combustible'
    | 'Permisos & Licencias'
    | 'Imprevistos'
  >('Materiales (Cementos, Hierro)');
  const [desc, setDesc] = useState('');
  const [supplier, setSupplier] = useState('');
  const [nit, setNit] = useState('');
  const [factura, setFactura] = useState('');
  const [amount, setAmount] = useState('5000');
  const [assignedApuId, setAssignedApuId] = useState<string>('apu-2');

  // Receipt capture states for new expense
  const [newReceiptUrl, setNewReceiptUrl] = useState<string | null>(null);
  const [newReceiptDate, setNewReceiptDate] = useState<string | null>(null);
  const [newReceiptCoords, setNewReceiptCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Camera modal state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraTargetExpenseId, setCameraTargetExpenseId] = useState<string | null>(null);

  // Lightbox preview for full receipt inspection
  const [viewingReceiptExpense, setViewingReceiptExpense] = useState<ExpenseRecord | null>(null);

  // Two-Step Approval states
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendientes' | 'aprobados'>('todos');
  const [viewingAuditExpense, setViewingAuditExpense] = useState<ExpenseRecord | null>(null);
  const [approvalModalExpense, setApprovalModalExpense] = useState<ExpenseRecord | null>(null);
  const [approvalDecision, setApprovalDecision] = useState<'Aprobado' | 'Pendiente' | 'Rechazado'>('Aprobado');
  const [approvalNote, setApprovalNote] = useState('');
  const [pmName, setPmName] = useState('Ing. Carlos Mendoza (PM)');

  // Overrun warning toast
  const [warningToast, setWarningToast] = useState<{
    message: string;
    diff: number;
    apuCode: string;
    budgetTotal: number;
    spentTotal: number;
  } | null>(null);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  const formatMoney = (val: number) => {
    return currency === 'GTQ' ? formatGTQ(val) : formatUSD(val, company.exchangeRate);
  };

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Helper to check APU budget overrun
  const checkApuOverrun = (apuId: string, additionalAmount: number, excludeExpenseId?: string) => {
    const apu = budgetItems.find((b) => b.id === apuId);
    if (!apu) return null;

    const currentSpent = expenses
      .filter((e) => e.projectId === activeProject.id && e.assignedApuId === apuId && e.id !== excludeExpenseId)
      .reduce((sum, e) => sum + e.amount, 0);

    const projectedTotal = currentSpent + additionalAmount;
    if (projectedTotal > apu.totalPriceGTQ) {
      return {
        isOver: true,
        diff: projectedTotal - apu.totalPriceGTQ,
        apuCode: apu.code,
        apuDesc: apu.description,
        budgetTotal: apu.totalPriceGTQ,
        currentSpent,
        projectedTotal,
      };
    }
    return null;
  };

  const analyzeReceiptWithAI = async (dataUrl: string) => {
    try {
      setIsAnalyzing(true);
      const res = await fetch('/api/gemini/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        if (d.supplier) setSupplier(d.supplier);
        if (d.nitSupplier) setNit(d.nitSupplier);
        if (d.facturaNumber) setFactura(d.facturaNumber);
        if (d.amount && !isNaN(Number(d.amount))) {
          const parsedAmt = String(d.amount);
          setAmount(parsedAmt);
          // Check APU overrun
          const overrun = checkApuOverrun(assignedApuId, Number(parsedAmt));
          if (overrun) {
            setWarningToast({
              message: `¡Alerta de Presupuesto APU! La factura detectada por IA de Q${d.amount} excede el renglón ${overrun.apuCode} (${overrun.apuDesc}).`,
              diff: overrun.diff,
              apuCode: overrun.apuCode,
              budgetTotal: overrun.budgetTotal,
              spentTotal: overrun.projectedTotal,
            });
          }
        }
        if (d.category) setCategory(d.category);
        if (d.description) setDesc(d.description);
      }
    } catch (err) {
      console.error('Failed to analyze receipt with AI:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCaptureReceipt = (
    dataUrl: string,
    meta: { coords?: { lat: number; lng: number }; timestamp: string; caption?: string }
  ) => {
    if (cameraTargetExpenseId) {
      const target = expenses.find((e) => e.id === cameraTargetExpenseId);
      if (target && onUpdateExpense) {
        onUpdateExpense({
          ...target,
          receiptPhotoUrl: dataUrl,
          receiptPhotoDate: meta.timestamp,
          receiptCoords: meta.coords,
        });
      }
      setCameraTargetExpenseId(null);
    } else {
      setNewReceiptUrl(dataUrl);
      setNewReceiptDate(meta.timestamp);
      setNewReceiptCoords(meta.coords || null);
      analyzeReceiptWithAI(dataUrl);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) return;

    const numAmount = Number(amount) || 1000;
    const selectedApu = budgetItems.find((b) => b.id === assignedApuId);
    const nowStr = new Date().toLocaleString('es-GT');

    // Check APU overrun warning
    const overrun = checkApuOverrun(assignedApuId, numAmount);
    if (overrun) {
      setWarningToast({
        message: `¡Alerta de Sobrecosto APU! El gasto excede por Q${overrun.diff.toLocaleString('es-GT')} el presupuesto asignado al renglón ${overrun.apuCode}.`,
        diff: overrun.diff,
        apuCode: overrun.apuCode,
        budgetTotal: overrun.budgetTotal,
        spentTotal: overrun.projectedTotal,
      });
    }

    const ex: ExpenseRecord = {
      id: `ex-${Date.now()}`,
      projectId: activeProject.id,
      date: new Date().toISOString().split('T')[0],
      category,
      description: desc,
      supplier: supplier || 'Proveedor Local',
      nitSupplier: nit || '123456-7',
      facturaNumber: factura || 'A-001',
      amount: numAmount,
      currency: 'GTQ',
      paymentMethod: 'Transferencia BI',
      receiptPhotoUrl: newReceiptUrl || undefined,
      receiptPhotoDate: newReceiptDate || undefined,
      receiptCoords: newReceiptCoords || undefined,
      approvalStatus: 'Pendiente', // Step 1: Registered as Pending PM approval
      assignedApuId: assignedApuId || undefined,
      assignedApuDescription: selectedApu ? selectedApu.description : undefined,
      auditTrail: [
        {
          id: `aud-${Date.now()}-1`,
          action: 'CREADO',
          user: 'Residente de Obra',
          role: 'Ingeniero Residente',
          timestamp: nowStr,
          note: newReceiptUrl
            ? 'Comprobante físico capturado con cámara y validado con IA'
            : 'Registro manual de gasto en campo',
        },
        {
          id: `aud-${Date.now()}-2`,
          action: 'ENVIADO_A_REVISION',
          user: 'Residente de Obra',
          role: 'Ingeniero Residente',
          timestamp: nowStr,
          note: `Enviado al flujo de aprobación del Project Manager (Renglón APU: ${selectedApu?.code || 'General'})`,
        },
      ],
    };

    onAddExpense(ex);
    setIsOpenModal(false);
    setDesc('');
    setSupplier('');
    setNit('');
    setFactura('');
    setNewReceiptUrl(null);
    setNewReceiptDate(null);
    setNewReceiptCoords(null);
  };

  // Two-Step Approval Submit Handler
  const handleConfirmApproval = () => {
    if (!approvalModalExpense || !onUpdateExpense) return;

    const nowStr = new Date().toLocaleString('es-GT');
    const isApproving = approvalDecision === 'Aprobado';

    // If approving, verify if this approval causes an APU overrun
    if (isApproving && approvalModalExpense.assignedApuId) {
      const overrun = checkApuOverrun(
        approvalModalExpense.assignedApuId,
        approvalModalExpense.amount,
        approvalModalExpense.id
      );
      if (overrun) {
        setWarningToast({
          message: `¡Atención! Ha aprobado un gasto que supera el presupuesto del renglón ${overrun.apuCode} por Q${overrun.diff.toLocaleString('es-GT')}.`,
          diff: overrun.diff,
          apuCode: overrun.apuCode,
          budgetTotal: overrun.budgetTotal,
          spentTotal: overrun.projectedTotal,
        });
      }
    }

    const newAuditEntry: ExpenseAuditEntry = {
      id: `aud-${Date.now()}`,
      action: isApproving ? 'APROBADO' : approvalDecision === 'Rechazado' ? 'RECHAZADO' : 'REVERTIDO',
      user: pmName,
      role: 'Project Manager / Director de Obra',
      timestamp: nowStr,
      note: approvalNote.trim() || (isApproving ? 'Gasto aprobado contra presupuesto y renglón APU.' : 'Estado modificado por PM.'),
    };

    const updatedExpense: ExpenseRecord = {
      ...approvalModalExpense,
      approvalStatus: approvalDecision,
      approvedBy: isApproving ? pmName : undefined,
      approvedAt: isApproving ? nowStr : undefined,
      auditTrail: [...(approvalModalExpense.auditTrail || []), newAuditEntry],
    };

    onUpdateExpense(updatedExpense);
    setApprovalModalExpense(null);
    setApprovalNote('');
  };

  const handleDownloadReceipt = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Filter expenses based on active project and approval status
  const projectExpenses = expenses.filter((e) => e.projectId === activeProject.id);

  const filteredExpenses = projectExpenses.filter((ex) => {
    if (statusFilter === 'pendientes') return ex.approvalStatus === 'Pendiente' || !ex.approvalStatus;
    if (statusFilter === 'aprobados') return ex.approvalStatus === 'Aprobado';
    return true;
  });

  const pendingCount = projectExpenses.filter((e) => e.approvalStatus === 'Pendiente' || !e.approvalStatus).length;
  const approvedCount = projectExpenses.filter((e) => e.approvalStatus === 'Aprobado').length;
  const approvedTotal = projectExpenses
    .filter((e) => e.approvalStatus === 'Aprobado')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Warning Toast for APU Overrun */}
      {warningToast && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 shadow-lg flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-600 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-sm text-rose-950 flex items-center gap-2">
                Alerta de Sobrecosto Presupuestario en Renglón APU {warningToast.apuCode}
                <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-bold text-[10px]">
                  Exceso: Q{warningToast.diff.toLocaleString('es-GT')}
                </span>
              </h4>
              <p className="text-rose-800 leading-relaxed font-medium">{warningToast.message}</p>
              <div className="flex items-center gap-4 text-[11px] text-rose-700 pt-1">
                <span>Presupuesto Renglón: <strong>Q{warningToast.budgetTotal.toLocaleString('es-GT')}</strong></span>
                <span>Monto Proyectado: <strong>Q{warningToast.spentTotal.toLocaleString('es-GT')}</strong></span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setWarningToast(null)}
            className="p-1.5 text-rose-700 hover:text-rose-900 hover:bg-rose-100 rounded-lg transition"
            title="Cerrar advertencia"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Gastos, Facturas & Aprobación en 2 Pasos (PM)</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
              <Camera className="w-3 h-3 text-amber-600" /> Captura Cámara & OCR
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Control de egresos para {activeProject.name} con validación presupuestaria APU y pista de auditoría inalterable.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setNewReceiptUrl(null);
              setIsOpenModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Registrar Gasto / Factura
          </button>
        </div>
      </div>

      {/* Metrics & Two-Step Approval Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Ejecutado Aprobado
            </span>
            <p className="text-lg font-bold text-emerald-600 mt-0.5">{formatMoney(approvedTotal)}</p>
            <span className="text-[11px] text-slate-400">{approvedCount} facturas validadas por PM</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Pendientes de Revisión PM
            </span>
            <p className="text-lg font-bold text-amber-600 mt-0.5">{pendingCount} gastos</p>
            <span className="text-[11px] text-slate-400">Paso 1: Registrados en campo</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Control Presupuestario APU
            </span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">Visto Bueno PM</p>
            <span className="text-[11px] text-blue-600 font-medium">Auditoría con firma y fecha</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <History className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs for Approval Workflow */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              statusFilter === 'todos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({projectExpenses.length})
          </button>
          <button
            onClick={() => setStatusFilter('pendientes')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              statusFilter === 'pendientes'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pendientes de Aprobación PM ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('aprobados')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              statusFilter === 'aprobados'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Aprobados ({approvedCount})
          </button>
        </div>

        <span className="text-xs text-slate-500">
          Mostrando {filteredExpenses.length} de {projectExpenses.length} gastos
        </span>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Factura / Fecha</th>
                <th className="p-3.5">Categoría / Renglón APU</th>
                <th className="p-3.5">Proveedor & NIT</th>
                <th className="p-3.5">Descripción</th>
                <th className="p-3.5 text-center">Comprobante Físico</th>
                <th className="p-3.5 text-center">Estado (Paso 2)</th>
                <th className="p-3.5 text-right">Monto</th>
                <th className="p-3.5 text-center">Acciones PM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredExpenses.map((ex) => {
                const isApproved = ex.approvalStatus === 'Aprobado';
                const isPending = ex.approvalStatus === 'Pendiente' || !ex.approvalStatus;
                const isRejected = ex.approvalStatus === 'Rechazado';

                // Check if this expense belongs to an APU item that is over budget
                const assignedApu = budgetItems.find((b) => b.id === ex.assignedApuId);
                let apuOverrun = false;
                if (assignedApu) {
                  const totalSpentOnApu = projectExpenses
                    .filter((e) => e.assignedApuId === assignedApu.id)
                    .reduce((sum, e) => sum + e.amount, 0);
                  apuOverrun = totalSpentOnApu > assignedApu.totalPriceGTQ;
                }

                return (
                  <tr key={ex.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900">{ex.facturaNumber}</span>
                      <p className="text-[10px] text-slate-500">{ex.date}</p>
                    </td>

                    <td className="p-3.5 space-y-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 block w-fit">
                        {ex.category}
                      </span>
                      {assignedApu && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            apuOverrun
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                          title={assignedApu.description}
                        >
                          APU {assignedApu.code}
                          {apuOverrun && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className="font-semibold text-slate-900">{ex.supplier}</span>
                      <p className="text-[10px] text-slate-500">NIT: {ex.nitSupplier}</p>
                    </td>

                    <td className="p-3.5 max-w-xs">{ex.description}</td>

                    {/* Receipt column */}
                    <td className="p-3.5 text-center">
                      {ex.receiptPhotoUrl ? (
                        <button
                          type="button"
                          onClick={() => setViewingReceiptExpense(ex)}
                          className="group relative inline-flex items-center gap-2 p-1 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
                          title="Ver comprobante capturado"
                        >
                          <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-slate-300 shrink-0 bg-slate-900">
                            <img
                              src={ex.receiptPhotoUrl}
                              alt="Recibo"
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                              <Eye className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                          <div className="text-left pr-1 hidden sm:block">
                            <span className="text-[10px] font-bold text-slate-800 flex items-center gap-0.5">
                              <Receipt className="w-3 h-3 text-emerald-600" /> Ver
                            </span>
                          </div>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setCameraTargetExpenseId(ex.id);
                            setIsCameraOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-semibold transition cursor-pointer"
                          title="Tomar fotografía del recibo físico con la cámara del dispositivo"
                        >
                          <Camera className="w-3.5 h-3.5 text-amber-600" />
                          <span>Foto</span>
                        </button>
                      )}
                    </td>

                    {/* Two-step Approval Status Column */}
                    <td className="p-3.5 text-center">
                      {isApproved ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Aprobado (Paso 2)
                          </span>
                          {ex.approvedBy && (
                            <p className="text-[9px] text-slate-400 truncate max-w-[120px]">{ex.approvedBy}</p>
                          )}
                        </div>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <Ban className="w-3 h-3 text-rose-600" /> Rechazado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" /> Pendiente PM
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-right font-bold text-slate-900">{formatMoney(ex.amount)}</td>

                    {/* Project Manager Actions & Audit Trail */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setApprovalModalExpense(ex);
                            setApprovalDecision(isApproved ? 'Pendiente' : 'Aprobado');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shadow-xs cursor-pointer ${
                            isApproved
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                          title={isApproved ? 'Cambiar estado de aprobación' : 'Aprobar gasto como Project Manager'}
                        >
                          {isApproved ? 'Modificar' : 'Aprobar PM'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setViewingAuditExpense(ex)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Ver Pista de Auditoría Completa"
                        >
                          <FileSearch className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Two-Step Approval by Project Manager */}
      {approvalModalExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Aprobación de Gasto por Project Manager</h3>
              </div>
              <button
                onClick={() => setApprovalModalExpense(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Factura: {approvalModalExpense.facturaNumber}</span>
                  <span className="text-blue-600">{formatMoney(approvalModalExpense.amount)}</span>
                </div>
                <p className="text-slate-600">{approvalModalExpense.description}</p>
                <p className="text-slate-400 text-[11px]">Proveedor: {approvalModalExpense.supplier}</p>
                {approvalModalExpense.assignedApuId && (
                  <p className="text-[11px] font-mono text-slate-700 pt-1 border-t border-slate-200">
                    Renglón Asignado: {approvalModalExpense.assignedApuId}
                  </p>
                )}
              </div>

              {/* Approval Decision Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Decisión del Project Manager (Paso 2)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setApprovalDecision('Aprobado')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                      approvalDecision === 'Aprobado'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" /> Aprobar
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalDecision('Pendiente')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                      approvalDecision === 'Pendiente'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" /> Pendiente
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalDecision('Rechazado')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                      approvalDecision === 'Rechazado'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5" /> Rechazar
                  </button>
                </div>
              </div>

              {/* PM Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre del Project Manager / Auditor
                </label>
                <input
                  type="text"
                  value={pmName}
                  onChange={(e) => setPmName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              {/* Note / Audit Observation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Observación para Pista de Auditoría
                </label>
                <textarea
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="Ej. Verificado físicamente contra entrega en obra y renglón APU correspondiente."
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApprovalModalExpense(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApproval}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm cursor-pointer"
                >
                  Guardar Decisión en Auditoría
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Audit Trail Inspector */}
      {viewingAuditExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Pista de Auditoría del Gasto</h3>
                  <p className="text-[11px] text-slate-400">
                    Factura {viewingAuditExpense.facturaNumber} • {formatMoney(viewingAuditExpense.amount)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingAuditExpense(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <p><strong>Descripción:</strong> {viewingAuditExpense.description}</p>
                <p><strong>Proveedor:</strong> {viewingAuditExpense.supplier} (NIT: {viewingAuditExpense.nitSupplier})</p>
                <p><strong>Estado Actual:</strong> <span className="font-bold text-blue-600">{viewingAuditExpense.approvalStatus || 'Pendiente'}</span></p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Línea de Tiempo Inalterable
                </h4>

                {viewingAuditExpense.auditTrail && viewingAuditExpense.auditTrail.length > 0 ? (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {viewingAuditExpense.auditTrail.map((entry, idx) => (
                      <div key={entry.id || idx} className="relative text-xs space-y-1">
                        <div
                          className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 border-white ${
                            entry.action === 'APROBADO'
                              ? 'bg-emerald-500 ring-2 ring-emerald-100'
                              : entry.action === 'RECHAZADO'
                              ? 'bg-rose-500 ring-2 ring-rose-100'
                              : 'bg-blue-500 ring-2 ring-blue-100'
                          }`}
                        />
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">
                            {entry.action === 'CREADO' && 'Paso 1: Registro Inicial de Gasto'}
                            {entry.action === 'ENVIADO_A_REVISION' && 'Enviado a Revisión Presupuestaria'}
                            {entry.action === 'APROBADO' && 'Paso 2: Aprobado por Project Manager'}
                            {entry.action === 'RECHAZADO' && 'Rechazado por Project Manager'}
                            {entry.action === 'REVERTIDO' && 'Revertido a Pendiente'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{entry.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Por: <strong className="text-slate-800">{entry.user}</strong> ({entry.role})
                        </p>
                        {entry.note && (
                          <p className="text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200 italic">
                            "{entry.note}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No hay registros de auditoría anteriores.</p>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingAuditExpense(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar Nuevo Gasto con Cámara y APU Check */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Registrar Gasto o Factura FEL</h3>
              </div>
              <button
                onClick={() => setIsOpenModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría de Gasto</label>
                <select
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                >
                  <option value="Materiales (Cementos, Hierro)">Materiales (Cementos, Hierro)</option>
                  <option value="Mano de Obra">Mano de Obra</option>
                  <option value="Maquinaria y Combustible">Maquinaria y Combustible</option>
                  <option value="Permisos & Licencias">Permisos & Licencias</option>
                  <option value="Imprevistos">Imprevistos</option>
                </select>
              </div>

              {/* APU Budget Item Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Renglón de Presupuesto APU Asignado
                </label>
                <select
                  value={assignedApuId}
                  onChange={(e) => {
                    const newApuId = e.target.value;
                    setAssignedApuId(newApuId);
                    const overrun = checkApuOverrun(newApuId, Number(amount) || 0);
                    if (overrun) {
                      setWarningToast({
                        message: `¡Alerta de Presupuesto! El monto de Q${amount} excede el renglón ${overrun.apuCode}.`,
                        diff: overrun.diff,
                        apuCode: overrun.apuCode,
                        budgetTotal: overrun.budgetTotal,
                        spentTotal: overrun.projectedTotal,
                      });
                    }
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50 font-medium"
                >
                  {budgetItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} — {item.description} ({formatGTQ(item.totalPriceGTQ)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Proveedor</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Ej. Discosa S.A."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NIT Proveedor</label>
                  <input
                    type="text"
                    value={nit}
                    onChange={(e) => setNit(e.target.value)}
                    placeholder="Ej. 1294821-9"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. Factura FEL</label>
                  <input
                    type="text"
                    value={factura}
                    onChange={(e) => setFactura(e.target.value)}
                    placeholder="Ej. A-49201"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monto (GTQ)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      const newAmt = e.target.value;
                      setAmount(newAmt);
                      const overrun = checkApuOverrun(assignedApuId, Number(newAmt) || 0);
                      if (overrun) {
                        setWarningToast({
                          message: `¡Alerta! El monto ingresado (Q${newAmt}) excede el presupuesto del renglón ${overrun.apuCode}.`,
                          diff: overrun.diff,
                          apuCode: overrun.apuCode,
                          budgetTotal: overrun.budgetTotal,
                          spentTotal: overrun.projectedTotal,
                        });
                      }
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción del Insumo / Gasto</label>
                <input
                  type="text"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Ej. Compra de 250 bolsas de Cemento Progreso"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                  required
                />
              </div>

              {/* Receipt / Invoice Photo Capture Section */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-slate-800">Comprobante Físico / Factura</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Cámara del dispositivo</span>
                </div>

                {isAnalyzing && (
                  <div className="flex items-center gap-2 p-2 bg-amber-50 text-amber-900 text-xs rounded-lg border border-amber-200 animate-pulse">
                    <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-semibold">Analizando factura con Gemini AI (Extrayendo proveedor, NIT y monto)...</span>
                  </div>
                )}

                {newReceiptUrl ? (
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={newReceiptUrl}
                        alt="Preview recibo"
                        className="w-12 h-12 object-cover rounded-md border border-slate-300"
                      />
                      <div className="text-xs">
                        <p className="font-bold text-slate-900 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Recibo Escaneado
                        </p>
                        <p className="text-[10px] text-slate-400">{newReceiptDate}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setCameraTargetExpenseId(null);
                          setIsCameraOpen(true);
                        }}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition"
                        title="Tomar foto de nuevo"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewReceiptUrl(null);
                          setNewReceiptDate(null);
                          setNewReceiptCoords(null);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Quitar comprobante"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCameraTargetExpenseId(null);
                        setIsCameraOpen(true);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-amber-600" />
                      Tomar Foto del Recibo con Cámara
                    </button>
                    <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      Subir Archivo
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            const result = reader.result as string;
                            setNewReceiptUrl(result);
                            setNewReceiptDate(new Date().toLocaleString('es-GT'));
                            analyzeReceiptWithAI(result);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-700 bg-slate-100 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm cursor-pointer"
                >
                  Registrar Gasto (Paso 1)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => {
          setIsCameraOpen(false);
          setCameraTargetExpenseId(null);
        }}
        onCapture={handleCaptureReceipt}
        mode="receipt"
        title="Capturar Comprobante / Factura con Cámara"
        subtitle="Alinee la factura física o ticket de compra dentro del marco y presione capturar."
        defaultLocation={{ lat: activeProject.lat, lng: activeProject.lng }}
        projectCode={activeProject.code}
      />

      {/* Lightbox / Inspector for Physical Receipt */}
      {viewingReceiptExpense && viewingReceiptExpense.receiptPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-3.5 flex items-center justify-between text-white border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <div>
                  <h4 className="text-xs font-bold">
                    Factura FEL {viewingReceiptExpense.facturaNumber} • {viewingReceiptExpense.supplier}
                  </h4>
                  <p className="text-[10px] text-slate-400">NIT: {viewingReceiptExpense.nitSupplier}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleDownloadReceipt(
                      viewingReceiptExpense.receiptPhotoUrl!,
                      `Recibo-${viewingReceiptExpense.facturaNumber}.jpg`
                    )
                  }
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                  title="Descargar imagen"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewingReceiptExpense(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-black flex items-center justify-center p-2 overflow-auto flex-1 max-h-[65vh]">
              <img
                src={viewingReceiptExpense.receiptPhotoUrl}
                alt="Comprobante físico"
                className="max-h-[60vh] w-auto object-contain rounded-lg"
              />
            </div>

            <div className="p-3 bg-slate-950 text-xs text-slate-300 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-white">{viewingReceiptExpense.description}</span>
                <p className="text-[11px] text-slate-400">
                  Total: {formatMoney(viewingReceiptExpense.amount)} • {viewingReceiptExpense.category}
                </p>
              </div>
              <div className="text-right text-[11px] text-slate-400">
                {viewingReceiptExpense.receiptCoords && (
                  <p className="font-mono text-sky-400">
                    GPS: {viewingReceiptExpense.receiptCoords.lat.toFixed(4)}°N,{' '}
                    {viewingReceiptExpense.receiptCoords.lng.toFixed(4)}°W
                  </p>
                )}
                <p>{viewingReceiptExpense.receiptPhotoDate || viewingReceiptExpense.date}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
