import { Project, ExpenseRecord, Employee, ScheduleTask, Milestone, TaskReminder } from './types';

// Web Audio API synthesized sound generator - no external audio files required
export function playNotificationChime(type: 'reminder' | 'urgent' | 'success' | 'warning' = 'reminder') {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'reminder') {
      // Pleasant architectural 2-note chime: F#5 (739.99 Hz) -> A#5 (932.33 Hz)
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(739.99, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.18, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(932.33, now + 0.15);
      gain2.gain.setValueAtTime(0, now + 0.15);
      gain2.gain.linearRampToValueAtTime(0.22, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.7);
    } else if (type === 'urgent') {
      // High-priority dual pulse
      const now = ctx.currentTime;
      [0, 0.18].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now + offset);
        gain.gain.setValueAtTime(0.2, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.14);
      });
    } else if (type === 'success') {
      // Triad completion chime: C5 -> E5 -> G5
      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.18, now + i * 0.1 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.4);
      });
    } else if (type === 'warning') {
      // Minor alert warning
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(349.23, now + 0.35);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch {
    // Graceful fallback if audio is restricted by autoplay policies
  }
}

// Check flow requirements: Ensure predecessor tasks are finished before moving ahead
export function validateTaskWorkflowFlow(
  task: ScheduleTask,
  allTasks: ScheduleTask[]
): {
  isBlocked: boolean;
  blockingTasks: ScheduleTask[];
  message: string;
} {
  if (!task.predecessors || task.predecessors.length === 0) {
    return { isBlocked: false, blockingTasks: [], message: '' };
  }

  const blockingTasks = allTasks.filter(
    (t) => task.predecessors.includes(t.id) && (!t.completed || t.progress < 100)
  );

  if (blockingTasks.length > 0) {
    const names = blockingTasks.map((t) => `"${t.name}" (${t.progress}%)`).join(', ');
    return {
      isBlocked: true,
      blockingTasks,
      message: `Para respetar el flujo constructivo, debe completar primero las tareas precedentes: ${names}.`,
    };
  }

  return { isBlocked: false, blockingTasks: [], message: '' };
}

// Calculate true weighted overall progress towards the final goal
export function calculateOverallProjectProgress(
  tasks: ScheduleTask[],
  milestones: Milestone[]
): {
  tasksProgressPercent: number;
  milestonesProgressPercent: number;
  overallGoalPercent: number;
  completedTasksCount: number;
  totalTasksCount: number;
  completedMilestonesCount: number;
  totalMilestonesCount: number;
  criticalTasksCount: number;
} {
  if (tasks.length === 0) {
    return {
      tasksProgressPercent: 0,
      milestonesProgressPercent: 0,
      overallGoalPercent: 0,
      completedTasksCount: 0,
      totalTasksCount: 0,
      completedMilestonesCount: 0,
      totalMilestonesCount: 0,
      criticalTasksCount: 0,
    };
  }

  // Weight-based calculation if available, or equal split
  const totalWeight = tasks.reduce((acc, t) => acc + (t.weightPercent || 1), 0);
  const weightedTaskProgress =
    totalWeight > 0
      ? tasks.reduce((acc, t) => acc + (t.progress * (t.weightPercent || 1)) / totalWeight, 0)
      : tasks.reduce((acc, t) => acc + t.progress, 0) / tasks.length;

  const completedTasks = tasks.filter((t) => t.completed || t.progress >= 100).length;
  const criticalTasks = tasks.filter((t) => t.criticalPath).length;

  // Milestone calculation
  let milestoneScore = 0;
  if (milestones.length > 0) {
    const totalMilestoneWeight = milestones.reduce((acc, m) => acc + (m.weightPercent || 1), 0);
    milestoneScore =
      milestones.reduce((acc, m) => {
        const p = m.completed ? 100 : m.progress || 0;
        return acc + (p * (m.weightPercent || 1)) / (totalMilestoneWeight || 1);
      }, 0);
  } else {
    milestoneScore = weightedTaskProgress;
  }

  const completedMilestones = milestones.filter((m) => m.completed).length;

  // Combined score (60% task execution + 40% formal milestone deliveries)
  const overall = Math.round(weightedTaskProgress * 0.6 + milestoneScore * 0.4);

  return {
    tasksProgressPercent: Math.round(weightedTaskProgress),
    milestonesProgressPercent: Math.round(milestoneScore),
    overallGoalPercent: Math.min(100, Math.max(0, overall)),
    completedTasksCount: completedTasks,
    totalTasksCount: tasks.length,
    completedMilestonesCount: completedMilestones,
    totalMilestonesCount: milestones.length,
    criticalTasksCount: criticalTasks,
  };
}

