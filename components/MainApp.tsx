'use client';

import React, { useCallback, useState, useEffect, lazy, Suspense } from 'react';
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
const BilateralValidationModal = lazy(() => import('@/components/BilateralValidationModal').then((m) => ({ default: m.BilateralValidationModal })));
import {
  playNotificationChime,
  checkProjectBudgetAndMargin,
  checkAllProjectsBudgetAndMargin,
  BudgetMarginAlert,
} from '@/lib/notificationService';
import { initAuth, googleSignIn, googleSignOut } from '@/lib/googleCalendar';
import {
  saveProjectToFirestore,
  deleteProjectFromFirestore,
  saveFieldVisitToFirestore,
  deleteFieldVisitFromFirestore,
  saveExpenseToFirestore,
  deleteExpenseFromFirestore,
  saveAttendanceToFirestore,
  deleteAttendanceFromFirestore,
  saveCompanySettingsToFirestore,
  saveMachineryToFirestore,
  deleteMachineryFromFirestore,
  saveEmployeeToFirestore,
  deleteEmployeeFromFirestore,
  saveQuoteToFirestore,
  deleteQuoteFromFirestore,
  saveAPUItemToFirestore,
  deleteAPUItemFromFirestore,
  saveScheduleTaskToFirestore,
  deleteScheduleTaskFromFirestore,
  saveMilestoneToFirestore,
  deleteMilestoneFromFirestore,
  saveTaskReminderToFirestore,
  deleteTaskReminderFromFirestore,
} from '@/lib/firebaseService';

import {
  saveOfflineData,
  loadOfflineData,
  getLocalProjects,
  saveLocalProjects,
  addOfflineAction,
  processOfflineQueue,
  registerServiceWorker,
  clearAllLocalData,
} from '@/lib/offlineStorage';
import { useOfflineSync, useProjectExternalSync, useProjectLocalPersistence, useRealtimeSync } from '@/lib/useRealtimeSync';
import { useBudgetMonitoring } from '@/lib/useBudgetMonitoring';
import '@/lib/projectValidationScript';
import { User } from 'firebase/auth';
import { Sparkles, RotateCcw } from 'lucide-react';
import {
  applyCompanyBrandingToDOM,
  loadSavedCompanyBranding,
  saveCompanyBrandingLocal,
} from '@/lib/brandingService';


