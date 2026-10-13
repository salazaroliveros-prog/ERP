'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  initialCompanySettings,
  initialProjects,
  initialFieldVisits,
  initialMachinery,
  initialMachineryLogs,
  initialEmployees,
  initialAttendanceRecords,
  initialExpenseRecords,
  initialQuoteRecords,
  initialAPUItems,
  initialScheduleTasks,
  initialAiRecommendations,
  initialMilestones,
  initialTaskReminders,
} from '@/lib/data';
import {
  CompanySettings,
  Project,
  FieldVisit,
  Machinery,
  MachineryLog,
  Employee,
  AttendanceRecord,
  ExpenseRecord,
  QuoteRecord,
  APUItem,
  ScheduleTask,
  AiRecommendation,
  Milestone,
  TaskReminder,
} from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { DashboardOverview } from '@/components/DashboardOverview';

const ProjectsAndVisits = lazy(() => import('@/components/ProjectsAndVisits').then((m) => ({ default: m.ProjectsAndVisits })));
const BudgetAndAPU = lazy(() => import('@/components/BudgetAndAPU').then((m) => ({ default: m.BudgetAndAPU })));
const QuotesManager = lazy(() => import('@/components/QuotesManager').then((m) => ({ default: m.QuotesManager })));
const GanttSchedule = lazy(() => import('@/components/GanttSchedule').then((m) => ({ default: m.GanttSchedule })));
const MachineryManager = lazy(() => import('@/components/MachineryManager').then((m) => ({ default: m.MachineryManager })));
const StaffAndAttendance = lazy(() => import('@/components/StaffAndAttendance').then((m) => ({ default: m.StaffAndAttendance })));
const GuatemalanPayroll = lazy(() => import('@/components/GuatemalanPayroll').then((m) => ({ default: m.GuatemalanPayroll })));
const ExpensesManager = lazy(() => import('@/components/ExpensesManager').then((m) => ({ default: m.ExpensesManager })));
const AdvancedReportsManager = lazy(() => import('@/components/AdvancedReportsManager').then((m) => ({ default: m.AdvancedReportsManager })));
const GmailManager = lazy(() => import('@/components/GmailManager').then((m) => ({ default: m.GmailManager })));
const AiAssistantModal = lazy(() => import('@/components/AiAssistantModal').then((m) => ({ default: m.AiAssistantModal })));
const CompanyBrandingModal = lazy(() => import('@/components/CompanyBrandingModal').then((m) => ({ default: m.CompanyBrandingModal })));
const NotificationRemindersModal = lazy(() => import('@/components/NotificationRemindersModal').then((m) => ({ default: m.NotificationRemindersModal })));
import {
  playNotificationChime,
  checkProjectBudgetAndMargin,
  checkAllProjectsBudgetAndMargin,
  BudgetMarginAlert,
} from '@/lib/notificationService';
import { initAuth, googleSignIn, googleSignOut } from '@/lib/googleCalendar';
import {
  saveProjectToFirestore,
  subscribeProjects,
  saveFieldVisitToFirestore,
  subscribeFieldVisits,
  saveExpenseToFirestore,
  subscribeExpenses,
  saveAttendanceToFirestore,
  subscribeAttendance,
  saveCompanySettingsToFirestore,
  subscribeCompanySettings,
} from '@/lib/firebaseService';
import { User } from 'firebase/auth';
import { Sparkles } from 'lucide-react';

