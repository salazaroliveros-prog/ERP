'use client';

import React, { useState } from 'react';
import {
  Building2,
  LayoutDashboard,
  HardHat,
  Calculator,
  FileText,
  CalendarDays,
  Truck,
  Users,
  Banknote,
  Receipt,
  PieChart,
  Mail,
  Sparkles,
  Settings,
  ShieldCheck,
  Globe,
  LogOut,
  LogIn,
  Menu,
  X,
  ChevronDown,
  Bell,
  Sliders,
} from 'lucide-react';
import { CompanySettings, Project } from '@/lib/types';
import { User } from 'firebase/auth';

interface NavbarProps {
  company: CompanySettings;
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  currency: 'GTQ' | 'USD';
  onToggleCurrency: () => void;
  onOpenAiAssistant: () => void;
  onOpenBranding: () => void;
  onQuickAction: (action: string) => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  alertsCount: number;
  onOpenGmail: () => void;
  currentUser: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isMobileSidebarOpen?: boolean;
  onToggleMobileSidebar?: () => void;
  onOpenNotifications?: () => void;
  remindersCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  company,
  projects,
  activeProjectId,
  onSelectProject,
  activeTab,
  onSelectTab,
  currency,
  onToggleCurrency,
  onOpenAiAssistant,
  onOpenBranding,
  currentUser,
  onSignIn,
  onSignOut,
  isMobileSidebarOpen,
  onToggleMobileSidebar,
  onOpenNotifications,
  remindersCount = 0,
}) => {
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  const tabs = [
    { id: 'dashboard', label: 'Tablero', icon: LayoutDashboard },
    { id: 'proyectos', label: 'Proyectos & Firmas', icon: HardHat, badge: 'Firma' },
    { id: 'apu_presupuestos', label: 'Presupuestos APU', icon: Calculator },
    { id: 'cotizaciones', label: 'Cotizaciones', icon: FileText },
    { id: 'cronograma_gantt', label: 'Seguimiento & Hitos', icon: CalendarDays, badge: 'Avance' },
    { id: 'maquinaria', label: 'Maquinaria', icon: Truck },
    { id: 'personal', label: 'Personal & IGSS', icon: Users },
    { id: 'planillas', label: 'Planillas Guate', icon: Banknote },
    { id: 'gastos', label: 'Gastos & Facturas', icon: Receipt },
    { id: 'reportes', label: 'Reportes Finales', icon: PieChart },
    { id: 'gmail', label: 'Correo & Avisos', icon: Mail },
  ];

  const currentTabName = tabs.find((t) => t.id === activeTab)?.label || 'Tablero';

  return (
    <>
      {/* ================= FIXED GLASS SIDEBAR (Desktop) ================= */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[280px] z-50 flex-col bg-slate-950/60 backdrop-blur-xl border-r border-white/10 p-6 overflow-y-auto select-none">
        {/* Brand Header */}
        <div className="pb-6 border-b border-white/10 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500 flex items-center justify-center shadow-[0_8px_24px_rgba(56,189,248,0.4)]">
            <Building2 className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white">ConstructERP</h1>
              <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded">
                Guatemala
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1 truncate">
              {company.commercialName || 'Volcanes Proyectos & Ingeniería'}
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white/[0.08] text-sky-400 border border-white/15 shadow-[inset_0_0_12px_rgba(56,189,248,0.3)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span className="truncate">{tab.label}</span>
                </div>
                {tab.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onOpenAiAssistant}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-sky-500/20 to-indigo-500/20 border border-sky-400/30 hover:border-sky-400/60 text-sky-300 text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Gemini IA Asistente</span>
            </button>
            <button
              onClick={onOpenBranding}
              className="ml-2 p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border border-white/10 transition cursor-pointer"
              title="Configuración de Empresa"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#4ade80]"></span>
              SAT & IGSS 2025
            </span>
            <span className="text-amber-400 font-bold">Q 7.80/USD</span>
          </div>
        </div>
      </aside>

      {/* ================= MOBILE DRAWER SIDEBAR ================= */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={onToggleMobileSidebar}
          />
          <aside className="relative w-72 max-w-[85vw] bg-slate-950/95 backdrop-blur-2xl border-r border-white/15 p-6 flex flex-col z-50 h-full overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-md">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white leading-tight">ConstructERP</h2>
                  <span className="font-mono text-[9px] uppercase text-amber-400 font-bold">Guate Glass</span>
                </div>
              </div>
              <button
                onClick={onToggleMobileSidebar}
                className="p-1.5 rounded-lg bg-white/10 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onSelectTab(tab.id);
                      if (onToggleMobileSidebar) onToggleMobileSidebar();
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                      isActive
                        ? 'bg-white/[0.1] text-sky-400 border border-white/20 shadow-[inset_0_0_10px_rgba(56,189,248,0.3)]'
                        : 'text-slate-300 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* ================= GLASS TOP NAV BAR ================= */}
      <header className="sticky top-0 z-40 bg-slate-950/40 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 lg:px-8 py-3 lg:ml-[280px]">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Mobile menu toggle & View Meta */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 cursor-pointer"
              title="Abrir Menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex flex-col">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                VISTA DE {currentTabName.toUpperCase()} / {currency === 'GTQ' ? 'Q (Quetzales)' : '$ (USD)'}
              </span>
              <span className="text-xs font-bold text-white hidden sm:block">
                {activeProject ? `${activeProject.code} - ${activeProject.name}` : 'ConstructERP Guatemala'}
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Project Dropdown Selector */}
            <div className="relative">
              <button
                onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-slate-200 transition cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span className="max-w-[110px] sm:max-w-[160px] truncate">{activeProject?.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isProjectDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-white/15 shadow-2xl p-2 z-50 space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-white/10">
                    Cambiar Proyecto Activo
                  </div>
                  {projects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => {
                        onSelectProject(proj.id);
                        setIsProjectDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                        proj.id === activeProjectId
                          ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-400/30'
                          : 'text-slate-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="truncate">
                        <span className="font-mono text-[10px] text-amber-400 mr-1.5">{proj.code}</span>
                        <span className="truncate">{proj.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono ml-2">{proj.progressPercent}%</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell Button */}
            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="relative inline-flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.06] hover:bg-amber-500/20 border border-white/10 hover:border-amber-400/30 text-amber-300 transition cursor-pointer"
                title="Notificaciones personalizables y recordatorios de obra"
              >
                <Bell className="w-4 h-4" />
                {remindersCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-slate-950 shadow-[0_0_8px_rgba(245,158,11,0.6)]">
                    {remindersCount}
                  </span>
                )}
              </button>
            )}

            {/* Currency Pill Toggle */}
            <button
              onClick={onToggleCurrency}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs font-bold text-amber-400 transition cursor-pointer"
              title="Alternar entre Quetzales (GTQ) y Dólares (USD)"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{currency === 'GTQ' ? 'Q (GTQ)' : '$ (USD)'}</span>
            </button>

            {/* User Pill with Status Dot */}
            <div className="user-pill flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-xs text-slate-200">
              <span className="status-dot w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#4ade80]"></span>
              <span className="font-semibold truncate max-w-[140px] sm:max-w-[180px]">
                {currentUser?.email || 'salazaroliveros@gmail.com'}
              </span>
            </div>

            {/* Auth / Logout Button */}
            {currentUser ? (
              <button
                onClick={onSignOut}
                className="p-2 rounded-xl bg-white/[0.06] hover:bg-red-500/20 border border-white/10 text-slate-400 hover:text-red-300 transition cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onSignIn}
                className="p-2 rounded-xl bg-white/[0.06] hover:bg-sky-500/20 border border-white/10 text-slate-400 hover:text-sky-300 transition cursor-pointer"
                title="Iniciar Sesión con Google"
              >
                <LogIn className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

