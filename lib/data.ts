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
  Milestone,
  TaskReminder,
  AiRecommendation,
} from './types';

// ConstructERP Guatemala — Estado inicial LIMPIO (sin datos de demostración)
// Todos los arrays arrancan vacíos para que el usuario ingrese proyectos reales desde cero.
// Se mantienen las utilidades de formateo y las constantes vacías tipadas.

export const initialCompanySettings: CompanySettings = {
  legalName: '',
  commercialName: '',
  nit: '',
  architectName: '',
  architectColNumber: '',
  address: '',
  phone: '',
  email: '',
  exchangeRate: 0,
  primaryColor: '#1e3a8a',
  secondaryColor: '#d97706',
};

export const initialProjects: Project[] = [];

export const initialFieldVisits: FieldVisit[] = [];

export const initialMachinery: Machinery[] = [];

export const initialMachineryLogs: MachineryLog[] = [];

export const initialEmployees: Employee[] = [];

export const initialAttendanceRecords: AttendanceRecord[] = [];

export const initialExpenseRecords: ExpenseRecord[] = [];

export const initialQuoteRecords: QuoteRecord[] = [];

export const initialAPUItems: APUItem[] = [];

export const initialScheduleTasks: ScheduleTask[] = [];

export const initialMilestones: Milestone[] = [];

export const initialTaskReminders: TaskReminder[] = [];

export const initialAiRecommendations: AiRecommendation[] = [];



export function formatGTQ(amount: number): string {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatUSD(amount: number, exchangeRate: number = 7.82): string {
  const usdAmount = amount / exchangeRate;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(usdAmount);
}
