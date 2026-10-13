'use client';

import React, { useState } from 'react';
import {
  Banknote,
  Printer,
  Download,
  FileText,
  Building,
  ShieldCheck,
  Award,
  Calendar,
  Layers,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Scale,
} from 'lucide-react';
import { Employee, CompanySettings, AttendanceRecord } from '@/lib/types';
import { formatGTQ } from '@/lib/data';
import { GuatemalanPayrollValidator } from './GuatemalanPayrollValidator';

interface GuatemalanPayrollProps {
  employees: Employee[];
  company: CompanySettings;
  attendance?: AttendanceRecord[];
  onUpdateEmployees?: (updated: Employee[]) => void;
}

export const GuatemalanPayroll: React.FC<GuatemalanPayrollProps> = ({
  employees,
  company,
  attendance = [],
  onUpdateEmployees,
}) => {
  const [viewMode, setViewMode] = useState<'validador' | 'summary_prestaciones' | 'regular'>('validador');
  const [selectedMonth, setSelectedMonth] = useState<string>('Septiembre 2026');

  // Statutory calculation helpers for Guatemalan Labor Code
  const getPayrollBreakdown = (emp: Employee) => {
    const baseMonthly = emp.dailyRateGTQ * 30;
    const bonoIncentivo = 250.0; // Dto. 37-2001 (Q250 fijos exentos de IGSS)
    const igssLaboral = baseMonthly * 0.0483; // 4.83% deducible del colaborador
    const igssPatronal = baseMonthly * 0.1067; // 10.67% IGSS empleador
    const irtraIntecap = baseMonthly * 0.02; // 1% IRTRA + 1% INTECAP
    const igssPatronalTotal = igssPatronal + irtraIntecap; // 12.67% cuota patronal total

    // Provisión mensual de prestaciones (8.33% cada una = 1 salario ordinario al año)
    const provisionBono14 = baseMonthly * 0.08333; // Dto. 42-92 (Julio)
    const provisionAguinaldo = baseMonthly * 0.08333; // Dto. 76-78 (Diciembre)
    const provisionIndemnizacion = baseMonthly * 0.08333; // Art. 82 Código de Trabajo
    const provisionVacaciones = baseMonthly * 0.04167; // 15 días hábiles

    const liquidoPagar = baseMonthly + bonoIncentivo - igssLaboral;
    const costoTotalPatron = baseMonthly + bonoIncentivo + igssPatronalTotal + provisionBono14 + provisionAguinaldo;

    return {
      baseMonthly,
      bonoIncentivo,
      igssLaboral,
      igssPatronal,
      irtraIntecap,
      igssPatronalTotal,
      provisionBono14,
      provisionAguinaldo,
      provisionIndemnizacion,
      provisionVacaciones,
      liquidoPagar,
      costoTotalPatron,
      anualBono14: baseMonthly,
      anualAguinaldo: baseMonthly,
    };
  };

  // Totals calculations
  const totals = employees.reduce(
    (acc, emp) => {
      const b = getPayrollBreakdown(emp);
      acc.base += b.baseMonthly;
      acc.bono += b.bonoIncentivo;
      acc.igssLab += b.igssLaboral;
      acc.igssPat += b.igssPatronalTotal;
      acc.bono14 += b.provisionBono14;
      acc.aguinaldo += b.provisionAguinaldo;
      acc.liquido += b.liquidoPagar;
      acc.costoPatronal += b.costoTotalPatron;
      return acc;
    },
    {
      base: 0,
      bono: 0,
      igssLab: 0,
      igssPat: 0,
      bono14: 0,
      aguinaldo: 0,
      liquido: 0,
      costoPatronal: 0,
    }
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'Colaborador',
      'Puesto',
      'Salario Base Mensual (GTQ)',
      'Bono Incentivo Dto. 37-2001 (GTQ)',
      'IGSS Laboral 4.83% (GTQ)',
      'Líquido a Recibir (GTQ)',
      'IGSS Patronal 12.67% (GTQ)',
      'Provisión Mensual Bono 14 Dto. 42-92 (GTQ)',
      'Provisión Mensual Aguinaldo Dto. 76-78 (GTQ)',
      'Bono 14 Anual Proyectado (GTQ)',
      'Aguinaldo Anual Proyectado (GTQ)',
      'Costo Total Empleador (GTQ)',
    ];

    const rows = employees.map((emp) => {
      const b = getPayrollBreakdown(emp);
      return [
        `"${emp.name}"`,
        `"${emp.role}"`,
        b.baseMonthly.toFixed(2),
        b.bonoIncentivo.toFixed(2),
        b.igssLaboral.toFixed(2),
        b.liquidoPagar.toFixed(2),
        b.igssPatronalTotal.toFixed(2),
        b.provisionBono14.toFixed(2),
        b.provisionAguinaldo.toFixed(2),
        b.anualBono14.toFixed(2),
        b.anualAguinaldo.toFixed(2),
        b.costoTotalPatron.toFixed(2),
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Planilla_IGSS_Bono14_Aguinaldo_${selectedMonth.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header with Print & Export Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <Banknote className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">Planilla & Prestaciones Laborales de Guatemala</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cálculo formal de retenciones IGSS Laboral (4.83%), cuotas patronales (12.67%), Bono 14 (Decreto 42-92) y Aguinaldo (Decreto 76-78).
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode('validador')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'validador'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Validador Legal IGSS / Prestaciones</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono">
                Auto
              </span>
            </button>
            <button
              onClick={() => setViewMode('summary_prestaciones')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'summary_prestaciones' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resumen Prestaciones (PDF)
            </button>
            <button
              onClick={() => setViewMode('regular')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'regular' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Planilla Líquida
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            title="Descargar tabla en formato CSV"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Conditionally Render Validator View */}
      {viewMode === 'validador' ? (
        <GuatemalanPayrollValidator
          employees={employees}
          company={company}
          attendance={attendance}
          onUpdateEmployees={onUpdateEmployees}
        />
      ) : (
        <>
          {/* Validation Status Banner when in table view */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between gap-3 text-xs text-blue-950">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Cálculos Supervisados por Ley Guatemalteca:</strong> IGSS Laboral 4.83% (Acuerdo 1118), IGSS Patronal 12.67%, Bono 14 (Decreto 42-92), Aguinaldo (Decreto 76-78) y Bonificación Q250 (Decreto 37-2001).
              </span>
            </div>
            <button
              onClick={() => setViewMode('validador')}
              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shrink-0 transition cursor-pointer"
            >
              Abrir Validador Legal
            </button>
          </div>

          {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Masa Salarial Base</p>
          <p className="text-lg font-extrabold text-slate-900 mt-1">{formatGTQ(totals.base)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{employees.length} colaboradores activos</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">IGSS Laboral (4.83%)</p>
          <p className="text-lg font-extrabold text-rose-600 mt-1">-{formatGTQ(totals.igssLab)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Deducción de planilla</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">IGSS Patronal (12.67%)</p>
          <p className="text-lg font-extrabold text-blue-600 mt-1">{formatGTQ(totals.igssPat)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Incluye 1% IRTRA + 1% INTECAP</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Provisión Bono 14 & Aguinaldo</p>
          <p className="text-lg font-extrabold text-amber-600 mt-1">{formatGTQ(totals.bono14 + totals.aguinaldo)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Q{formatGTQ(totals.bono14)} c/u por mes</p>
        </div>
      </div>

      {/* Printable Document Container (PDF Style) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs print:shadow-none print:border-none">
        {/* Printable Official Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/70 print:bg-white print:p-0 print:border-b-2 print:border-black">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600 print:text-black" />
                <h3 className="font-extrabold text-base text-slate-900 print:text-lg">
                  {company.commercialName || 'ConstructERP Guatemala, S.A.'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                NIT: {company.nit || '1049281-2'} • No. Patronal IGSS: 08-94102-3 • {company.address || 'Guatemala, C.A.'}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-block px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 font-bold text-xs print:border print:border-black print:bg-transparent print:text-black">
                RESUMEN OFICIAL DE PRESTACIONES DE LEY
              </span>
              <p className="text-xs text-slate-600 mt-1">Período de Nómina: <span className="font-bold">{selectedMonth}</span></p>
            </div>
          </div>
        </div>

        {/* View Mode 1: Summary View with IGSS, Bono 14 and Aguinaldo */}
        {viewMode === 'summary_prestaciones' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200 print:bg-slate-200 print:text-black">
                <tr>
                  <th className="p-3 border-r border-slate-200">Colaborador / Puesto</th>
                  <th className="p-3 text-right border-r border-slate-200">Sueldo Base (GTQ)</th>
                  <th className="p-3 text-right border-r border-slate-200 text-rose-700">IGSS Lab. (4.83%)</th>
                  <th className="p-3 text-right border-r border-slate-200 text-blue-700">IGSS Pat. (12.67%)</th>
                  <th className="p-3 text-right border-r border-slate-200 text-amber-800">
                    <div>Provisión Bono 14</div>
                    <div className="text-[10px] font-normal normal-case text-slate-500">Decreto 42-92 (8.33%)</div>
                  </th>
                  <th className="p-3 text-right border-r border-slate-200 text-amber-800">
                    <div>Provisión Aguinaldo</div>
                    <div className="text-[10px] font-normal normal-case text-slate-500">Decreto 76-78 (8.33%)</div>
                  </th>
                  <th className="p-3 text-right border-r border-slate-200 font-bold">Líquido a Recibir</th>
                  <th className="p-3 text-right font-bold text-slate-900">Costo Total Empleador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 print:divide-slate-300">
                {employees.map((emp) => {
                  const b = getPayrollBreakdown(emp);
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 border-r border-slate-200">
                        <div className="font-bold text-slate-900">{emp.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <span>{emp.role}</span>
                          {emp.igssAffiliated && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                              Afiliado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right border-r border-slate-200 font-mono font-medium">
                        {formatGTQ(b.baseMonthly)}
                      </td>
                      <td className="p-3 text-right border-r border-slate-200 font-mono font-medium text-rose-600">
                        -{formatGTQ(b.igssLaboral)}
                      </td>
                      <td className="p-3 text-right border-r border-slate-200 font-mono font-medium text-blue-600">
                        {formatGTQ(b.igssPatronalTotal)}
                      </td>
                      <td className="p-3 text-right border-r border-slate-200 font-mono font-medium text-amber-700 bg-amber-50/40">
                        {formatGTQ(b.provisionBono14)}
                      </td>
                      <td className="p-3 text-right border-r border-slate-200 font-mono font-medium text-amber-700 bg-amber-50/40">
                        {formatGTQ(b.provisionAguinaldo)}
                      </td>
                      <td className="p-3 text-right border-r border-slate-200 font-mono font-bold text-emerald-700">
                        {formatGTQ(b.liquidoPagar)}
                      </td>
                      <td className="p-3 text-right font-mono font-extrabold text-slate-900 bg-slate-50/50">
                        {formatGTQ(b.costoTotalPatron)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 text-slate-900 font-bold border-t-2 border-slate-300 print:bg-slate-200">
                <tr>
                  <td className="p-3 border-r border-slate-200 font-extrabold uppercase text-xs">
                    Totales Planilla ({employees.length})
                  </td>
                  <td className="p-3 text-right border-r border-slate-200 font-mono font-extrabold">
                    {formatGTQ(totals.base)}
                  </td>
                  <td className="p-3 text-right border-r border-slate-200 font-mono font-extrabold text-rose-700">
                    -{formatGTQ(totals.igssLab)}
                  </td>
                  <td className="p-3 text-right border-r border-slate-200 font-mono font-extrabold text-blue-700">
                    {formatGTQ(totals.igssPat)}
                  </td>
                  <td className="p-3 text-right border-r border-slate-200 font-mono font-extrabold text-amber-800">
                    {formatGTQ(totals.bono14)}
                  </td>
                  <td className="p-3 text-right border-r border-slate-200 font-mono font-extrabold text-amber-800">
                    {formatGTQ(totals.aguinaldo)}
                  </td>
                  <td className="p-3 text-right border-r border-slate-200 font-mono font-extrabold text-emerald-800">
                    {formatGTQ(totals.liquido)}
                  </td>
                  <td className="p-3 text-right font-mono font-black text-slate-900">
                    {formatGTQ(totals.costoPatronal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          /* View Mode 2: Regular Liquid Pay Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Colaborador</th>
                  <th className="p-3.5">Puesto</th>
                  <th className="p-3.5 text-right">Sueldo Base (Q)</th>
                  <th className="p-3.5 text-right">Bono Dto. 37-2001</th>
                  <th className="p-3.5 text-right">IGSS Laboral (4.83%)</th>
                  <th className="p-3.5 text-right">IGSS Patronal (12.67%)</th>
                  <th className="p-3.5 text-right">Líquido a Recibir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {employees.map((emp) => {
                  const b = getPayrollBreakdown(emp);
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-bold text-slate-900">{emp.name}</td>
                      <td className="p-3.5">{emp.role}</td>
                      <td className="p-3.5 text-right font-mono">{formatGTQ(b.baseMonthly)}</td>
                      <td className="p-3.5 text-right font-mono">{formatGTQ(b.bonoIncentivo)}</td>
                      <td className="p-3.5 text-right font-mono text-rose-600">-{formatGTQ(b.igssLaboral)}</td>
                      <td className="p-3.5 text-right font-mono text-blue-600">{formatGTQ(b.igssPatronalTotal)}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                        {formatGTQ(b.liquidoPagar)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Legal Footnotes & Signatures */}
        <div className="p-5 border-t border-slate-200 bg-slate-50/50 text-[11px] text-slate-600 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="font-bold text-slate-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Base Legal de Retenciones y Prestaciones:
              </p>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-slate-500">
                <li><strong>IGSS Laboral:</strong> 4.83% sobre salario ordinario devengado.</li>
                <li><strong>IGSS Patronal:</strong> 10.67% IGSS + 1.0% IRTRA + 1.0% INTECAP = 12.67% total.</li>
                <li><strong>Bono 14 (Decreto 42-92):</strong> 100% de salario mensual computable del 1 julio al 30 junio.</li>
                <li><strong>Aguinaldo (Decreto 76-78):</strong> 100% de salario mensual computable del 1 dic al 30 nov.</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-slate-800 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-600" /> Bonificación Incentivo:
              </p>
              <p className="mt-1 text-slate-500 leading-relaxed">
                De conformidad con el Decreto 37-2001 del Congreso de la República de Guatemala, se otorga a cada trabajador la bonificación mensual fija de Q250.00, la cual no está afecta al cálculo de IGSS, Bono 14 ni Aguinaldo.
              </p>
            </div>
          </div>

          {/* Signature Lines for Print */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center print:block">
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-slate-800">Elaborado por: Recursos Humanos / Nóminas</p>
              <p className="text-[10px] text-slate-500">{company.commercialName}</p>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-slate-800">Autorizado por: Gerente General / Representante Legal</p>
              <p className="text-[10px] text-slate-500">Firma y Sello</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )}
</div>
);
};