// Evaluate active customizable reminders against current date
export function evaluateRemindersAndDeadlines(
  reminders: TaskReminder[],
  tasks: ScheduleTask[],
  milestones: Milestone[],
  currentDateStr: string = '2025-05-15'
) {
  const activeAlerts: Array<{
    id: string;
    reminderId?: string;
    title: string;
    message: string;
    type: 'warning' | 'info' | 'urgent';
    date: string;
    targetName: string;
    priority: 'Alta' | 'Media' | 'Baja';
    isFlowNotice?: boolean;
  }> = [];

  const currentParsed = new Date(currentDateStr).getTime();

  reminders.forEach((rem) => {
    if (!rem.enabled) return;

    // Check advance days
    let daysBefore = 0;
    if (rem.advanceOption === '1_day_before') daysBefore = 1;
    if (rem.advanceOption === '2_days_before') daysBefore = 2;
    if (rem.advanceOption === '3_days_before') daysBefore = 3;
    if (rem.advanceOption === '1_week_before') daysBefore = 7;

    const targetDateParsed = new Date(rem.targetDate).getTime();
    const triggerDateParsed = targetDateParsed - daysBefore * 24 * 60 * 60 * 1000;

    // If current date is at or past the trigger threshold
    const diffDays = Math.round((targetDateParsed - currentParsed) / (1000 * 60 * 60 * 24));

    if (currentParsed >= triggerDateParsed) {
      let timeNotice = '';
      if (diffDays < 0) {
        timeNotice = `(Venció hace ${Math.abs(diffDays)} días)`;
      } else if (diffDays === 0) {
        timeNotice = `(¡Vence hoy!)`;
      } else {
        timeNotice = `(Faltan ${diffDays} días)`;
      }

      activeAlerts.push({
        id: `alert-rem-${rem.id}`,
        reminderId: rem.id,
        title: `${rem.priority === 'Alta' ? '🔔 [Alta Prioridad] ' : '📌 Recordatorio: '}${rem.title}`,
        message: `${rem.description} ${timeNotice}`,
        type: rem.priority === 'Alta' ? 'urgent' : 'info',
        date: rem.targetDate,
        targetName: rem.taskName,
        priority: rem.priority,
        isFlowNotice: rem.followFlowRequirement,
      });
    }
  });

  // Also check tasks that are delayed or violating flow
  tasks.forEach((task) => {
    if (task.predecessors && task.predecessors.length > 0) {
      const flowCheck = validateTaskWorkflowFlow(task, tasks);
      if (flowCheck.isBlocked && task.progress > 0 && !task.completed) {
        activeAlerts.push({
          id: `flow-block-${task.id}`,
          title: `⚠️ Desvío del Flujo: ${task.name}`,
          message: flowCheck.message,
          type: 'warning',
          date: task.startDate,
          targetName: task.name,
          priority: 'Alta',
          isFlowNotice: true,
        });
      }
    }
  });

  return activeAlerts;
}

export interface BudgetMarginAlert {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  type: 'budget_80' | 'budget_100' | 'profit_margin_exceeded';
  severity: 'urgent' | 'warning';
  title: string;
  message: string;
  spentTotal: number;
  budgetTotal: number;
  percentageSpent: number;
  expectedMarginPercent: number;
  currentMarginPercent: number;
}

/**
 * Checks if a project has reached 80% of its assigned budget or exceeded the expected profit margin
 */
