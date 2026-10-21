import { useEffect } from 'react';
import {
  saveProjectToFirestore,
  deleteProjectFromFirestore,
  subscribeProjects,
  saveFieldVisitToFirestore,
  deleteFieldVisitFromFirestore,
  subscribeFieldVisits,
  saveExpenseToFirestore,
  deleteExpenseFromFirestore,
  subscribeExpenses,
  saveAttendanceToFirestore,
  deleteAttendanceFromFirestore,
  subscribeAttendance,
  saveCompanySettingsToFirestore,
  subscribeCompanySettings,
  saveMachineryToFirestore,
  deleteMachineryFromFirestore,
  subscribeMachinery,
  saveEmployeeToFirestore,
  deleteEmployeeFromFirestore,
  subscribeEmployees,
  saveQuoteToFirestore,
  deleteQuoteFromFirestore,
  subscribeQuotes,
  saveAPUItemToFirestore,
  deleteAPUItemFromFirestore,
  subscribeAPUItems,
  saveScheduleTaskToFirestore,
  deleteScheduleTaskFromFirestore,
  subscribeScheduleTasks,
  saveMilestoneToFirestore,
  deleteMilestoneFromFirestore,
  subscribeMilestones,
  saveTaskReminderToFirestore,
  deleteTaskReminderFromFirestore,
  subscribeTaskReminders,
} from './firebaseService';
import {
  saveOfflineData,
  processOfflineQueue,
  registerServiceWorker,
  getLocalProjects,
  saveLocalProjects,
} from './offlineStorage';
import { CompanySettings, Project, FieldVisit, Machinery, MachineryLog, Employee, AttendanceRecord, ExpenseRecord, QuoteRecord, APUItem, ScheduleTask, Milestone, TaskReminder } from './types';
import { applyCompanyBrandingToDOM, saveCompanyBrandingLocal } from './brandingService';

export interface UseRealtimeSyncOptions {
  currentUserUid?: string;
  setProjects: (value: Project[]) => void;
  setFieldVisits: (value: FieldVisit[]) => void;
  setMachinery: (value: Machinery[]) => void;
  setMachineryLogs: (value: MachineryLog[]) => void;
  setEmployees: (value: Employee[]) => void;
  setAttendance: (value: AttendanceRecord[]) => void;
  setExpenses: (value: ExpenseRecord[]) => void;
  setQuotes: (value: QuoteRecord[]) => void;
  setBudgetItems: (value: APUItem[]) => void;
  setTasks: (value: ScheduleTask[]) => void;
  setMilestones: (value: Milestone[]) => void;
  setReminders: (value: TaskReminder[]) => void;
  setCompany: (value: CompanySettings) => void;
}

export function useRealtimeSync(options: UseRealtimeSyncOptions) {
  const {
    currentUserUid,
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
  } = options;

  useEffect(() => {
    if (!currentUserUid) return;
    const uid = currentUserUid;

    const unsubProjects = subscribeProjects(uid, (remoteProjects) => {
      const normalized = Array.isArray(remoteProjects) ? remoteProjects : [];
      setProjects(normalized);
      saveLocalProjects(normalized);
    });

    const unsubVisits = subscribeFieldVisits(uid, (remoteVisits) => {
      setFieldVisits(Array.isArray(remoteVisits) ? remoteVisits : []);
    });

    const unsubExpenses = subscribeExpenses(uid, (remoteExpenses) => {
      setExpenses(Array.isArray(remoteExpenses) ? remoteExpenses : []);
    });

    const unsubAttendance = subscribeAttendance(uid, (remoteAttendance) => {
      setAttendance(Array.isArray(remoteAttendance) ? remoteAttendance : []);
    });

    const unsubCompany = subscribeCompanySettings(uid, (remoteCompany) => {
      if (remoteCompany) {
        setCompany(remoteCompany);
        saveCompanyBrandingLocal(remoteCompany);
        applyCompanyBrandingToDOM(remoteCompany);
      }
    });

    const unsubMachinery = subscribeMachinery(uid, (remoteMach) => {
      setMachinery(Array.isArray(remoteMach) ? remoteMach : []);
    });

    const unsubEmployees = subscribeEmployees(uid, (remoteEmp) => {
      setEmployees(Array.isArray(remoteEmp) ? remoteEmp : []);
    });

    const unsubQuotes = subscribeQuotes(uid, (remoteQuotes) => {
      setQuotes(Array.isArray(remoteQuotes) ? remoteQuotes : []);
    });

    const unsubAPU = subscribeAPUItems(uid, (remoteAPU) => {
      setBudgetItems(Array.isArray(remoteAPU) ? remoteAPU : []);
    });

    const unsubTasks = subscribeScheduleTasks(uid, (remoteTasks) => {
      setTasks(Array.isArray(remoteTasks) ? remoteTasks : []);
    });

    const unsubMilestones = subscribeMilestones(uid, (remoteMils) => {
      setMilestones(Array.isArray(remoteMils) ? remoteMils : []);
    });

    const unsubReminders = subscribeTaskReminders(uid, (remoteRems) => {
      setReminders(Array.isArray(remoteRems) ? remoteRems : []);
    });

    return () => {
      unsubProjects();
      unsubVisits();
      unsubExpenses();
      unsubAttendance();
      unsubCompany();
      unsubMachinery();
      unsubEmployees();
      unsubQuotes();
      unsubAPU();
      unsubTasks();
      unsubMilestones();
      unsubReminders();
    };
  }, [
    currentUserUid,
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
  ]);
}