export default function MainApp() {
  const [company, setCompany] = useState<CompanySettings>(initialCompanySettings);
  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window !== 'undefined') {
      const local = getLocalProjects();
      if (local && local.length > 0) return local;
    }
    return [];
  });
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const activeProject = projects.find((p) => p.id === activeProjectId) || (projects.length > 0 ? projects[0] : null);
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
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const toastTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTriggerToast = useCallback(
    (title: string, message: string, type: 'urgent' | 'reminder' | 'success' = 'reminder') => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }

      setActiveToast({ title, message, type });
      playNotificationChime(type);
      toastTimeoutRef.current = setTimeout(() => {
        setActiveToast((current) => (current?.title === title ? null : current));
      }, 7000);
    },
    []
  );

  useEffect(() => () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
  }, []);

  useProjectLocalPersistence(projects);
  useProjectExternalSync(setProjects);

  useEffect(() => {
    // Cargar marca y logotipo guardados en LocalStorage inmediatamente
    try {
      const saved = loadSavedCompanyBranding();
      if (saved) {
        setCompany(saved);
        applyCompanyBrandingToDOM(saved);
      }
    } catch (err) {
      console.warn('Error cargando branding guardado:', err);
    }
  }, []);

  useEffect(() => {
    try {
      applyCompanyBrandingToDOM(company);
    } catch (err) {
      console.warn('Error aplicando branding al DOM:', err);
    }
  }, [company]);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => setCurrentUser(user),
      () => setCurrentUser(null)
    );
    return () => unsubscribe();
  }, []);


  useRealtimeSync({
    currentUserUid: currentUser?.uid,
    setProjects,
    setFieldVisits,
    setMachinery,
    setMachineryLogs,
    setEmployees,
    setAttendance,
    setExpenses,
    setQuotes,
    setBudgetItems,
    setTasks,
    setMilestones,
    setReminders,
    setCompany,
  });

  useOfflineSync(currentUser?.uid, handleTriggerToast);

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

  const { evaluateAndTriggerBudgetMarginAlerts } = useBudgetMonitoring(projects, handleTriggerToast);

  const handleAddProject = (p: Project) => {
    setProjects((prev) => {
      const updated = [p, ...prev.filter((item) => item.id !== p.id)];
      saveLocalProjects(updated);
      return updated;
    });
    setActiveProjectId(p.id);
    addOfflineAction('project', p, `Creación de proyecto: ${p.name}`);
    if (currentUser?.uid) {
      saveProjectToFirestore(p, currentUser.uid).catch((err) => console.error(err));
    }
  };

  const handleUpdateProject = (p: Project) => {
    setProjects((prev) => {
      const updated = prev.map((item) => (item.id === p.id ? p : item));
      saveLocalProjects(updated);
      return updated;
    });
    addOfflineAction('project', p, `Actualización de proyecto: ${p.name}`);
    if (currentUser?.uid) {
      saveProjectToFirestore(p, currentUser.uid).catch((err) => console.error(err));
    }
    handleTriggerToast('Proyecto Actualizado', `Cambios en "${p.name}" guardados con éxito.`, 'success');
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveLocalProjects(updated);
      return updated;
    });
    addOfflineAction('project_delete', { id }, `Eliminación de proyecto ID: ${id}`);
    if (currentUser?.uid) {
      deleteProjectFromFirestore(id).catch((err) => console.error(err));
    }
    handleTriggerToast('Proyecto Eliminado', `El proyecto ha sido removido del sistema.`, 'reminder');
  };

  const handleAddFieldVisit = (fv: FieldVisit) => {
    setFieldVisits((prev) => [fv, ...prev]);
    addOfflineAction('fieldVisit', fv, `Bitácora de campo: ${fv.projectName}`);
    if (currentUser?.uid) {
      saveFieldVisitToFirestore(fv, currentUser.uid).catch((err) => console.error(err));
    }
    const gpsInfo =
      fv.latitude && fv.longitude ? ` (GPS: ${fv.latitude.toFixed(5)}°, ${fv.longitude.toFixed(5)}°)` : '';
    handleTriggerToast(
      'Visita de Campo Registrada',
      `Bitácora guardada con coordenadas GPS exactas${gpsInfo} y geocerca validada.`,
      'success'
    );
  };

  const handleUpdateFieldVisit = (fv: FieldVisit) => {
    setFieldVisits((prev) => prev.map((v) => (v.id === fv.id ? fv : v)));
    addOfflineAction('fieldVisit', fv, `Actualización de bitácora: ${fv.projectName}`);
    if (currentUser?.uid) {
      saveFieldVisitToFirestore(fv, currentUser.uid).catch((err) => console.error(err));
    }
    handleTriggerToast(
      'Bitácora Actualizada',
      `Visita de campo sincronizada con coordenadas GPS verificadas.`,
      'success'
    );
  };

  const handleDeleteFieldVisit = (id: string) => {
    setFieldVisits((prev) => prev.filter((v) => v.id !== id));
    addOfflineAction('fieldVisit_delete', { id }, `Eliminación de bitácora ID: ${id}`);
    if (currentUser?.uid) {
      deleteFieldVisitFromFirestore(id).catch((err) => console.error(err));
    }
    handleTriggerToast('Bitácora Eliminada', 'El reporte diario ha sido eliminado.', 'reminder');
  };

  const handleAddBudgetItem = (item: APUItem) => {
    setBudgetItems((prev) => [...prev, item]);
    addOfflineAction('apuItem', item, `Renglón APU: ${item.code}`);
    if (currentUser?.uid) {
      saveAPUItemToFirestore(item, currentUser.uid).catch((err) => console.error(err));
    }
  };

  const handleUpdateBudgetItems = (items: APUItem[]) => {
    setBudgetItems(items);
    items.forEach((it) => {
      addOfflineAction('apuItem', it, `Actualización APU: ${it.code}`);
      if (currentUser?.uid) {
        saveAPUItemToFirestore(it, currentUser.uid).catch((err) => console.error(err));
      }
    });
  };

  const handleDeleteBudgetItem = (id: string) => {
    setBudgetItems((prev) => prev.filter((item) => item.id !== id));
    addOfflineAction('apuItem_delete', { id }, `Eliminación APU ID: ${id}`);
    if (currentUser?.uid) {
      deleteAPUItemFromFirestore(id).catch((err) => console.error(err));
    }
    handleTriggerToast('Partida Eliminada', 'Renglón APU eliminado del presupuesto.', 'reminder');
  };

  const handleAddQuote = (q: QuoteRecord) => {
    setQuotes((prev) => [q, ...prev]);
    addOfflineAction('quote', q, `Cotización: ${q.clientName}`);
    if (currentUser?.uid) {
      saveQuoteToFirestore(q, currentUser.uid).catch((err) => console.error(err));
    }
    handleTriggerToast('Cotización Creada', `Propuesta para "${q.clientName}" registrada.`, 'success');
  };

  const handleUpdateQuote = (q: QuoteRecord) => {
    setQuotes((prev) => prev.map((item) => (item.id === q.id ? q : item)));
    addOfflineAction('quote', q, `Actualización de cotización: ${q.clientName}`);
    if (currentUser?.uid) {
      saveQuoteToFirestore(q, currentUser.uid).catch((err) => console.error(err));
    }
    handleTriggerToast('Cotización Actualizada', `Cambios en propuesta guardados.`, 'success');
  };

  const handleDeleteQuote = (id: string) => {
    setQuotes((prev) => prev.filter((item) => item.id !== id));
    addOfflineAction('quote_delete', { id }, `Eliminación cotización ID: ${id}`);
    if (currentUser?.uid) {
      deleteQuoteFromFirestore(id).catch((err) => console.error(err));
    }
    handleTriggerToast('Cotización Eliminada', 'La cotización fue removida.', 'reminder');
  };

  const handleAddMachinery = (m: Machinery) => {
    setMachinery((prev) => [...prev, m]);
    addOfflineAction('machinery', m, `Maquinaria: ${m.name}`);
    if (currentUser?.uid) {
      saveMachineryToFirestore(m, currentUser.uid).catch((err) => console.error(err));
    }
    handleTriggerToast('Equipo Registrado', `${m.name} añadido al inventario.`, 'success');
  };

  const handleUpdateMachinery = (m: Machinery) => {
    setMachinery((prev) => prev.map((item) => (item.id === m.id ? m : item)));
    addOfflineAction('machinery', m, `Actualización maquinaria: ${m.name}`);
    if (currentUser?.uid) {
      saveMachineryToFirestore(m, currentUser.uid).catch((err) => console.error(err));
    }
    handleTriggerToast('Maquinaria Actualizada', `Datos de ${m.name} guardados.`, 'success');
  };

  const handleDeleteMachinery = (id: string) => {
    setMachinery((prev) => prev.filter((item) => item.id !== id));
    addOfflineAction('machinery_delete', { id }, `Eliminación maquinaria ID: ${id}`);
    if (currentUser?.uid) {
      deleteMachineryFromFirestore(id).catch((err) => console.error(err));
    }
    handleTriggerToast('Equipo Eliminado', 'Maquinaria eliminada del registro.', 'reminder');
  };

  const handleAddEmployee = (emp: Employee) => {
    setEmployees((prev) => [...prev, emp]);
    addOfflineAction('employee', emp, `Empleado: ${emp.name}`);
    if (currentUser?.uid) {
      saveEmployeeToFirestore(emp, currentUser.uid).catch((err) => console.error(err));
    }
    handleTriggerToast('Empleado Registrado', `${emp.name} agregado a la nómina.`, 'success');
  };

  const handleUpdateEmployee = (emp: Employee) => {
    setEmployees((prev) => prev.map((item) => (item.id === emp.id ? emp : item)));
    addOfflineAction('employee', emp, `Actualización empleado: ${emp.name}`);
    if (currentUser?.uid) {
      saveEmployeeToFirestore(emp, currentUser.uid).catch((err) => console.error(err));
    }
    handleTriggerToast('Empleado Actualizado', `Ficha de ${emp.name} guardada.`, 'success');
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((item) => item.id !== id));
    addOfflineAction('employee_delete', { id }, `Eliminación empleado ID: ${id}`);
    if (currentUser?.uid) {
      deleteEmployeeFromFirestore(id).catch((err) => console.error(err));
    }
    handleTriggerToast('Empleado Eliminado', 'Operario removido del personal.', 'reminder');
  };

  const handleAddAttendance = (att: AttendanceRecord) => {
    setAttendance((prev) => [att, ...prev]);
    addOfflineAction('attendance', att, `Asistencia: ${att.employeeName}`);
    if (currentUser?.uid) {
      saveAttendanceToFirestore(att, currentUser.uid).catch((err) => console.error(err));
    }
  };

  const handleDeleteAttendance = (id: string) => {
    setAttendance((prev) => prev.filter((a) => a.id !== id));
    addOfflineAction('attendance_delete', { id }, `Eliminación asistencia ID: ${id}`);
    if (currentUser?.uid) {
      deleteAttendanceFromFirestore(id).catch((err) => console.error(err));
    }
  };

  const handleAddExpense = (ex: ExpenseRecord) => {
    setExpenses((prev) => [ex, ...prev]);
    addOfflineAction('expense', ex, `Gasto: ${ex.supplier}`);
    // Also update project spentTotal
    setProjects((prev) => {
      const updated = prev.map((p) =>
        p.id === ex.projectId ? { ...p, spentTotal: p.spentTotal + ex.amount } : p
      );
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
    addOfflineAction('expense', updatedEx, `Actualización gasto: ${updatedEx.supplier}`);
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

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    addOfflineAction('expense_delete', { id }, `Eliminación gasto ID: ${id}`);
    if (currentUser?.uid) {
      deleteExpenseFromFirestore(id).catch((err) => console.error(err));
    }
    handleTriggerToast('Gasto Eliminado', 'El registro de compra o factura fue eliminado.', 'reminder');
  };

  const handleUpdateCompany = (updatedCompany: CompanySettings) => {
    setCompany(updatedCompany);
    saveCompanyBrandingLocal(updatedCompany);
    applyCompanyBrandingToDOM(updatedCompany);
    addOfflineAction('companySettings', updatedCompany, 'Configuración de Empresa');
    if (currentUser?.uid) {
      saveCompanySettingsToFirestore(updatedCompany, currentUser.uid).catch((err) => console.error(err));
    }
  };

  const handleUpdateTasks = (updatedTasks: ScheduleTask[]) => {
    setTasks(updatedTasks);
    updatedTasks.forEach((t) => {
      addOfflineAction('scheduleTask', t, `Tarea Gantt: ${t.name}`);
      if (currentUser?.uid) {
        saveScheduleTaskToFirestore(t, currentUser.uid).catch((err) => console.error(err));
      }
    });
  };

  const handleUpdateProjectProgress = (projectId: string, progress: number) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const up = { ...p, progressPercent: progress };
          addOfflineAction('project', up, `Avance de obra: ${p.name} (${progress}%)`);
          if (currentUser?.uid) {
            saveProjectToFirestore(up, currentUser.uid).catch((err) => console.error(err));
          }
          return up;
        }
        return p;
      })
    );
  };

  const handleUpdateMilestones = (updatedMilestones: Milestone[]) => {
    setMilestones(updatedMilestones);
    updatedMilestones.forEach((m) => {
      addOfflineAction('milestone', m, `Hito: ${m.title}`);
      if (currentUser?.uid) {
        saveMilestoneToFirestore(m, currentUser.uid).catch((err) => console.error(err));
      }
    });
  };

  const handleAddReminder = (reminder: TaskReminder) => {
    setReminders((prev) => [reminder, ...prev]);
    addOfflineAction('reminder', reminder, `Recordatorio: ${reminder.title}`);
    if (currentUser?.uid) {
      saveTaskReminderToFirestore(reminder, currentUser.uid).catch((err) => console.error(err));
    }
    handleTriggerToast(
      'Recordatorio Programado',
      `Se configuró con éxito el aviso para "${reminder.title}".`,
      reminder.priority === 'Alta' ? 'urgent' : 'reminder'
    );
  };

  const handleToggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const up = { ...r, enabled: !r.enabled };
          addOfflineAction('reminder', up, `Toggle recordatorio: ${r.title}`);
          if (currentUser?.uid) {
            saveTaskReminderToFirestore(up, currentUser.uid).catch((err) => console.error(err));
          }
          return up;
        }
        return r;
      })
    );
  };

  const handleDeleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    addOfflineAction('reminder_delete', { id }, `Eliminación recordatorio ID: ${id}`);
    if (currentUser?.uid) {
      deleteTaskReminderFromFirestore(id).catch((err) => console.error(err));
    }
  };

  // Limpia todo el estado local y la base de datos localStorage para iniciar con una pizarra en blanco
  const handleResetSeedData = () => {
    if (
      window.confirm(
        '¿Desea limpiar todo el sistema y reiniciar desde cero? Se borrarán todos los proyectos, bitácoras, personal, gastos y configuración guardados localmente. Esta acción no se puede deshacer.'
      )
    ) {
      clearAllLocalData();
      setProjects([]);
      setFieldVisits([]);
      setMachinery([]);
      setMachineryLogs([]);
      setEmployees([]);
      setAttendance([]);
      setExpenses([]);
      setQuotes([]);
      setBudgetItems([]);
      setTasks([]);
      setMilestones([]);
      setReminders([]);
      setCompany(initialCompanySettings);
      setActiveProjectId('');
      handleTriggerToast('Sistema Reiniciado', 'Todas las datos locales se eliminaron. Ya puede ingresar proyectos reales.', 'success');
    }
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
        onOpenBilateralValidation={() => setIsValidationModalOpen(true)}
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

      <main className="flex-1 w-full p-3 sm:p-6 lg:p-8 lg:ml-[280px] max-w-full lg:max-w-[calc(100vw-280px)] overflow-x-hidden pb-[max(2rem,env(safe-area-inset-bottom))]">
        {/* Variation 5: AI Assistant Prompt Bar */}
        <div className="ai-assistant-bar mb-6 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
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
              className="bg-transparent border-none text-slate-100 placeholder:text-slate-400 text-xs sm:text-sm flex-1 outline-none font-sans min-w-0"
            />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap shrink-0">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="bg-slate-100 hover:bg-white text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition cursor-pointer shadow-md hover:scale-[1.02] shrink-0"
            >
              Analizar
            </button>
            <button
              type="button"
              onClick={handleManualBudgetAudit}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-2 rounded-xl text-xs font-bold tracking-wider transition cursor-pointer shadow-md shrink-0 flex items-center gap-1.5"
              title="Verificar si algún proyecto alcanzó el 80% del presupuesto o excedió el margen de utilidad esperado (15%)"
            >
              <span>Alerta 80%</span>
            </button>
            <button
              type="button"
              onClick={handleResetSeedData}
              className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer shadow-md shrink-0 flex items-center gap-1.5"
              title="Restaurar datos iniciales de prueba (Seed Data) o reiniciar para cargar datos reales"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restaurar Semilla</span>
            </button>
          </div>
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
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
              onOpenBilateralValidation={() => setIsValidationModalOpen(true)}
              fieldVisits={fieldVisits}
              onAddFieldVisit={handleAddFieldVisit}
              onUpdateFieldVisit={handleUpdateFieldVisit}
              onDeleteFieldVisit={handleDeleteFieldVisit}
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
              onUpdateQuote={handleUpdateQuote}
              onDeleteQuote={handleDeleteQuote}
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
              onUpdateMachinery={handleUpdateMachinery}
              onDeleteMachinery={handleDeleteMachinery}
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
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
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
              onDeleteExpense={handleDeleteExpense}
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
          tasks={tasks.filter((t) => (!activeProjectId ? true : t.projectId === activeProjectId || !t.projectId))}
          milestones={milestones.filter((m) => (!activeProjectId ? true : m.projectId === activeProjectId || !m.projectId))}
          onAddReminder={handleAddReminder}
          onToggleReminder={handleToggleReminder}
          onDeleteReminder={handleDeleteReminder}
          onTriggerTestNotification={handleTriggerToast}
        />
        <BilateralValidationModal
          isOpen={isValidationModalOpen}
          onClose={() => setIsValidationModalOpen(false)}
          onProjectsUpdated={(updatedList) => setProjects(updatedList)}
          userId={currentUser?.uid}
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
