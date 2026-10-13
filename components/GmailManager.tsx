'use client';

import React from 'react';
import { Mail, Send } from 'lucide-react';
import { CompanySettings } from '@/lib/types';

interface GmailManagerProps {
  company: CompanySettings;
}

export const GmailManager: React.FC<GmailManagerProps> = ({ company }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Centro de Notificaciones & Correo Electrónico</h2>
          <p className="text-xs text-slate-500">Envío de reportes de avance y bitácoras firmadas por correo a inversionistas y clientes.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 max-w-2xl">
        <h3 className="font-bold text-sm text-slate-900">Enviar Reporte de Obra por Correo</h3>
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Para (Correo Destino)</label>
            <input type="email" placeholder="inversionistas@constructora.com" className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Asunto</label>
            <input type="text" defaultValue="Informe Quincenal de Avance y Bitácora Firmada - ConstructERP Guatemala" className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mensaje</label>
            <textarea rows={4} defaultValue="Estimados señores, adjuntamos el informe consolidado con las firmas digitales de los capataces de obra." className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50" />
          </div>
          <button onClick={() => alert('¡Correo y reporte enviado con éxito a través del servidor!')} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer">
            <Send className="w-4 h-4" /> Enviar Correo
          </button>
        </div>
      </div>
    </div>
  );
};
