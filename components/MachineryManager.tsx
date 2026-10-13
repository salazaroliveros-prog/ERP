'use client';

import React, { useState } from 'react';
import { Truck, Plus, CheckCircle2 } from 'lucide-react';
import { Machinery, MachineryLog, Project, CompanySettings } from '@/lib/types';
import { formatGTQ, formatUSD } from '@/lib/data';

interface MachineryManagerProps {
  machinery: Machinery[];
  machineryLogs: MachineryLog[];
  projects: Project[];
  activeProjectId: string;
  onAddMachinery: (m: Machinery) => void;
  currency: 'GTQ' | 'USD';
  company: CompanySettings;
}

export const MachineryManager: React.FC<MachineryManagerProps> = ({
  machinery,
  machineryLogs,
  projects,
  activeProjectId,
  onAddMachinery,
  currency,
  company,
}) => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [name, setName] = useState('');
  const [model, setModel] = useState('2023');
  const [plate, setPlate] = useState('EQ-01');
  const [rate, setRate] = useState('300');

  const formatMoney = (amount: number) => {
    return currency === 'GTQ' ? formatGTQ(amount) : formatUSD(amount, company.exchangeRate);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const m: Machinery = {
      id: `m-${Date.now()}`,
      name,
      model,
      plateOrCode: plate,
      hourlyRateGTQ: Number(rate) || 250,
      currentHorometer: 100,
      status: 'Disponible',
    };

    onAddMachinery(m);
    setIsOpenModal(false);
    setName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Control de Maquinaria & Equipo Pesado</h2>
          <p className="text-xs text-slate-500">Horómetros, rendimiento y costos de maquinaria en proyectos de Guatemala.</p>
        </div>
        <button
          onClick={() => setIsOpenModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Registrar Maquinaria
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {machinery.map((mach) => (
          <div key={mach.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                {mach.plateOrCode}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {mach.status}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">{mach.name}</h3>
              <p className="text-xs text-slate-500">Modelo: {mach.model}</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-500">Tarifa / Hora:</span>
              <span className="font-bold text-slate-900">{formatMoney(mach.hourlyRateGTQ)}</span>
            </div>
          </div>
        ))}
      </div>

      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Registrar Nueva Maquinaria</h3>
              <button onClick={() => setIsOpenModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre / Equipo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Excavadora CAT 320"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Modelo / Año</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Código / Placa</label>
                  <input
                    type="text"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tarifa por Hora (GTQ)</label>
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
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
                  Guardar Maquinaria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