export default function MainApp() {
  const [company, setCompany] = useState<CompanySettings>(initialCompanySettings);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState<string>('p1');
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currency, setCurrency] = useState<'GTQ' | 'USD'>('GTQ');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [aiPromptQuery, setAiPromptQuery] = useState<string>('');

  const [fieldVisits, setFieldVisits] = useState<FieldVisit[]>(initialFieldVisits);
  const [machinery, setMachinery] = useState<Machinery[]>(initialMachinery);
  const [machineryLogs, setMachineryLogs] = useState<MachineryLog[]>(initialMachineryLogs);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendanceRecords);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(initialExpenseRecords);
  const [quotes, setQuotes] = useState<QuoteRecord[]>(initialQuoteRecords);
  const [budgetItems, setBudgetItems] = useState<APUItem[]>(initialAPUItems);
  const [tasks, setTasks] = useState<ScheduleTask[]>(initialScheduleTasks);
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [reminders, setReminders] = useState<TaskReminder[]>(initialTaskReminders);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<{
    title: string;
    message: string;
    type: 'urgent' | 'reminder' | 'success';
  } | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<AiRecommendation[]>(initialAiRecommendations);

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => setCurrentUser(user),
      () => setCurrentUser(null)
    );
    return () => unsubscribe();
  }, []);

  // Listen to Firestore real-time collections when user is signed in
  useEffect(() => {
    if (!currentUser?.uid) return;
    const uid = currentUser.uid;

    const unsubProjects = subscribeProjects(uid, (remoteProjects) => {
      if (remoteProjects && remoteProjects.length > 0) {
        setProjects(remoteProjects);
      }
    });

    const unsubVisits = subscribeFieldVisits(uid, (remoteVisits) => {
      if (remoteVisits && remoteVisits.length > 0) {
        setFieldVisits(remoteVisits);
      }
    });

    const unsubExpenses = subscribeExpenses(uid, (remoteExpenses) => {
      if (remoteExpenses && remoteExpenses.length > 0) {
        setExpenses(remoteExpenses);
      }
    });

    const unsubAttendance = subscribeAttendance(uid, (remoteAttendance) => {
      if (remoteAttendance && remoteAttendance.length > 0) {
        setAttendance(remoteAttendance);
      }
    });

    const unsubCompany = subscribeCompanySettings(uid, (remoteCompany) => {
      if (remoteCompany) {
        setCompany(remoteCompany);
      }
    });

    return () => {
      unsubProjects();
      unsubVisits();
      unsubExpenses();
      unsubAttendance();
      unsubCompany();
    };
  }, [currentUser?.uid]);

  const handleSignIn = async () => {
    const res = await googleSignIn();
    if (res?.user) {
      setCurrentUser(res.user);
    }
  };

  const handleSignOut = async () => {
    await googleSignOut();
    setCurrentUser(null);
  };

  // Automated notification system for budget 80% and expected profit margin thresholds
  const notifiedBudgetAlertsRef = React.useRef<Set<string>>(new Set());

  const handleTriggerToast = (
    title: string,
    message: string,
    type: 'urgent' | 'reminder' | 'success' = 'reminder'
  ) => {
    setActiveToast({ title, message, type });
    playNotificationChime(type);
    setTimeout(() => {
      setActiveToast((current) => (current?.title === title ? null : current));
    }, 7000);
  };

  const evaluateAndTriggerBudgetMarginAlerts = (
    projectList: Project[],
    forceImmediate: boolean = false
  ): number => {
    let triggeredCount = 0;
    projectList.forEach((proj) => {
      const margin = proj.expectedProfitMarginPercent || 15;
      const alerts = checkProjectBudgetAndMargin(proj, margin);

      alerts.forEach((alert) => {
        const alertKey = `${alert.projectId}-${alert.type}`;
        if (forceImmediate || !notifiedBudgetAlertsRef.current.has(alertKey)) {
          notifiedBudgetAlertsRef.current.add(alertKey);
          handleTriggerToast(alert.title, alert.message, 'urgent');
          triggeredCount++;
        }
      });
    });
    return triggeredCount;
  };

  // Run initial automated budget and margin audit on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      evaluateAndTriggerBudgetMarginAlerts(projects, false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleAddProject = (p: Project) => {
    setProjects((prev) => [p, ...prev]);
    setActiveProjectId(p.id);
    if (currentUser?.uid) {
      saveProjectToFirestore(p, currentUser.uid).catch((err) => console.error(err));
    }
  };

  const handleAddFieldVisit = (fv: FieldVisit) => {
    setFieldVisits((prev) => [fv, ...prev]);
    if (currentUser?.uid) {
      saveFieldVisitToFirestore(fv, currentUser.uid).catch((err) => console.error(err));
    }
    const gpsInfo =
      fv.latitude && fv.longitude ? ` (GPS: ${fv.latitude.toFixed(5)}°, ${fv.longitude.toFixed(5)}°)` : '';
    handleTriggerToast(
      'Visita de Campo Registrada',
      `Bitácora guardada con coordenadas GPS exactas${gpsInfo} y geocerca validada en Firebase Firestore.`,
      'success'
    );
  };

  const handleUpdateFieldVisit = (fv: FieldVisit) => {
    setFieldVisits((prev) => prev.map((v) => (v.id === fv.id ? fv : v)));
    if (currentUser?.uid) {
      saveFieldVisitToFirestore(fv, currentUser.uid).catch((err) => console.error(err));
    }
    handleTriggerToast(
      'Bitácora Actualizada',
      `Visita de campo sincronizada en Firebase Firestore con coordenadas GPS verificadas.`,
      'success'
    );
  };

  const handleAddBudgetItem = (item: APUItem) => {
    setBudgetItems((prev) => [...prev, item]);
  };

  const handleUpdateBudgetItems = (items: APUItem[]) => {
    setBudgetItems(items);
  };

  const handleDeleteBudgetItem = (id: string) => {
    setBudgetItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddQuote = (q: QuoteRecord) => {
    setQuotes((prev) => [q, ...prev]);
  };

  const handleAddMachinery = (m: Machinery) => {
    setMachinery((prev) => [...prev, m]);
  };

  const handleAddEmployee = (emp: Employee) => {
    setEmployees((prev) => [...prev, emp]);
  };

  const handleAddAttendance = (att: AttendanceRecord) => {
    setAttendance((prev) => [att, ...prev]);
    if (currentUser?.uid) {
      saveAttendanceToFirestore(att, currentUser.uid).catch((err) => console.error(err));
    }
  };

  const handleDeleteAttendance = (id: string) => {
    setAttendance((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddExpense = (ex: ExpenseRecord) => {
    setExpenses((prev) => [ex, ...prev]);
    // Also update project spentTotal
    setProjects((prev) => {
      const updated = prev.map((p) =>
        p.id === ex.projectId ? { ...p, spentTotal: p.spentTotal + ex.amount } : p
      );
      // Immediately evaluate budget threshold and expected profit margin
      const targetProj = updated.find((p) => p.id === ex.projectId);
      if (targetProj) {
        const margin = targetProj.expectedProfitMarginPercent || 15;
        const alerts = checkProjectBudgetAndMargin(targetProj, margin);
        alerts.forEach((alert) => {
          handleTriggerToast(alert.title, alert.message, 'urgent');
        });
      }
      return updated;
    });

    if (currentUser?.uid) {
      saveExpenseToFirestore(ex, currentUser.uid).catch((err) => console.error(err));
    }
  };

  const handleUpdateExpense = (updatedEx: ExpenseRecord) => {
    setExpenses((prev) => prev.map((e) => (e.id === updatedEx.id ? updatedEx : e)));
    // Re-check budget alerts
    setProjects((prev) => {
      const targetProj = prev.find((p) => p.id === updatedEx.projectId);
      if (targetProj) {
        const margin = targetProj.expectedProfitMarginPercent || 15;
        const alerts = checkProjectBudgetAndMargin(targetProj, margin);
        alerts.forEach((alert) => {
          handleTriggerToast(alert.title, alert.message, 'urgent');
        });
      }
      return prev;
    });

    if (currentUser?.uid) {
      saveExpenseToFirestore(updatedEx, currentUser.uid).catch((err) => console.error(err));
    }
  };

  const handleUpdateCompany = (updatedCompany: CompanySettings) => {
    setCompany(updatedCompany);
    if (currentUser?.uid) {
      saveCompanySettingsToFirestore(updatedCompany, currentUser.uid).catch((err) => console.error(err));
    }
  };

  const handleUpdateTasks = (updatedTasks: ScheduleTask[]) => {
    setTasks(updatedTasks);
  };

  const handleUpdateProjectProgress = (projectId: string, progress: number) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, progressPercent: progress } : p))
    );
  };

  const handleUpdateMilestones = (updatedMilestones: Milestone[]) => {
    setMilestones(updatedMilestones);
  };

  const handleAddReminder = (reminder: TaskReminder) => {
    setReminders((prev) => [reminder, ...prev]);
    handleTriggerToast(
      'Recordatorio Programado',
      `Se configuró con éxito el aviso para "${reminder.title}".`,
      reminder.priority === 'Alta' ? 'urgent' : 'reminder'
    );
  };

  const handleToggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleDeleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const handleManualBudgetAudit = () => {
    const triggered = evaluateAndTriggerBudgetMarginAlerts(projects, true);
    if (triggered === 0) {
      handleTriggerToast(
        'Presupuestos y Márgenes Saludables',
        'Todos los proyectos se encuentran dentro del 80% y respetan el margen de utilidad esperado (15%).',
        'success'
      );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-ambient)] text-slate-100 flex flex-col font-sans selection:bg-sky-400 selection:text-slate-950">
      <Navbar
        company={company}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProjectId}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currency={currency}
        onToggleCurrency={() => setCurrency(currency === 'GTQ' ? 'USD' : 'GTQ')}
        onOpenAiAssistant={() => setIsAiModalOpen(true)}
        onOpenBranding={() => setIsBrandingModalOpen(true)}
        onQuickAction={(act) => {
          if (act === 'ai') setIsAiModalOpen(true);
        }}
        isFocusMode={false}
        onToggleFocusMode={() => {}}
        alertsCount={reminders.filter((r) => r.enabled).length}
        onOpenGmail={() => setActiveTab('gmail')}
        currentUser={currentUser}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onOpenNotifications={() => setIsReminderModalOpen(true)}
        remindersCount={reminders.filter((r) => r.enabled).length}
      />

      <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 lg:ml-[280px] max-w-full lg:max-w-[calc(100vw-280px)] overflow-x-hidden">
        {/* Variation 5: AI Assistant Prompt Bar */}
        <div className="ai-assistant-bar mb-6">
          <Sparkles className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] shrink-0" />
          <input
            type="text"
            value={aiPromptQuery}
            onChange={(e) => setAiPromptQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsAiModalOpen(true);
              }
            }}
            placeholder="Gemini IA: ¿Cuál es el impacto de la lluvia hoy en la ruta crítica?"
            className="bg-transparent border-none text-slate-100 placeholder:text-slate-400 text-xs sm:text-sm flex-1 outline-none font-sans"
          />
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="bg-slate-100 hover:bg-white text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition cursor-pointer shadow-md hover:scale-[1.02] shrink-0"
          >
            Analizar
          </button>
          <button
            type="button"
            onClick={handleManualBudgetAudit}
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wider transition cursor-pointer shadow-md shrink-0 flex items-center gap-1.5"
            title="Verificar si algún proyecto alcanzó el 80% del presupuesto o excedió el margen de utilidad esperado (15%)"
          >
            <span>Alerta 80% & Margen</span>
          </button>
        </div>

        <Suspense fallback={
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">Cargando módulo...</p>
          </div>
        }>
          {activeTab === 'dashboard' && (
            <DashboardOverview
              projects={projects}
              activeProjectId={activeProjectId}
              onSelectProject={setActiveProjectId}
              expenses={expenses}
              aiRecommendations={aiRecommendations}
              currency={currency}
              company={company}
              onNavigateTab={setActiveTab}
              onTriggerAiWeather={() => setIsAiModalOpen(true)}
              onTriggerAiAudit={() => setIsAiModalOpen(true)}
              employees={employees}
              attendance={attendance}
              tasks={tasks}
              apuItems={budgetItems}
            />
          )}

          {activeTab === 'proyectos' && (
            <ProjectsAndVisits
              projects={projects}
              activeProjectId={activeProjectId}
              onSelectProject={setActiveProjectId}
              onAddProject={handleAddProject}
              fieldVisits={fieldVisits}
              onAddFieldVisit={handleAddFieldVisit}
              onUpdateFieldVisit={handleUpdateFieldVisit}
              currency={currency}
              company={company}
              expenses={expenses}
              machineryLogs={machineryLogs}
              machinery={machinery}
              attendance={attendance}
            />
          )}

          {activeTab === 'apu_presupuestos' && (
            <BudgetAndAPU
              budgetItems={budgetItems}
              activeProjectId={activeProjectId}
              projects={projects}
              onAddBudgetItem={handleAddBudgetItem}
              onUpdateBudgetItems={handleUpdateBudgetItems}
              onDeleteBudgetItem={handleDeleteBudgetItem}
              currency={currency}
              company={company}
              expenses={expenses}
              quotes={quotes}
              tasks={tasks}
            />
          )}

          {activeTab === 'cotizaciones' && (
            <QuotesManager
              quotes={quotes}
              projects={projects}
              activeProjectId={activeProjectId}
              onAddQuote={handleAddQuote}
              currency={currency}
              company={company}
              budgetItems={budgetItems}
            />
          )}

          {activeTab === 'cronograma_gantt' && (
            <GanttSchedule
              tasks={tasks}
              projects={projects}
              activeProjectId={activeProjectId}
              onUpdateTasks={handleUpdateTasks}
              onUpdateProjectProgress={handleUpdateProjectProgress}
              reminders={reminders}
              milestones={milestones}
              onUpdateMilestones={handleUpdateMilestones}
              onAddReminder={handleAddReminder}
              onToggleReminder={handleToggleReminder}
              onDeleteReminder={handleDeleteReminder}
              onOpenReminderModal={() => setIsReminderModalOpen(true)}
            />
          )}

          {activeTab === 'maquinaria' && (
            <MachineryManager
              machinery={machinery}
              machineryLogs={machineryLogs}
              projects={projects}
              activeProjectId={activeProjectId}
              onAddMachinery={handleAddMachinery}
              currency={currency}
              company={company}
            />
          )}

          {activeTab === 'personal' && (
            <StaffAndAttendance
              employees={employees}
              attendance={attendance}
              projects={projects}
              activeProjectId={activeProjectId}
              onAddEmployee={handleAddEmployee}
              onAddAttendance={handleAddAttendance}
              onDeleteAttendance={handleDeleteAttendance}
            />
          )}

          {activeTab === 'planillas' && (
            <GuatemalanPayroll
              employees={employees}
              company={company}
              attendance={attendance}
              onUpdateEmployees={setEmployees}
            />
          )}

          {activeTab === 'gastos' && (
            <ExpensesManager
              expenses={expenses}
              projects={projects}
              activeProjectId={activeProjectId}
              onAddExpense={handleAddExpense}
              onUpdateExpense={handleUpdateExpense}
              currency={currency}
              company={company}
              budgetItems={budgetItems}
            />
          )}

          {activeTab === 'reportes' && (
            <AdvancedReportsManager
              projects={projects}
              activeProjectId={activeProjectId}
              company={company}
              expenses={expenses}
              fieldVisits={fieldVisits}
              currency={currency}
              attendance={attendance}
              employees={employees}
            />
          )}

          {activeTab === 'gmail' && <GmailManager company={company} />}
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <AiAssistantModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          activeProject={activeProject}
          budgetItems={budgetItems}
          fieldVisits={fieldVisits}
        />
        <CompanyBrandingModal
          isOpen={isBrandingModalOpen}
          onClose={() => setIsBrandingModalOpen(false)}
          company={company}
          onUpdateCompany={handleUpdateCompany}
        />
        <NotificationRemindersModal
          isOpen={isReminderModalOpen}
          onClose={() => setIsReminderModalOpen(false)}
          reminders={reminders}
          tasks={tasks.filter((t) => t.projectId === activeProjectId || !t.projectId)}
          milestones={milestones.filter((m) => m.projectId === activeProjectId || !m.projectId)}
          onAddReminder={handleAddReminder}
          onToggleReminder={handleToggleReminder}
          onDeleteReminder={handleDeleteReminder}
          onTriggerTestNotification={handleTriggerToast}
        />
      </Suspense>

      {/* Floating Interactive Toast Alert */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-4 duration-300">
          <div
            className={`p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-start gap-3 ${
              activeToast.type === 'urgent'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : activeToast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : 'bg-slate-900/95 border-amber-400/40 text-amber-200'
            }`}
          >
            <div className="p-2 rounded-xl bg-white/10 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider">{activeToast.title}</h4>
              <p className="text-xs opacity-90">{activeToast.message}</p>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="text-xs font-bold opacity-60 hover:opacity-100 p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
