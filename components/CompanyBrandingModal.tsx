'use client';

import React, { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { CompanySettings } from '@/lib/types';

interface CompanyBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanySettings;
  onUpdateCompany: (updated: CompanySettings) => void;
}

export const CompanyBrandingModal: React.FC<CompanyBrandingModalProps> = ({
  isOpen,
  onClose,
  company,
  onUpdateCompany,
}) => {
  const [legalName, setLegalName] = useState(company.legalName);
  const [commercialName, setCommercialName] = useState(company.commercialName);
  const [nit, setNit] = useState(company.nit);
  const [architectName, setArchitectName] = useState(company.architectName);
  const [architectColNumber, setArchitectColNumber] = useState(company.architectColNumber);
  const [exchangeRate, setExchangeRate] = useState(company.exchangeRate.toString());

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompany({
      ...company,
      legalName,
      commercialName,
      nit,
      architectName,
      architectColNumber,
      exchangeRate: Number(exchangeRate) || 7.82,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">Configuración de Empresa & NIT</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Razón Social</label>
            <input
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Comercial</label>
            <input
              type="text"
              value={commercialName}
              onChange={(e) => setCommercialName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">NIT Empresa</label>
              <input
                type="text"
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Cambio (Q/$)</label>
              <input
                type="number"
                step="0.01"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Arquitecto / Ing. Residente</label>
              <input
                type="text"
                value={architectName}
                onChange={(e) => setArchitectName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Colegiado CIG</label>
              <input
                type="text"
                value={architectColNumber}
                onChange={(e) => setArchitectColNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-slate-700 bg-slate-100 hover:bg-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