export function buildOfflineQueueSyncHandler(uid: string) {
  return async (item: any) => {
    try {
      switch (item.type) {
        case 'project':
          return await saveProjectToFirestore(item.payload, uid);
        case 'project_delete':
          return await deleteProjectFromFirestore(item.payload.id);
        case 'fieldVisit':
          return await saveFieldVisitToFirestore(item.payload, uid);
        case 'fieldVisit_delete':
          return await deleteFieldVisitFromFirestore(item.payload.id);
        case 'expense':
          return await saveExpenseToFirestore(item.payload, uid);
        case 'expense_delete':
          return await deleteExpenseFromFirestore(item.payload.id);
        case 'attendance':
          return await saveAttendanceToFirestore(item.payload, uid);
        case 'attendance_delete':
          return await deleteAttendanceFromFirestore(item.payload.id);
        case 'machinery':
          return await saveMachineryToFirestore(item.payload, uid);
        case 'machinery_delete':
          return await deleteMachineryFromFirestore(item.payload.id);
        case 'employee':
          return await saveEmployeeToFirestore(item.payload, uid);
        case 'employee_delete':
          return await deleteEmployeeFromFirestore(item.payload.id);
        case 'quote':
          return await saveQuoteToFirestore(item.payload, uid);
        case 'quote_delete':
          return await deleteQuoteFromFirestore(item.payload.id);
        case 'apuItem':
          return await saveAPUItemToFirestore(item.payload, uid);
        case 'apuItem_delete':
          return await deleteAPUItemFromFirestore(item.payload.id);
        case 'scheduleTask':
          return await saveScheduleTaskToFirestore(item.payload, uid);
        case 'scheduleTask_delete':
          return await deleteScheduleTaskFromFirestore(item.payload.id);
        case 'milestone':
          return await saveMilestoneToFirestore(item.payload, uid);
        case 'milestone_delete':
          return await deleteMilestoneFromFirestore(item.payload.id);
        case 'reminder':
          return await saveTaskReminderToFirestore(item.payload, uid);
        case 'reminder_delete':
          return await deleteTaskReminderFromFirestore(item.payload.id);
        case 'companySettings':
          return await saveCompanySettingsToFirestore(item.payload, uid);
        default:
          return true;
      }
    } catch (e) {
      console.error('Error syncing offline item:', e);
      return false;
    }
  };
}

export function useOfflineSync(
  currentUserUid: string | undefined,
  handleTriggerToast: (title: string, message: string, type: 'urgent' | 'reminder' | 'success') => void
) {
  useEffect(() => {
    registerServiceWorker();

    const handleSyncOnline = async () => {
      if (!currentUserUid) return;

      const res = await processOfflineQueue(buildOfflineQueueSyncHandler(currentUserUid));

      if (res.processed > 0) {
        handleTriggerToast(
          'Sincronización Completada',
          `Se enviaron a la nube ${res.processed} cambio(s) guardado(s) fuera de línea.`,
          'success'
        );
      }
    };

    if (typeof window !== 'undefined' && navigator.onLine && currentUserUid) {
      void handleSyncOnline();
    }

    window.addEventListener('online', handleSyncOnline);
    return () => {
      window.removeEventListener('online', handleSyncOnline);
    };
  }, [currentUserUid, handleTriggerToast]);
}

export function useProjectLocalPersistence(projects: Project[]) {
  useEffect(() => {
    if (projects && projects.length > 0) {
      saveLocalProjects(projects);
    }
  }, [projects]);
}

export function useProjectExternalSync(setProjects: (value: Project[]) => void) {
  useEffect(() => {
    const handleExternalProjectsUpdate = () => {
      const local = getLocalProjects();
      if (local && local.length > 0) {
        setProjects(local);
      }
    };

    window.addEventListener('constructerp_projects_updated', handleExternalProjectsUpdate);
    return () => window.removeEventListener('constructerp_projects_updated', handleExternalProjectsUpdate);
  }, [setProjects]);
}
