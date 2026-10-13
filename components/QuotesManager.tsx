'use client';

import React, { useState } from 'react';
import { FileText, Plus, CheckCircle2, Printer, X } from 'lucide-react';
import { QuoteRecord, Project, CompanySettings, APUItem } from '@/lib/types';
import { formatGTQ, formatUSD } from '@/lib/data';

interface QuotesManagerProps {
  quotes: QuoteRecord[];
  projects: Project[];
  activeProjectId: string;
  onAddQuote: (quote: QuoteRecord) => void;
  currency: 'GTQ' | 'USD';
  company: CompanySettings;
  budgetItems: APUItem[];
}

export const QuotesManager: React.FC<QuotesManagerProps> = ({
  quotes,
  projects,
  activeProjectId,
  onAddQuote,
  currency,
  company,
}) => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientNit, setClientNit] = useState('');
  const [total, setTotal] = useState('150000');

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  const formatMoney = (amount: number) => {
    return currency === 'GTQ' ? formatGTQ(amount) : formatUSD(amount, company.exchangeRate);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    const q: QuoteRecord = {
      id: `q-${Date.now()}`,
      projectId: activeProject.id,
      clientName,
      clientNit: clientNit || 'CF',
      date: new Date().toISOString().split('T')[0],
      validUntil: '2025-06-30',
      items: [{ description: 'Presupuesto global de obra civil según planos', qty: 1, unit: 'Global', unitPriceGTQ: Number(total) || 150000 }],
      totalGTQ: Number(total) || 150000,
      status: 'Enviada',
    };

    onAddQuote(q);
    setIsOpenModal(false);
    setClientName('');
    setClientNit('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Cotizaciones a Clientes & Presupuestos Comerciales</h2>
          <p className="text-xs text-slate-500">Gestión de propuestas económicas para clientes institucionales y privados en Guatemala.</p>
        </div>
        <button
          onClick={() => setIsOpenModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Nueva Cotización
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quotes.map((quote) => (
          <div key={quote.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                  Cotización #{quote.id}
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1">{quote.clientName}</h3>
                <p className="text-xs text-slate-500">NIT: {quote.clientNit} • Fecha: {quote.date}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {quote.status}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              {quote.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-xs text-slate-700">
                  <span>{it.description} ({it.qty} {it.unit})</span>
                  <span className="font-semibold">{formatMoney(it.unitPriceGTQ * it.qty)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div>
                <p className="text-[10px] text-slate-400">Total Propuesta</p>
                <p className="text-base font-bold text-slate-900">{formatMoney(quote.totalGTQ)}</p>
              </div>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Crear Cotización para Cliente</h3>
              <button onClick={() => setIsOpenModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Cliente / Empresa</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej. Inmobiliaria El Bosque, S.A."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">NIT del Cliente</label>
                <input
                  type="text"
                  value={clientNit}
                  onChange={(e) => setClientNit(e.target.value)}
                  placeholder="Ej. 5920182-3"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Monto Total Cotización (GTQ)</label>
                <input
                  type="number"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                  required
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-700 bg-slate-100 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                  Emitir Cotización
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
