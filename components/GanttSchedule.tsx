'use client';

import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sliders,
  Plus,
  Bell,
  Target,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Volume2,
  Calendar,
  Layers,
  Award,
  ChevronRight,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { ScheduleTask, Project, Milestone, TaskReminder } from '@/lib/types';
import { initialMilestones, initialTaskReminders } from '@/lib/data';
import {
  calculateOverallProjectProgress,
  validateTaskWorkflowFlow,
  playNotificationChime,
} from '@/lib/notificationService';

interface GanttScheduleProps {
  tasks: ScheduleTask[];
  projects: Project[];
  activeProjectId: string;
  onUpdateTasks?: (updatedTasks: ScheduleTask[]) => void;
  onUpdateProjectProgress?: (projectId: string, newProgress: number) => void;
  reminders?: TaskReminder[];
  milestones?: Milestone[];
  onUpdateMilestones?: (updatedMilestones: Milestone[]) => void;
  onAddReminder?: (reminder: TaskReminder) => void;
  onToggleReminder?: (id: string) => void;
  onDeleteReminder?: (id: string) => void;
  onOpenReminderModal?: (preselectedTaskId?: string) => void;
}

export const GanttSchedule: React.FC<GanttScheduleProps> = ({
  tasks,
  projects,
  activeProjectId,
  onUpdateTasks,
  onUpdateProjectProgress,
  reminders: propReminders,
  milestones: propMilestones,
  onUpdateMilestones,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onOpenReminderModal,
}) => {
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  // Local state fallbacks if parent does not pass full handlers
  const [localMilestones, setLocalMilestones] = useState<Milestone[]>(
    propMilestones && propMilestones.length > 0 ? propMilestones : initialMilestones
  );
  const [localReminders, setLocalReminders] = useState<TaskReminder[]>(
    propReminders && propReminders.length > 0 ? propReminders : initialTaskReminders
  );
  const [viewMode, setViewMode] = useState<'tasks' | 'milestones' | 'roadmap' | 'reminders'>('tasks');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed' | 'critical'>('all');
  const [searchFilter, setSearchFilter] = useState('');

  // New task modal state
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskPhase, setNewTaskPhase] = useState('Estructura');
  const [newTaskStart, setNewTaskStart] = useState('2025-05-20');
  const [newTaskEnd, setNewTaskEnd] = useState('2025-06-15');
  const [newTaskCritical, setNewTaskCritical] = useState(false);
  const [newTaskAssigned, setNewTaskAssigned] = useState('');
  const [newTaskPredecessor, setNewTaskPredecessor] = useState('');
  const [newTaskWeight, setNewTaskWeight] = useState(10);

  // Workflow violation banner
  const [flowWarningMessage, setFlowWarningMessage] = useState<string | null>(null);

  const currentMilestones = propMilestones && propMilestones.length > 0 ? propMilestones : localMilestones;
  const currentReminders = propReminders && propReminders.length > 0 ? propReminders : localReminders;

  // Filter tasks for active project
  const projectTasks = useMemo(() => {
    return tasks.filter((t) => t.projectId === activeProjectId || !t.projectId);
  }, [tasks, activeProjectId]);

  // Filter milestones for active project
  const projectMilestones = useMemo(() => {
    return currentMilestones.filter((m) => m.projectId === activeProjectId || !m.projectId);
  }, [currentMilestones, activeProjectId]);

  // Overall progress calculations
  const progressStats = useMemo(() => {
    return calculateOverallProjectProgress(projectTasks, projectMilestones);
  }, [projectTasks, projectMilestones]);

  // Update task progress and automatically sync project overall completion
  const handleUpdateTaskProgress = (taskId: string, newProgress: number) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const isCompleted = newProgress >= 100;
        return {
          ...t,
          progress: newProgress,
          completed: isCompleted,
          completedAt: isCompleted ? new Date().toISOString().split('T')[0] : undefined,
        };
      }
      return t;
    });

    if (onUpdateTasks) {
      onUpdateTasks(updated);
    }

    // Play chimes based on completion
    if (newProgress === 100) {
      playNotificationChime('success');
    }

    // Recalculate and notify project progress
    const newStats = calculateOverallProjectProgress(
      updated.filter((t) => t.projectId === activeProjectId || !t.projectId),
      projectMilestones
    );
    if (onUpdateProjectProgress) {
      onUpdateProjectProgress(activeProjectId, newStats.overallGoalPercent);
    }
  };

  // 1-Click Toggle completion
  const handleToggleTaskCompleted = (taskId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    // Check flow violation if attempting to complete without finishing predecessors
    if (!targetTask.completed) {
      const flowCheck = validateTaskWorkflowFlow(targetTask, projectTasks);
      if (flowCheck.isBlocked) {
        setFlowWarningMessage(flowCheck.message);
        playNotificationChime('warning');
        setTimeout(() => setFlowWarningMessage(null), 7000);
      }
    }

    const nextCompleted = !targetTask.completed;
    handleUpdateTaskProgress(taskId, nextCompleted ? 100 : 0);
  };

  // Toggle milestone completion
  const handleToggleMilestone = (milestoneId: string) => {
    const updated = currentMilestones.map((m) => {
      if (m.id === milestoneId) {
        const nextCompleted = !m.completed;
        return {
          ...m,
          completed: nextCompleted,
          progress: nextCompleted ? 100 : 0,
          completedAt: nextCompleted ? new Date().toISOString().split('T')[0] : undefined,
        };
      }
      return m;
    });

    if (onUpdateMilestones) {
      onUpdateMilestones(updated);
    } else {
      setLocalMilestones(updated);
    }

    playNotificationChime('success');

    // Recalculate
    const newStats = calculateOverallProjectProgress(projectTasks, updated);
    if (onUpdateProjectProgress) {
      onUpdateProjectProgress(activeProjectId, newStats.overallGoalPercent);
    }
  };

  // Add new task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    const newTask: ScheduleTask = {
      id: `task-${Date.now()}`,
      projectId: activeProjectId,
      name: newTaskName.trim(),
      phase: newTaskPhase,
      startDate: newTaskStart,
      endDate: newTaskEnd,
      progress: 0,
      criticalPath: newTaskCritical,
      predecessors: newTaskPredecessor ? [newTaskPredecessor] : [],
      completed: false,
      assignedTo: newTaskAssigned.trim() || 'Ingeniero Residente',
      weightPercent: Number(newTaskWeight) || 10,
    };

    const updated = [...tasks, newTask];
    if (onUpdateTasks) {
      onUpdateTasks(updated);
    }

    playNotificationChime('reminder');
    setIsNewTaskModalOpen(false);
    setNewTaskName('');
    setNewTaskAssigned('');
  };

  // Filter tasks based on view filters
  const filteredTasks = useMemo(() => {
    return projectTasks.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        t.phase.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (t.assignedTo && t.assignedTo.toLowerCase().includes(searchFilter.toLowerCase()));

      if (!matchSearch) return false;

      if (statusFilter === 'in_progress') return t.progress > 0 && t.progress < 100;
      if (statusFilter === 'completed') return t.completed || t.progress >= 100;
      if (statusFilter === 'critical') return t.criticalPath;
      return true;
    });
  }, [projectTasks, searchFilter, statusFilter]);

  // Phase breakdown for progress cards
  const phaseProgress = useMemo(() => {
    const phases = ['Preliminares', 'Cimentación', 'Estructura', 'Mampostería', 'Instalaciones', 'Acabados & Entrega'];
    return phases.map((phase) => {
      const phaseTasks = projectTasks.filter((t) => t.phase.toLowerCase().includes(phase.toLowerCase().split(' ')[0]));
      if (phaseTasks.length === 0) return { phase, progress: 0, count: 0, completed: 0 };
      const avg = Math.round(phaseTasks.reduce((acc, t) => acc + t.progress, 0) / phaseTasks.length);
      const completedCount = phaseTasks.filter((t) => t.completed || t.progress >= 100).length;
      return { phase, progress: avg, count: phaseTasks.length, completed: completedCount };
    });
  }, [projectTasks]);

  return (
    <div className="space-y-6">
      {/* FLOW VIOLATION WARNING BANNER */}
      {flowWarningMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider font-mono">
                Alerta de Flujo Constructivo:
              </h4>
              <p className="text-xs mt-0.5">{flowWarningMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setFlowWarningMessage(null)}
            className="text-xs font-bold px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 cursor-pointer"
          >
            Entendido
          </button>
        </div>
      )}

      {/* =========================================================================
          HERO PROGRESS HUD: VISUALIZADOR DEL PROGRESO GENERAL HACIA EL OBJETIVO FINAL
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-white/15 p-6 backdrop-blur-xl shadow-2xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Left Title & Status */}
          <div className="space-y-2 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <span className="px-3 py-1 rounded-full bg-sky-400/15 border border-sky-400/30 text-[10px] font-mono uppercase tracking-widest text-sky-300 font-bold">
                Seguimiento de Progreso & Control de Hitos
              </span>
              <span className="font-mono text-xs text-amber-400 font-bold bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                {activeProject.code}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Progreso General hacia el Objetivo Final
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Monitoreo continuo de avance físico ponderado de la obra para <strong className="text-slate-200">{activeProject.name}</strong>,
              asegurando el cumplimiento de la ruta crítica y entrega llave en mano.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  <strong>{progressStats.completedTasksCount}</strong> de {progressStats.totalTasksCount} tareas completadas
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Target className="w-4 h-4 text-amber-400" />
                <span>
                  <strong>{progressStats.completedMilestonesCount}</strong> de {progressStats.totalMilestonesCount} hitos certificados
                </span>
              </div>
              <div className="flex items-center gap-2 text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>{progressStats.criticalTasksCount} en ruta crítica</span>
              </div>
            </div>
          </div>

          {/* Center Radial / Big Visual Progress Dial */}
          <div className="flex flex-col items-center justify-center p-4 rounded-3xl bg-white/[0.04] border border-white/10 shadow-inner w-full sm:w-80">
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* SVG Circular Progress Gauge */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  className="text-slate-800"
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke={
                    progressStats.overallGoalPercent >= 90
                      ? '#10b981'
                      : progressStats.overallGoalPercent >= 50
                      ? '#38bdf8'
                      : '#f59e0b'
                  }
                  strokeWidth="10"
                  strokeDasharray={2 * Math.PI * 50}
                  strokeDashoffset={2 * Math.PI * 50 * (1 - progressStats.overallGoalPercent / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black text-white font-mono tracking-tight">
                  {progressStats.overallGoalPercent}%
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Avance Global
                </span>
              </div>
            </div>

            <div className="mt-3 w-full text-center">
              <span className="text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Meta: Entrega Final ({activeProject.endDate || '2026-03-30'})
              </span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-col gap-2.5 w-full sm:w-auto shrink-0">
            <button
              onClick={() => {
                if (onOpenReminderModal) onOpenReminderModal();
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-bold text-xs transition cursor-pointer shadow-lg shadow-amber-500/10"
            >
              <Bell className="w-4 h-4" />
              <span>Configurar Recordatorios ({currentReminders.length})</span>
            </button>

            <button
              onClick={() => setIsNewTaskModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-sky-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Actividad</span>
            </button>

            <button
              onClick={() => {
                playNotificationChime('reminder');
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Verificar Timbre Sonoro</span>
            </button>
          </div>
        </div>

        {/* Phase mini progress bars */}
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {phaseProgress.map((pp) => (
            <div key={pp.phase} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300 truncate">{pp.phase}</span>
                <span className="font-mono text-amber-400 font-bold">{pp.progress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    pp.progress >= 100
                      ? 'bg-emerald-500'
                      : pp.progress > 0
                      ? 'bg-sky-400'
                      : 'bg-slate-700'
                  }`}
                  style={{ width: `${pp.progress}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {pp.completed}/{pp.count} finalizadas
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          VIEW SWITCHER & FILTERS
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setViewMode('tasks')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              viewMode === 'tasks'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Registro de Avance & Tareas ({projectTasks.length})</span>
          </button>

          <button
            onClick={() => setViewMode('milestones')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              viewMode === 'milestones'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Hitos hacia el Objetivo ({projectMilestones.length})</span>
          </button>

          <button
            onClick={() => setViewMode('reminders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              viewMode === 'reminders'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Recordatorios Configurados</span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar por tarea, fase o responsable..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full sm:w-64 bg-slate-800/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-sky-400 transition"
          />

          <div className="flex gap-1">
            <button
              onClick={() => setStatusFilter(statusFilter === 'all' ? 'in_progress' : 'all')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                statusFilter === 'in_progress'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-400/30'
                  : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
              }`}
              title="Filtrar en ejecución"
            >
              En Curso
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
              }`}
              title="Filtrar completadas"
            >
              Completadas
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === 'critical' ? 'all' : 'critical')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                statusFilter === 'critical'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
              }`}
              title="Filtrar ruta crítica"
            >
              Ruta Crítica
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: TASK LIST & INTERACTIVE PROGRESS CONTROLS
          ========================================================================= */}
      {viewMode === 'tasks' && (
        <div className="bg-slate-900/80 rounded-3xl border border-white/15 overflow-hidden shadow-xl backdrop-blur-xl">
          <div className="p-4 bg-slate-950/60 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              Listado de Actividades Programadas - Registra el Avance en Tiempo Real
            </span>
            <span className="text-xs text-slate-500">
              {filteredTasks.length} de {projectTasks.length} tareas
            </span>
          </div>

          <div className="divide-y divide-white/5">
            {filteredTasks.map((t) => {
              const isCompleted = t.completed || t.progress >= 100;
              const flowCheck = validateTaskWorkflowFlow(t, projectTasks);

              return (
                <div
                  key={t.id}
                  className={`p-5 transition-all flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5 hover:bg-white/[0.02] ${
                    isCompleted ? 'bg-emerald-950/10' : ''
                  }`}
                >
                  {/* Left: Task Details */}
                  <div className="space-y-2 flex-1 min-w-[280px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                        {t.phase}
                      </span>

                      {t.criticalPath && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          Ruta Crítica
                        </span>
                      )}

                      {t.weightPercent && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-amber-300 border border-white/10">
                          Ponderación: {t.weightPercent}%
                        </span>
                      )}

                      {flowCheck.isBlocked && !isCompleted && (
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-400/30 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          Predecesora Requerida
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Checkbox trigger button */}
                      <button
                        onClick={() => handleToggleTaskCompleted(t.id)}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center transition cursor-pointer shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                            : 'border-white/20 bg-slate-800 hover:border-sky-400 text-transparent'
                        }`}
                        title={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada al 100%'}
                      >
                        <CheckCircle2 className="w-4 h-4 fill-current stroke-slate-950" />
                      </button>

                      <h4
                        className={`font-bold text-sm tracking-tight transition ${
                          isCompleted ? 'line-through text-slate-400' : 'text-white'
                        }`}
                      >
                        {t.name}
                      </h4>
                    </div>

                    {t.notes && <p className="text-xs text-slate-400 line-clamp-1">{t.notes}</p>}

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {t.startDate} al {t.endDate}
                      </span>
                      {t.assignedTo && (
                        <span className="text-slate-300">
                          Responsable: <strong className="text-white">{t.assignedTo}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Interactive Slider & Quick Progress Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto shrink-0 bg-white/[0.02] p-3 rounded-2xl border border-white/5">
                    {/* Slider & Numeric Percent */}
                    <div className="w-full sm:w-56 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-mono">Avance:</span>
                        <div className="flex items-center gap-1 font-mono">
                          <span
                            className={`font-black text-sm ${
                              isCompleted
                                ? 'text-emerald-400'
                                : t.progress > 0
                                ? 'text-sky-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {t.progress}%
                          </span>
                        </div>
                      </div>

                      <div className="relative flex items-center">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={t.progress}
                          onChange={(e) => handleUpdateTaskProgress(t.id, Number(e.target.value))}
                          className="w-full h-2 rounded-full bg-slate-800 accent-sky-400 cursor-pointer"
                        />
                      </div>

                      {/* Micro-Adjustment Buttons */}
                      <div className="flex items-center justify-between gap-1 pt-0.5">
                        <button
                          onClick={() => handleUpdateTaskProgress(t.id, Math.max(0, t.progress - 10))}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 hover:bg-white/10 text-slate-400 transition cursor-pointer"
                        >
                          -10%
                        </button>
                        <button
                          onClick={() => handleUpdateTaskProgress(t.id, Math.min(100, t.progress + 10))}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 transition cursor-pointer font-bold"
                        >
                          +10%
                        </button>
                        <button
                          onClick={() => handleUpdateTaskProgress(t.id, Math.min(100, t.progress + 25))}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 hover:bg-white/10 text-sky-300 transition cursor-pointer font-bold"
                        >
                          +25%
                        </button>
                        <button
                          onClick={() => handleUpdateTaskProgress(t.id, 100)}
                          className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition cursor-pointer font-bold"
                        >
                          100%
                        </button>
                      </div>
                    </div>

                    {/* Action buttons: Mark completed & Add Reminder */}
                    <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleToggleTaskCompleted(t.id)}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30'
                            : 'bg-white/5 hover:bg-sky-500/20 text-slate-200 hover:text-sky-300 border border-white/10'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isCompleted ? 'Completada' : 'Finalizar'}</span>
                      </button>

                      <button
                        onClick={() => {
                          if (onOpenReminderModal) {
                            onOpenReminderModal(t.id);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/20 text-amber-300 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Programar recordatorio para esta tarea"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Recordatorio</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: MILESTONES ROADMAP TOWARDS FINAL GOAL
          ========================================================================= */}
      {viewMode === 'milestones' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  Secuencia de Hitos Críticos para Entrega de Obra
                </h3>
                <p className="text-xs text-slate-400">
                  Cada hito representa una entrega técnica auditada y aporta al porcentaje de entrega final.
                </p>
              </div>
            </div>

            <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/30">
              {progressStats.completedMilestonesCount} / {progressStats.totalMilestonesCount} Cumplidos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectMilestones.map((m, index) => {
              const isDone = m.completed || m.progress >= 100;
              return (
                <div
                  key={m.id}
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                    isDone
                      ? 'bg-emerald-950/20 border-emerald-500/30 shadow-lg shadow-emerald-950/20'
                      : m.progress > 0
                      ? 'bg-sky-950/20 border-sky-400/30 shadow-lg shadow-sky-950/20'
                      : 'bg-slate-900/80 border-white/10'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-amber-300 border border-white/10 font-bold">
                        Paso {index + 1} • {m.phase}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        Aporte: {m.weightPercent}%
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white tracking-tight">{m.title}</h4>
                    <p className="text-xs text-slate-300">{m.description}</p>

                    {m.deliverable && (
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-400">
                        <span className="font-semibold text-slate-200">Entregable Requerido:</span> {m.deliverable}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        Meta: {m.targetDate}
                      </span>
                      {m.completedAt && (
                        <span className="text-[10px] text-emerald-400 font-mono">
                          Certificado el {m.completedAt}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleMilestone(m.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isDone
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isDone ? 'Certificado' : 'Marcar Cumplido'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: CONFIGURED REMINDERS SUMMARY TAB
          ========================================================================= */}
      {viewMode === 'reminders' && (
        <div className="bg-slate-900/80 rounded-3xl border border-white/15 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Recordatorios Activos & Notificaciones Programadas
              </h3>
              <p className="text-xs text-slate-400">
                Avisos personalizados para tareas críticas e hitos importantes de la obra.
              </p>
            </div>

            <button
              onClick={() => {
                if (onOpenReminderModal) onOpenReminderModal();
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Recordatorio</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {currentReminders.map((rem) => (
              <div
                key={rem.id}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 hover:border-white/20 transition"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      rem.priority === 'Alta'
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {rem.priority} Prioridad
                  </span>
                  <span className="text-xs font-mono text-slate-400">{rem.targetDate}</span>
                </div>

                <h4 className="text-sm font-bold text-white">{rem.title}</h4>
                <p className="text-xs text-slate-400">{rem.description}</p>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-500">
                  <span>{rem.taskName}</span>
                  <button
                    onClick={() => {
                      playNotificationChime(rem.priority === 'Alta' ? 'urgent' : 'reminder');
                    }}
                    className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Probar Alerta
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CREAR NUEVA ACTIVIDAD DE CRONOGRAMA
          ========================================================================= */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-400" />
                <span>Agregar Nueva Tarea al Cronograma</span>
              </h3>
              <button
                onClick={() => setIsNewTaskModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre de la Actividad:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Fundición de losa de entrepiso nivel 3"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  className="w-full bg-slate-800 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Fase Constructiva:
                  </label>
                  <select
                    value={newTaskPhase}
                    onChange={(e) => setNewTaskPhase(e.target.value)}
                    className="w-full bg-slate-800 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-400"
                  >
                    <option value="Preliminares">Preliminares</option>
                    <option value="Cimentación">Cimentación</option>
                    <option value="Estructura">Estructura</option>
                    <option value="Mampostería">Mampostería</option>
                    <option value="Instalaciones">Instalaciones</option>
                    <option value="Acabados & Entrega">Acabados & Entrega</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ponderación en Meta (%):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newTaskWeight}
                    onChange={(e) => setNewTaskWeight(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Fecha de Inicio:
                  </label>
                  <input
                    type="date"
                    value={newTaskStart}
                    onChange={(e) => setNewTaskStart(e.target.value)}
                    className="w-full bg-slate-800 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Fecha de Finalización:
                  </label>
                  <input
                    type="date"
                    value={newTaskEnd}
                    onChange={(e) => setNewTaskEnd(e.target.value)}
                    className="w-full bg-slate-800 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Responsable Asignado:
                </label>
                <input
                  type="text"
                  placeholder="Ej. Don Mario Cifuentes / Cuadrilla Armadores"
                  value={newTaskAssigned}
                  onChange={(e) => setNewTaskAssigned(e.target.value)}
                  className="w-full bg-slate-800 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tarea Predecesora (Control de Flujo):
                </label>
                <select
                  value={newTaskPredecessor}
                  onChange={(e) => setNewTaskPredecessor(e.target.value)}
                  className="w-full bg-slate-800 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-400"
                >
                  <option value="">Ninguna (Fase independiente)</option>
                  {projectTasks.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.name} ({pt.progress}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="critPath"
                  checked={newTaskCritical}
                  onChange={(e) => setNewTaskCritical(e.target.checked)}
                  className="rounded border-white/20 bg-slate-800 text-rose-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="critPath" className="text-xs text-slate-200 cursor-pointer">
                  Pertenece a la Ruta Crítica (Cualquier atraso impacta la entrega final)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-lg"
                >
                  Crear Actividad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
