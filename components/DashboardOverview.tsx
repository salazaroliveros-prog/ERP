'use client';

import React, { useMemo, useState } from 'react';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldCheck,
  CloudLightning,
  AlertTriangle,
  ArrowUpRight,
  HardHat,
  Users,
  CheckCircle2,
  MapPinned,
  NotebookPen,
  Shield,
  Bot,
  Calendar,
  BarChart3,
  Layers,
  Activity,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  FileText,
} from 'lucide-react';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Project, ExpenseRecord, AiRecommendation, CompanySettings, Employee, AttendanceRecord, ScheduleTask, APUItem } from '@/lib/types';
import { formatGTQ, formatUSD } from '@/lib/data';
import { D3BudgetUtilizationChart } from '@/components/D3BudgetUtilizationChart';

interface DashboardOverviewProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  expenses: ExpenseRecord[];
  aiRecommendations: AiRecommendation[];
  currency: 'GTQ' | 'USD';
  company: CompanySettings;
  onNavigateTab: (tab: string) => void;
  onTriggerAiWeather: () => void;
  onTriggerAiAudit: () => void;
  employees: Employee[];
  attendance: AttendanceRecord[];
  tasks: ScheduleTask[];
  apuItems: APUItem[];
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  expenses,
  aiRecommendations,
  currency,
  company,
  onNavigateTab,
  onTriggerAiWeather,
  onTriggerAiAudit,
  employees,
  attendance,
  tasks,
  apuItems,
}) => {
  const [expenditureViewMode, setExpenditureViewMode] = useState<'projects' | 'categories'>('projects');
  const activeProject = projects.find((p) => p.id === activeProjectId) || (projects.length > 0 ? projects[0] : undefined);

  const formatMoney = (amount: number) => {
    return currency === 'GTQ' ? formatGTQ(amount) : formatUSD(amount, company.exchangeRate);
  };

  const dashboardSummary = useMemo(() => {
    const totalBudget = projects.reduce((acc, p) => acc + p.budgetTotal, 0);
    const totalSpent = projects.reduce((acc, p) => acc + p.spentTotal, 0);
    const today = new Date().toISOString().split('T')[0];
    const totalWorkersToday = attendance.filter((a) => a.date === today && a.status === 'Presente').length;

    return {
      totalBudget,
      totalSpent,
      totalWorkersToday,
      executionRate: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
    };
  }, [projects, attendance]);

  const { totalBudget, totalSpent, totalWorkersToday } = dashboardSummary;

  const chartData = [
    { mes: 'Ene', inversion: 1200000, presupuesto: 1500000 },
    { mes: 'Feb', inversion: 2800000, presupuesto: 3100000 },
    { mes: 'Mar', inversion: 4500000, presupuesto: 4800000 },
    { mes: 'Abr', inversion: 6100000, presupuesto: 6500000 },
    { mes: 'May', inversion: 7800000, presupuesto: 8400000 },
    { mes: 'Jun', inversion: 9500000, presupuesto: 10200000 },
  ];

  // 6-Month Projected vs Real Monthly Spending State & Calibrated Data (Recharts LineChart)
  const [monthlyScope, setMonthlyScope] = useState<'consolidated' | 'active'>('consolidated');
  const [showTolerance, setShowTolerance] = useState<boolean>(true);
  const [selectedMonthDetail, setSelectedMonthDetail] = useState<string>('Mar 25');

  if (!activeProject) return null;

  const isConsolidated = monthlyScope === 'consolidated';
  const scaleRatio = isConsolidated ? 1 : Math.max(0.2, activeProject.budgetTotal / (totalBudget || 1));

  const monthlyDeviationData = [
    {
      mes: 'Dic 24',
      mesNombre: 'Diciembre 2024',
      proyectado: Math.round(1850000 * scaleRatio),
      real: Math.round(1805000 * scaleRatio),
      causa: 'Ahorro por compra anticipada en volumen de acero corrugado Grado 60 de Corporación Aceros de Guatemala.',
      accion: 'Mantener consolidación de pedidos mayores a 10 toneladas para congelar precio de plaza.',
    },
    {
      mes: 'Ene 25',
      mesNombre: 'Enero 2025',
      proyectado: Math.round(2100000 * scaleRatio),
      real: Math.round(2158000 * scaleRatio),
      causa: 'Ajuste anual al salario mínimo de ley en Guatemala (Dto. 37-2001) y cuotas patronales IGSS.',
      accion: 'Actualizar factores de prestaciones FAS en las matrices APU de mano de obra en el ERP.',
    },
    {
      mes: 'Feb 25',
      mesNombre: 'Febrero 2025',
      proyectado: Math.round(2400000 * scaleRatio),
      real: Math.round(2442000 * scaleRatio),
      causa: 'Alza temporal en fletes de agregados pétreos desde canteras locales por mantenimiento de tramo vial.',
      accion: 'Habilitar cantera secundaria certificada a menor distancia logística para mitigar recargos.',
    },
    {
      mes: 'Mar 25',
      mesNombre: 'Marzo 2025',
      proyectado: Math.round(2850000 * scaleRatio),
      real: Math.round(3115000 * scaleRatio),
      causa: 'SOBRECOSTO DETECTADO (+9.3%): Horas extras en fundición masiva nocturna de losas y bombeo continuo Cemex.',
      accion: 'ALERTA TEMPRANA: Rebalancear cuadrillas diurnas e instalar formaletas modulares para evitar recargo nocturno.',
    },
    {
      mes: 'Abr 25',
      mesNombre: 'Abril 2025',
      proyectado: Math.round(2900000 * scaleRatio),
      real: Math.round(3120000 * scaleRatio),
      causa: 'SOBRECOSTO (+7.6%): Inicio anticipado de lluvias; alquiler imprevisto de bombas de achique y lonas de protección.',
      accion: 'Estabilizar taludes y zanjas de desagüe perimetral de forma preventiva antes de cada colado.',
    },
    {
      mes: 'May 25',
      mesNombre: 'Mayo 2025 (En curso)',
      proyectado: Math.round(2750000 * scaleRatio),
      real: Math.round(2690000 * scaleRatio),
      causa: 'AHORRO (-2.2%): Retorno a la curva planificada gracias a medidas de contención y control de requisiciones.',
      accion: 'Mantener auditoría semanal de vales de bodega de materiales y control de mermas.',
    },
  ].map((item) => {
    const desviacion = item.real - item.proyectado;
    const desviacionPct = (desviacion / item.proyectado) * 100;
    const toleranciaMax = Math.round(item.proyectado * 1.05); // +5% límite de seguridad
    const toleranciaMin = Math.round(item.proyectado * 0.95); // -5%
    const estado = desviacionPct > 5 ? 'Sobrecosto Crítico' : desviacionPct > 0 ? 'Sobrecosto Leve' : 'En Presupuesto';
    return {
      ...item,
      desviacion,
      desviacionPct: Math.round(desviacionPct * 10) / 10,
      toleranciaMax,
      toleranciaMin,
      estado,
    };
  });

  const totalProyectado6M = monthlyDeviationData.reduce((acc, m) => acc + m.proyectado, 0);
  const totalReal6M = monthlyDeviationData.reduce((acc, m) => acc + m.real, 0);
  const desviacionNeta6M = totalReal6M - totalProyectado6M;
  const desviacionNetaPct6M = Math.round((desviacionNeta6M / (totalProyectado6M || 1)) * 100 * 10) / 10;
  const maxDeviationMonth = monthlyDeviationData.reduce((max, curr) => (curr.desviacionPct > max.desviacionPct ? curr : max), monthlyDeviationData[0]);
  const activeDetailData = monthlyDeviationData.find((m) => m.mes === selectedMonthDetail) || monthlyDeviationData[3];

  // Recharts Data: Visual Project Progress Bars
  const projectProgressChartData = projects.map((p) => ({
    id: p.id,
    name: p.code,
    fullName: p.name,
    avance: p.progressPercent,
    restante: Math.max(0, 100 - p.progressPercent),
    budget: p.budgetTotal,
    spent: p.spentTotal,
    status: p.status,
  }));

  // Recharts Data: Planned vs Actual Expenditure by Project
  const projectExpenditureData = projects.map((p) => ({
    name: p.code,
    fullName: p.name,
    planificado: p.budgetTotal,
    real: p.spentTotal,
    varianza: p.budgetTotal - p.spentTotal,
  }));

  // Recharts Data: Planned vs Actual Expenditure by Category (based on active project or total)
  const categoryExpenditureData = [
    {
      categoria: 'Materiales',
      planificado: Math.round(activeProject.budgetTotal * 0.45),
      real: expenses
        .filter((e) => e.projectId === activeProject.id && e.category.includes('Materiales'))
        .reduce((sum, e) => sum + e.amount, 76750),
    },
    {
      categoria: 'Mano de Obra',
      planificado: Math.round(activeProject.budgetTotal * 0.28),
      real: expenses
        .filter((e) => e.projectId === activeProject.id && e.category.includes('Mano de Obra'))
        .reduce((sum, e) => sum + e.amount, 84500),
    },
    {
      categoria: 'Maquinaria',
      planificado: Math.round(activeProject.budgetTotal * 0.15),
      real: expenses
        .filter((e) => e.projectId === activeProject.id && e.category.includes('Maquinaria'))
        .reduce((sum, e) => sum + e.amount, 35000),
    },
    {
      categoria: 'Permisos & Lic.',
      planificado: Math.round(activeProject.budgetTotal * 0.05),
      real: expenses
        .filter((e) => e.projectId === activeProject.id && e.category.includes('Permisos'))
        .reduce((sum, e) => sum + e.amount, 35000),
    },
    {
      categoria: 'Imprevistos',
      planificado: Math.round(activeProject.budgetTotal * 0.07),
      real: expenses
        .filter((e) => e.projectId === activeProject.id && e.category.includes('Imprevistos'))
        .reduce((sum, e) => sum + e.amount, 12000),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Company Branding Top Banner */}
      <div className="glass-panel p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border border-white/10 bg-gradient-to-r from-slate-900/90 via-slate-950/90 to-slate-900/90 shadow-xl">
        <div className="flex items-center gap-3.5 min-w-0">
          {company.logoUrl ? (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 p-1.5 border border-white/20 shadow-md flex items-center justify-center overflow-hidden shrink-0">
              {/* eslint-disable-next-js-next-image */}
              <img
                src={company.logoUrl}
                alt={company.commercialName || 'Logo Empresa'}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center shadow-md shrink-0">
              <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-extrabold text-white tracking-tight truncate">
                {company.headerTitle || company.commercialName || company.legalName || 'ConstructERP Guatemala'}
              </h1>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                NIT: {company.nit}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-snug">
              {company.commercialName !== company.headerTitle && company.commercialName ? `${company.commercialName} • ` : ''}
              {company.architectName ? `${company.architectName} (${company.architectColNumber})` : 'Panel de Control de Obras'}
              {company.address ? ` • ${company.address}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-center">
          <button
            onClick={() => onNavigateTab('reportes')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-slate-200 transition cursor-pointer flex-1 sm:flex-none"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Reportes</span>
          </button>
        </div>
      </div>

      {/* Variation 5: Top 4 Metric Stat Cards with Glassmorphism */}
      <div className="mobile-kpi-grid lg:grid-cols-4 gap-3 sm:gap-6">

        <div className="stat-card">
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400 block mb-2">
            Presupuesto Global
          </span>
          <div className="text-2xl font-extrabold tracking-tight text-white">{formatMoney(totalBudget)}</div>
          <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{projects.length} Obras activas</span>
          </div>
        </div>

        <div className="stat-card">
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400 block mb-2">
            Ejecución Total
          </span>
          <div className="text-2xl font-extrabold tracking-tight text-white">{formatMoney(totalSpent)}</div>
          <div className="text-xs text-sky-400 font-semibold mt-2">
            {((totalSpent / totalBudget) * 100).toFixed(1)}% del global
          </div>
        </div>

        <div className="stat-card">
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400 block mb-2">
            Personal Campo
          </span>
          <div className="text-2xl font-extrabold tracking-tight text-white">{totalWorkersToday} Obreros</div>
          <div className="text-xs text-amber-400 font-semibold mt-2">
            Asistencia al día
          </div>
        </div>

        <div className="stat-card">
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400 block mb-2">
            Firma Digital
          </span>
          <div className="text-2xl font-extrabold tracking-tight text-white">100% OK</div>
          <div className="text-xs text-sky-400 font-semibold mt-2">
            Capataces activos
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Visita', icon: MapPinned, color: 'sky', action: () => onNavigateTab('proyectos') },
          { label: 'Gasto', icon: NotebookPen, color: 'amber', action: () => onNavigateTab('gastos') },
          { label: 'Asistencia', icon: Shield, color: 'emerald', action: () => onNavigateTab('personal') },
          { label: 'IA', icon: Bot, color: 'violet', action: onTriggerAiWeather },
        ].map(({ label, icon: Icon, color, action }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            className={`mobile-action-card flex items-center justify-between gap-3 text-left transition hover:border-sky-400/30 hover:bg-slate-800/70 cursor-pointer ${
              color === 'sky' ? 'border-sky-400/20' :
              color === 'amber' ? 'border-amber-400/20' :
              color === 'emerald' ? 'border-emerald-400/20' : 'border-violet-400/20'
            }`}
          >
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-slate-400">Rápido</div>
              <div className="mt-1 text-sm font-bold text-white">{label}</div>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
              color === 'sky' ? 'bg-sky-500/15 border-sky-400/20 text-sky-300' :
              color === 'amber' ? 'bg-amber-500/15 border-amber-400/20 text-amber-300' :
              color === 'emerald' ? 'bg-emerald-500/15 border-emerald-400/20 text-emerald-300' : 'bg-violet-500/15 border-violet-400/20 text-violet-300'
            }`}>
              <Icon className="w-4 h-4" />
            </div>
          </button>
        ))}
      </div>

      {/* D3.js Real-Time Project Budget Utilization & Spend Visualization */}
      <D3BudgetUtilizationChart
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={onSelectProject}
        currency={currency}
        company={company}
      />

      {/* Variation 5: Content Split (Obras list & Curva S) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Projects List Panel (2 cols) */}
        <div className="lg:col-span-2 glass-panel space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h2 className="font-bold text-white text-base">Obras en Guatemala</h2>
            <button
              onClick={() => onNavigateTab('proyectos')}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
            >
              Ver todas <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {projects.map((proj) => {
              const isSelected = proj.id === activeProjectId;
              return (
                <div
                  key={proj.id}
                  onClick={() => onSelectProject(proj.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white/[0.08] border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                      : 'bg-white/[0.04] border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                        {proj.code}
                      </span>
                      <h4 className="font-bold text-sm text-white mt-1.5">{proj.name}</h4>
                      <p className="text-xs text-slate-400">{proj.municipality}, {proj.department}</p>
                    </div>
                    <span className="text-xs font-bold text-sky-300 bg-sky-400/20 px-2.5 py-1 rounded-xl border border-sky-400/30">
                      {proj.progressPercent}%
                    </span>
                  </div>

                  {/* Progress Bar with Glowing Gradient */}
                  <div className="w-full h-1.5 bg-white/10 rounded-full my-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full shadow-[0_0_12px_rgba(56,189,248,0.5)] transition-all duration-500"
                      style={{ width: `${proj.progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span>Avance: {proj.progressPercent}%</span>
                    <span className="text-slate-200 font-semibold">
                      {formatMoney(proj.spentTotal)} / {formatMoney(proj.budgetTotal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial S-Curve Chart (3 cols) */}
        <div className="lg:col-span-3 glass-panel space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div>
              <h2 className="font-bold text-white text-base">Curva S de Inversión (GTQ)</h2>
              <p className="text-xs text-slate-400">Comparativa de Inversión Real vs. Presupuesto Programado</p>
            </div>
            <button
              onClick={onTriggerAiAudit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-bold border border-sky-400/30 transition cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5" /> Auditoría IA Activa
            </button>
          </div>

          <div className="flex-1 w-full h-72 min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorPres" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(val) => `Q${(val / 1000000).toFixed(1)}M`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 text-white text-xs p-3 rounded-2xl shadow-xl space-y-1">
                          <p className="font-bold text-sky-400">{payload[0]?.payload?.mes}</p>
                          <p className="text-slate-200">Inversión: <span className="text-sky-300 font-bold">{formatMoney(Number(payload[0]?.value))}</span></p>
                          <p className="text-slate-200">Presupuesto: <span className="text-amber-300 font-bold">{formatMoney(Number(payload[1]?.value))}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="inversion" name="Inversión Real" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#colorInv)" />
                <Area type="monotone" dataKey="presupuesto" name="Presupuesto Base" stroke="#fbbf24" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorPres)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Variation 5: Firma Digital & Autorización Móvil Glass Panel */}
      <div className="glass-panel space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-400/20 text-sky-400 border border-sky-400/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-white text-base">Firma Digital & Autorización Móvil</h2>
          </div>
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 shadow-[0_0_8px_rgba(74,222,128,0.2)]">
            READY
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          Capataces autorizados con firma táctil sobre lienzo canvas HTML5, GPS y sello de tiempo digital para reportes diarios y bitácoras de obra.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            onClick={() => onNavigateTab('proyectos')}
            className="px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/15 text-xs font-bold transition cursor-pointer shadow-sm"
          >
            Bitácora de Campo
          </button>
          <button
            onClick={() => onNavigateTab('proyectos')}
            className="px-5 py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-extrabold tracking-wide uppercase transition cursor-pointer shadow-[0_0_16px_rgba(56,189,248,0.3)] hover:scale-[1.02]"
          >
            Validar Firmas Pendientes
          </button>
        </div>
      </div>

      {/* RECHARTS SECTION: Visual Project Progress Bar & Planned vs Actual Expenditure Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Visual Project Progress Bar Chart (Recharts) */}
        <div className="glass-panel space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-sky-400/20 text-sky-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Barra Visual de Avance Físico de Proyectos</h3>
                <p className="text-xs text-slate-400">Porcentaje de ejecución física real vs. meta de entrega (100%)</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/[0.08] text-slate-300 border border-white/10 font-mono">
              {projects.length} Obras
            </span>
          </div>

          <div className="w-full h-72 min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projectProgressChartData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 30, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255, 255, 255, 0.08)" />
                <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `${val}%`} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#cbd5e1"
                  fontSize={12}
                  fontWeight={600}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 text-white text-xs p-3 rounded-2xl shadow-xl space-y-1">
                          <p className="font-bold text-sm text-sky-400">{data.fullName}</p>
                          <p className="text-slate-300">Código: <span className="font-mono text-white">{data.name}</span></p>
                          <p className="text-slate-300">Avance Físico: <span className="font-bold text-emerald-400">{data.avance}%</span></p>
                          <p className="text-slate-300">Presupuesto: {formatMoney(data.budget)}</p>
                          <p className="text-slate-300">Ejecutado: {formatMoney(data.spent)}</p>
                          <p className="text-slate-400 text-[10px]">Estado: {data.status}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine x={100} stroke="#4ade80" strokeDasharray="4 4" label={{ value: '100% Meta', position: 'top', fill: '#4ade80', fontSize: 10 }} />
                <Bar
                  dataKey="avance"
                  name="Avance Físico (%)"
                  radius={[0, 8, 8, 0]}
                  barSize={24}
                  onClick={(data: any) => onSelectProject(data.id)}
                  className="cursor-pointer"
                >
                  {projectProgressChartData.map((entry, index) => {
                    const isSelected = entry.id === activeProjectId;
                    const fillColor = isSelected
                      ? '#38bdf8'
                      : entry.avance >= 70
                      ? '#4ade80'
                      : entry.avance >= 30
                      ? '#60a5fa'
                      : '#fbbf24';
                    return <Cell key={`cell-${index}`} fill={fillColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-[11px] text-slate-300">
            {projectProgressChartData.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className={`p-2.5 rounded-xl cursor-pointer transition border text-center ${
                  p.id === activeProjectId
                    ? 'bg-sky-500/20 border-sky-400/50 font-bold text-sky-300'
                    : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]'
                }`}
              >
                <div className="truncate font-semibold">{p.name}</div>
                <div className="text-sky-400 font-bold mt-0.5">{p.avance}% completado</div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Planned vs Actual Expenditure Chart (Recharts) */}
        <div className="glass-panel space-y-4 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-400/20 text-emerald-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Gasto Planificado vs. Real</h3>
                <p className="text-xs text-slate-400">Monitoreo de desvíos presupuestarios en obras y rubros</p>
              </div>
            </div>

            <div className="bg-white/[0.06] p-0.5 rounded-xl border border-white/10 flex items-center self-start sm:self-auto text-xs">
              <button
                onClick={() => setExpenditureViewMode('projects')}
                className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  expenditureViewMode === 'projects'
                    ? 'bg-sky-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Por Obra
              </button>
              <button
                onClick={() => setExpenditureViewMode('categories')}
                className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  expenditureViewMode === 'categories'
                    ? 'bg-sky-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Por Rubro
              </button>
            </div>
          </div>

          <div className="w-full h-72 min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              {expenditureViewMode === 'projects' ? (
                <BarChart
                  data={projectExpenditureData}
                  margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `Q${(val / 1000000).toFixed(1)}M`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length >= 2) {
                        const plan = Number(payload[0].value);
                        const real = Number(payload[1].value);
                        const data = payload[0].payload;
                        const diff = plan - real;
                        return (
                          <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 text-white text-xs p-3 rounded-2xl shadow-xl space-y-1">
                            <p className="font-bold text-sm text-slate-100">{data.fullName}</p>
                            <p className="text-amber-400">Presupuesto Base: {formatMoney(plan)}</p>
                            <p className="text-sky-400">Gasto Ejecutado: {formatMoney(real)}</p>
                            <p className={diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              {diff >= 0 ? 'Saldo a Favor: ' : 'Sobrecosto: '}
                              {formatMoney(Math.abs(diff))}
                            </p>
                            <p className="text-slate-400 text-[10px]">Ejecución: {((real / plan) * 100).toFixed(1)}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: 11, paddingBottom: 8, color: '#cbd5e1' }}
                  />
                  <Bar
                    dataKey="planificado"
                    name="Presupuesto Planificado"
                    fill="#64748b"
                    radius={[6, 6, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="real"
                    name="Gasto Real Ejecutado"
                    fill="#38bdf8"
                    radius={[6, 6, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              ) : (
                <BarChart
                  data={categoryExpenditureData}
                  margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                  <XAxis dataKey="categoria" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `Q${(val / 1000).toFixed(0)}k`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length >= 2) {
                        const plan = Number(payload[0].value);
                        const real = Number(payload[1].value);
                        const diff = plan - real;
                        return (
                          <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 text-white text-xs p-3 rounded-2xl shadow-xl space-y-1">
                            <p className="font-bold text-sm text-slate-100">{payload[0].payload.categoria}</p>
                            <p className="text-amber-400">Planificado: {formatMoney(plan)}</p>
                            <p className="text-sky-400">Real Pagado: {formatMoney(real)}</p>
                            <p className={diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              {diff >= 0 ? 'Remanente: ' : 'Excedente: '}
                              {formatMoney(Math.abs(diff))}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: 11, paddingBottom: 8, color: '#cbd5e1' }}
                  />
                  <Bar
                    dataKey="planificado"
                    name="Planificado"
                    fill="#fbbf24"
                    radius={[6, 6, 0, 0]}
                    barSize={18}
                  />
                  <Bar
                    dataKey="real"
                    name="Real Ejecutado"
                    fill="#4ade80"
                    radius={[6, 6, 0, 0]}
                    barSize={18}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-white/[0.04] rounded-xl border border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Total Invertido en <strong className="text-white">{activeProject.name}</strong>:
            </span>
            <span className="font-bold text-sky-400">{formatMoney(activeProject.spentTotal)}</span>
          </div>
        </div>
      </div>

      {/* AI Recommendations & Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <CloudLightning className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-white">Asistente Climático & Ruta Crítica (IA)</h3>
            </div>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-400 border border-amber-400/30">
              Gemini 3.8
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Monitoreo en tiempo real de condiciones meteorológicas en Guatemala y simulación de impacto en el cronograma CPM y ruta crítica de la obra.
          </p>
          <button
            onClick={onTriggerAiWeather}
            className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer"
          >
            Simular Reprogramación por Lluvia
          </button>
        </div>

        <div className="glass-panel space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2 text-white">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base">Firma Digital & Autorización de Capataces</h3>
            </div>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-400 border border-emerald-400/30">
              Móvil Ready
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Los capataces pueden autorizar reportes de campo, bitácoras e ingresos de materiales directamente desde sus teléfonos móviles con firma táctil sobre lienzo, GPS y sello de tiempo.
          </p>
          <button
            onClick={() => onNavigateTab('proyectos')}
            className="w-full py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer"
          >
            Ir a Módulo de Visitas & Firmas Digitales
          </button>
        </div>
      </div>
    </div>
  );
};