export function checkProjectBudgetAndMargin(
  project: Project,
  expectedMarginPercent: number = 15 // Default 15% Guatemalan CGC standard expected profit margin
): BudgetMarginAlert[] {
  const alerts: BudgetMarginAlert[] = [];
  const spent = project.spentTotal;
  const budget = project.budgetTotal;
  if (!budget || budget <= 0) return alerts;

  const pct = (spent / budget) * 100;
  // Threshold beyond which direct costs eat into the expected margin (e.g. 85% of budget when margin is 15%)
  const marginLimitThreshold = ((100 - expectedMarginPercent) / 100) * budget;
  const currentMargin = ((budget - spent) / budget) * 100;

  // 1. Alert when project reaches or exceeds 80% of its budget (up to 99.9%)
  if (pct >= 80 && pct < 100) {
    alerts.push({
      id: `alert-80-${project.id}`,
      projectId: project.id,
      projectCode: project.code,
      projectName: project.name,
      type: 'budget_80',
      severity: 'urgent',
      title: `⚠️ Alerta de Presupuesto (80% alcanzado): ${project.code}`,
      message: `El proyecto "${project.name}" ha alcanzado el ${pct.toFixed(1)}% de su presupuesto asignado (Q ${spent.toLocaleString('es-GT', { minimumFractionDigits: 2 })} ejecutados de Q ${budget.toLocaleString('es-GT', { minimumFractionDigits: 2 })}). Se recomienda revisar costos directos y compras pendientes.`,
      spentTotal: spent,
      budgetTotal: budget,
      percentageSpent: pct,
      expectedMarginPercent,
      currentMarginPercent: currentMargin,
    });
  } else if (pct >= 100) {
    // Alert when 100% is exceeded
    alerts.push({
      id: `alert-100-${project.id}`,
      projectId: project.id,
      projectCode: project.code,
      projectName: project.name,
      type: 'budget_100',
      severity: 'urgent',
      title: `🚨 Presupuesto Asignado Excedido: ${project.code}`,
      message: `El proyecto "${project.name}" ha sobrepasado el 100% de su presupuesto (${pct.toFixed(1)}%). Sobrecosto acumulado: Q ${(spent - budget).toLocaleString('es-GT', { minimumFractionDigits: 2 })}.`,
      spentTotal: spent,
      budgetTotal: budget,
      percentageSpent: pct,
      expectedMarginPercent,
      currentMarginPercent: currentMargin,
    });
  }

  // 2. Alert when project costs exceed the expected profit margin limit (e.g. costs > 85% erode the 15% profit margin)
  if (spent >= marginLimitThreshold) {
    alerts.push({
      id: `alert-margin-${project.id}`,
      projectId: project.id,
      projectCode: project.code,
      projectName: project.name,
      type: 'profit_margin_exceeded',
      severity: 'urgent',
      title: `📉 Margen de Utilidad Comprometido: ${project.code}`,
      message: `El proyecto "${project.name}" superó el umbral del costo directo previsto (${(100 - expectedMarginPercent)}%). Margen de utilidad restante: ${currentMargin.toFixed(1)}% (inferior a la meta fijada del ${expectedMarginPercent}%).`,
      spentTotal: spent,
      budgetTotal: budget,
      percentageSpent: pct,
      expectedMarginPercent,
      currentMarginPercent: currentMargin,
    });
  }

  return alerts;
}

export function checkAllProjectsBudgetAndMargin(projects: Project[]): BudgetMarginAlert[] {
  const allAlerts: BudgetMarginAlert[] = [];
  projects.forEach((p) => {
    const margin = p.expectedProfitMarginPercent || 15;
    const projectAlerts = checkProjectBudgetAndMargin(p, margin);
    allAlerts.push(...projectAlerts);
  });
  return allAlerts;
}

// Global System Evaluator
export function evaluateGlobalNotifications(
  projects: Project[],
  expenses: ExpenseRecord[],
  employees: Employee[],
  currency: 'GTQ' | 'USD',
  exchangeRate: number,
  reminders?: TaskReminder[],
  tasks?: ScheduleTask[],
  milestones?: Milestone[]
) {
  const alerts: Array<{
    id: string;
    title: string;
    message: string;
    type: 'warning' | 'info' | 'success';
    category?: string;
  }> = [];

  // Check budget overrun & margin erosion
  const budgetAlerts = checkAllProjectsBudgetAndMargin(projects);
  budgetAlerts.forEach((ba) => {
    alerts.push({
      id: ba.id,
      title: ba.title,
      message: ba.message,
      type: 'warning',
      category: ba.type === 'profit_margin_exceeded' ? 'Margen de Utilidad' : 'Presupuesto',
    });
  });

  // Evaluate custom reminders if provided
  if (reminders && tasks && milestones) {
    const reminderAlerts = evaluateRemindersAndDeadlines(reminders, tasks, milestones);
    reminderAlerts.forEach((ra) => {
      alerts.push({
        id: ra.id,
        title: ra.title,
        message: ra.message,
        type: ra.type === 'urgent' ? 'warning' : ra.type === 'warning' ? 'warning' : 'info',
        category: ra.isFlowNotice ? 'Flujo de Obra' : 'Recordatorio Hito',
      });
    });
  }

  return {
    alerts,
    totalAlertsCount: alerts.length,
  };
}

