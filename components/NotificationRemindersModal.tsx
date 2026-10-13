'use client';

import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Volume2,
  Trash2,
  Plus,
  X,
  Mail,
  Sliders,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { TaskReminder, ScheduleTask, Milestone, ReminderAdvanceOption } from '@/lib/types';
import { playNotificationChime } from '@/lib/notificationService';

interface NotificationRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: TaskReminder[];
  tasks: ScheduleTask[];
  milestones: Milestone[];
  onAddReminder: (reminder: TaskReminder) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onTriggerTestNotification: (title: string, message: string, type: 'urgent' | 'reminder') => void;
}

export const NotificationRemindersModal: React.FC<NotificationRemindersModalProps> = ({
  isOpen,
  onClose,
  reminders,
  tasks,
  milestones,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onTriggerTestNotification,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'workflow'>('list');

  // Form states for creating a new reminder
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || '');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');
  const [targetType, setTargetType] = useState<'task' | 'milestone'>('task');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('2025-05-20');
  const [targetTime, setTargetTime] = useState('08:00');
  const [advanceOption, setAdvanceOption] = useState<ReminderAdvanceOption>('1_day_before');
  const [priority, setPriority] = useState<'Alta' | 'Media' | 'Baja'>('Alta');
  const [channel, setChannel] = useState<'in_app' | 'sound' | 'email'>('in_app');
  const [followFlowRequirement, setFollowFlowRequirement] = useState(true);

  if (!isOpen) return null;

  const handleSelectTask = (tId: string) => {
    setSelectedTaskId(tId);
    const foundTask = tasks.find((t) => t.id === tId);
    if (foundTask) {
      setTitle(`Recordatorio: ${foundTask.name}`);
      setTargetDate(foundTask.endDate || '2025-05-20');
      setDescription(`Revisión programada de avance para la fase "${foundTask.phase}".`);
    }
  };

  const handleSelectMilestone = (mId: string) => {
    setSelectedMilestoneId(mId);
    const foundM = milestones.find((m) => m.id === mId);
    if (foundM) {
      setTitle(`Hito Clave: ${foundM.title}`);
      setTargetDate(foundM.targetDate || '2025-05-30');
      setDescription(foundM.description || `Entrega y verificación del hito en obra.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let targetName = 'General';
    if (targetType === 'task') {
      const t = tasks.find((item) => item.id === selectedTaskId);
      if (t) targetName = t.name;
    } else {
      const m = milestones.find((item) => item.id === selectedMilestoneId);
      if (m) targetName = m.title;
    }

    const newReminder: TaskReminder = {
      id: `rem-${Date.now()}`,
      projectId: tasks[0]?.projectId || 'p1',
      taskId: targetType === 'task' ? selectedTaskId : undefined,
      milestoneId: targetType === 'milestone' ? selectedMilestoneId : undefined,
      taskName: targetName,
      title: title.trim(),
      description: description.trim() || `Recordatorio programado para ${targetName}.`,
      targetDate,
      targetTime,
      advanceOption,
      priority,
      channel,
      enabled: true,
      createdAt: new Date().toISOString().split('T')[0],
      triggered: false,
      followFlowRequirement,
    };

    onAddReminder(newReminder);
    playNotificationChime(priority === 'Alta' ? 'urgent' : 'reminder');
    setActiveTab('list');

    // Reset form
    setTitle('');
    setDescription('');
  };

  const advanceLabels: Record<ReminderAdvanceOption, string> = {
    same_day: 'El mismo día (Hora fijada)',
    '1_day_before': '1 día antes (Recomendado)',
    '2_days_before': '2 días de anticipación',
    '3_days_before': '3 días antes (Logística)',
    '1_week_before': '1 semana antes (Suministros)',
    custom: 'Fecha exacta personalizada',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Sistema de Notificaciones & Recordatorios
              </h3>
              <p className="text-xs text-slate-400">
                Configura avisos personalizados por tarea o hito y asegura el flujo de obra
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-slate-950/40 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'list'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Recordatorios Configurados ({reminders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'create'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Configurar Nuevo Recordatorio</span>
          </button>

          <button
            onClick={() => setActiveTab('workflow')}
            className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'workflow'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Reglas de Flujo & Bloqueos</span>
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: LIST */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">
                  Avisos programados en el proyecto activo
                </span>
                <button
                  onClick={() => {
                    playNotificationChime('reminder');
                    onTriggerTestNotification(
                      'Prueba de Notificación ConstructERP',
                      'El timbre sonoro y la alerta en pantalla funcionan con éxito.',
                      'reminder'
                    );
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-300 hover:bg-sky-500/25 text-xs font-bold transition cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Probar Timbre Sonoro</span>
                </button>
              </div>

              {reminders.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                  <Bell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No hay recordatorios configurados</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Crea recordatorios para tus tareas de la ruta crítica o hitos de entrega.
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                  >
                    Crear Primer Recordatorio
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {reminders.map((rem) => {
                    return (
                      <div
                        key={rem.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          rem.enabled
                            ? 'bg-white/[0.04] border-white/10 hover:border-white/20'
                            : 'bg-white/[0.01] border-white/5 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                  rem.priority === 'Alta'
                                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                    : rem.priority === 'Media'
                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                    : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                }`}
                              >
                                {rem.priority} Prioridad
                              </span>

                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                                {advanceLabels[rem.advanceOption]}
                              </span>

                              {rem.channel === 'sound' && (
                                <span className="text-[10px] flex items-center gap-1 text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-400/20">
                                  <Volume2 className="w-3 h-3" /> Sonoro
                                </span>
                              )}

                              {rem.channel === 'email' && (
                                <span className="text-[10px] flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-400/20">
                                  <Mail className="w-3 h-3" /> Correo
                                </span>
                              )}

                              {rem.followFlowRequirement && (
                                <span className="text-[10px] flex items-center gap-1 text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-400/20">
                                  <ShieldAlert className="w-3 h-3" /> Flujo Guiado
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-bold text-white">{rem.title}</h4>
                            <p className="text-xs text-slate-400 line-clamp-2">{rem.description}</p>

                            <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                Meta: {rem.targetDate} {rem.targetTime ? `a las ${rem.targetTime}` : ''}
                              </span>
                              <span>•</span>
                              <span className="truncate max-w-[200px] text-slate-300 font-medium">
                                {rem.taskName}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                playNotificationChime(rem.priority === 'Alta' ? 'urgent' : 'reminder');
                                onTriggerTestNotification(
                                  rem.title,
                                  `${rem.description} (Simulación de aviso para ${rem.targetDate})`,
                                  rem.priority === 'Alta' ? 'urgent' : 'reminder'
                                );
                              }}
                              title="Probar sonido y aviso"
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-amber-300 border border-white/5 transition cursor-pointer"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => onToggleReminder(rem.id)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer border ${
                                rem.enabled
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30 hover:bg-emerald-500/30'
                                  : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
                              }`}
                            >
                              {rem.enabled ? 'Activo' : 'En pausa'}
                            </button>

                            <button
                              onClick={() => onDeleteReminder(rem.id)}
                              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/5 transition cursor-pointer"
                              title="Eliminar recordatorio"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREATE NEW */}
          {activeTab === 'create' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/10 space-y-3">
                <span className="text-xs font-mono uppercase text-amber-400 font-bold tracking-wider">
                  1. Selección del Objetivo
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetType('task');
                      handleSelectTask(tasks[0]?.id || '');
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      targetType === 'task'
                        ? 'bg-sky-500/20 border-sky-400/40 text-sky-300 shadow-sm'
                        : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Para Tarea de Obra</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetType('milestone');
                      if (milestones[0]) handleSelectMilestone(milestones[0].id);
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      targetType === 'milestone'
                        ? 'bg-amber-500/20 border-amber-400/40 text-amber-300 shadow-sm'
                        : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Para Hito de Entrega</span>
                  </button>
                </div>

                {targetType === 'task' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Seleccionar Tarea:
                    </label>
                    <select
                      value={selectedTaskId}
                      onChange={(e) => handleSelectTask(e.target.value)}
                      className="w-full bg-slate-800 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-400 transition"
                    >
                      {tasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          [{t.phase}] {t.name} ({t.progress}%)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Seleccionar Hito Clave:
                    </label>
                    <select
                      value={selectedMilestoneId}
                      onChange={(e) => handleSelectMilestone(e.target.value)}
                      className="w-full bg-slate-800 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 transition"
                    >
                      {milestones.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title} - Meta: {m.targetDate}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/10 space-y-3">
                <span className="text-xs font-mono uppercase text-sky-400 font-bold tracking-wider">
                  2. Mensaje y Contenido del Recordatorio
                </span>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Título del Aviso:
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Revisar encofrado y pruebas de resistencia"
                    className="w-full bg-slate-800 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Instrucciones / Procedimiento de Obra:
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detalles técnicos, responsable o verificación previa requerida..."
                    className="w-full bg-slate-800 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-400 transition resize-none"
                  />
                </div>
              </div>

              {/* Timing & Channel Options */}
              <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/10 space-y-3">
                <span className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider">
                  3. Programación y Canal
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Fecha Meta / Vencimiento:
                    </label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full bg-slate-800 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400 transition font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Hora de Alerta:
                    </label>
                    <input
                      type="time"
                      value={targetTime}
                      onChange={(e) => setTargetTime(e.target.value)}
                      className="w-full bg-slate-800 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400 transition font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Anticipación del Aviso:
                    </label>
                    <select
                      value={advanceOption}
                      onChange={(e) => setAdvanceOption(e.target.value as ReminderAdvanceOption)}
                      className="w-full bg-slate-800 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400 transition"
                    >
                      <option value="same_day">El mismo día</option>
                      <option value="1_day_before">1 día antes (Recomendado)</option>
                      <option value="2_days_before">2 días antes</option>
                      <option value="3_days_before">3 días antes</option>
                      <option value="1_week_before">1 semana antes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nivel de Prioridad:
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as 'Alta' | 'Media' | 'Baja')}
                      className="w-full bg-slate-800 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400 transition"
                    >
                      <option value="Alta">Alta (Crítica para la ruta)</option>
                      <option value="Media">Media (Procedimiento regular)</option>
                      <option value="Baja">Baja (Informativo)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Canal de Aviso:
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setChannel('in_app')}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          channel === 'in_app'
                            ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                            : 'bg-slate-800 border-white/10 text-slate-400'
                        }`}
                      >
                        En Pantalla
                      </button>
                      <button
                        type="button"
                        onClick={() => setChannel('sound')}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          channel === 'sound'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-slate-800 border-white/10 text-slate-400'
                        }`}
                      >
                        Timbre Sonoro
                      </button>
                      <button
                        type="button"
                        onClick={() => setChannel('email')}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          channel === 'email'
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-slate-800 border-white/10 text-slate-400'
                        }`}
                      >
                        Correo
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={followFlowRequirement}
                        onChange={(e) => setFollowFlowRequirement(e.target.checked)}
                        className="rounded border-white/20 bg-slate-800 text-sky-500 focus:ring-sky-400 w-4 h-4 cursor-pointer"
                      />
                      <span>Asegurar que siga el flujo constructivo indicado</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold tracking-wide uppercase transition cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  Guardar y Programar Recordatorio
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: WORKFLOW RULES */}
          {activeTab === 'workflow' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/20 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-bold text-amber-300">
                    Monitoreo del Flujo Constructivo Normativo
                  </p>
                  <p>
                    Para evitar patologías estructurales y retrasos, el sistema valida que las actividades precedentes
                    se encuentren finalizadas antes de dar paso a las fases subsiguientes.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">
                  Dependencias y Predecesoras de la Obra
                </span>

                {tasks.map((task, idx) => {
                  const hasPreds = task.predecessors && task.predecessors.length > 0;
                  const predTasks = hasPreds
                    ? tasks.filter((t) => task.predecessors.includes(t.id))
                    : [];
                  const isBlocked = predTasks.some((pt) => !pt.completed && pt.progress < 100);

                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 ${
                        isBlocked
                          ? 'bg-rose-500/5 border-rose-500/20'
                          : task.completed
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : 'bg-white/[0.03] border-white/10'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-500">Paso {idx + 1}</span>
                          <span className="text-xs font-bold text-white">{task.name}</span>
                          {task.completed && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Completada (100%)
                            </span>
                          )}
                          {isBlocked && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              En Espera de Flujo
                            </span>
                          )}
                        </div>

                        {hasPreds ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <span>Requiere finalizar:</span>
                            {predTasks.map((pt) => (
                              <span
                                key={pt.id}
                                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                  pt.completed
                                    ? 'bg-emerald-500/10 text-emerald-300'
                                    : 'bg-amber-500/15 text-amber-300'
                                }`}
                              >
                                {pt.name} ({pt.progress}%)
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500">Fase inicial (Sin predecesoras bloqueantes)</p>
                        )}
                      </div>

                      <div className="shrink-0">
                        {isBlocked ? (
                          <div className="flex items-center gap-1 text-xs text-rose-400 font-bold">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Bloqueada</span>
                          </div>
                        ) : task.completed ? (
                          <div className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Al día</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-sky-400 font-bold">
                            <ArrowRight className="w-4 h-4" />
                            <span>En Ejecución</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px]">
            {reminders.filter((r) => r.enabled).length} recordatorios activos monitoreando el flujo
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition cursor-pointer"
          >
            Cerrar Panel
          </button>
        </div>
      </div>
    </div>
  );
};
