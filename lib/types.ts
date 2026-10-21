export interface CompanySettings {
  legalName: string;
  commercialName: string;
  headerTitle?: string; // Título / Nombre de encabezado personalizado para app y reportes
  companyName?: string; // Alias común para compatibilidad
  nit: string;
  architectName: string;
  architectColNumber: string;
  address: string;
  phone: string;
  email: string;
  exchangeRate: number; // e.g. 7.85 GTQ per USD
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string; // Base64 Data URL (PNG o JPEG) o URL del logotipo
  logoType?: 'image/png' | 'image/jpeg';
  updatedAt?: string;
  ownerId?: string;
  authorId?: string;
}


export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  location: string;
  municipality: string;
  department: string;
  budgetTotal: number;
  spentTotal: number;
  progressPercent: number;
  startDate: string;
  endDate: string;
  status: 'En Ejecución' | 'Planificación' | 'Finalizado' | 'Suspendido';
  lat: number;
  lng: number;
  expectedProfitMarginPercent?: number; // e.g. 15 for 15%
  ownerId?: string;
  authorId?: string;
}

export interface FieldPhoto {
  id: string;
  url: string;
  caption: string;
  date: string;
  timestamp: string;
  coords?: { lat: number; lng: number };
  takenBy?: string;
}

export interface FieldVisit {
  id: string;
  projectId: string;
  projectName: string;
  date: string;
  foremanName: string;
  notes: string;
  weather: 'Soleado' | 'Lluvia Moderada' | 'Tormenta Fuerte' | 'Nublado';
  workersCount: number;
  signatureDataUrl?: string;
  signerDpi?: string;
  signerRole?: string;
  signedAt?: string;
  gpsCoords?: { lat: number; lng: number };
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  geofenceValid?: boolean;
  geofenceDistanceMeters?: number;
  gpsTimestamp?: string;
  status: 'Autorizado' | 'Pendiente' | 'Revisión';
  photos?: FieldPhoto[];
  ownerId?: string;
  authorId?: string;
}

export interface Machinery {
  id: string;
  name: string;
  model: string;
  plateOrCode: string;
  hourlyRateGTQ: number;
  currentHorometer: number;
  status: 'Disponible' | 'En Obra' | 'Mantenimiento';
  ownerId?: string;
  authorId?: string;
}

export interface MachineryLog {
  id: string;
  machineryId: string;
  machineryName: string;
  projectId: string;
  date: string;
  hoursWorked: number;
  operatorName: string;
  fuelGallons: number;
  costGTQ: number;
  signatureDataUrl?: string;
  signerName?: string;
  ownerId?: string;
  authorId?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: 'Capataz' | 'Albañil' | 'Ayudante' | 'Arquitecto Residente' | 'Bodeguero' | 'Electricista';
  dailyRateGTQ: number;
  igssAffiliated: boolean;
  phone: string;
  dpi?: string;
  igssNumber?: string;
  hireDate?: string;
  customBonoIncentivo?: number;
  overriddenIgssLaboral?: number;
  overriddenBono14?: number;
  overriddenAguinaldo?: number;
  ownerId?: string;
  authorId?: string;
}

export interface AttendanceRecord {
  id: string;
  projectId: string;
  date: string;
  employeeId: string;
  employeeName: string;
  status: 'Presente' | 'Ausente' | 'Permiso' | 'Incapacidad IGSS';
  overtimeHours: number;
  gpsCoords?: { lat: number; lng: number };
  gpsVerified?: boolean;
  distanceMeters?: number;
  gpsTimestamp?: string;
  overrideReason?: string;
  approvalStatus?: string;
  auditObservations?: string;
  ownerId?: string;
  authorId?: string;
}

export interface ExpenseAuditEntry {
  id: string;
  action: 'APROBADO' | 'RECHAZADO' | 'REVERTIDO' | string;
  user: string;
  role: string;
  timestamp: string;
  note: string;
}

export interface ExpenseRecord {
  id: string;
  projectId: string;
  date: string;
  category: 'Materiales (Cementos, Hierro)' | 'Mano de Obra' | 'Maquinaria y Combustible' | 'Permisos & Licencias' | 'Imprevistos';
  description: string;
  supplier: string;
  nitSupplier: string;
  facturaNumber: string;
  amount: number; // in GTQ
  currency: 'GTQ' | 'USD';
  paymentMethod: 'Efectivo' | 'Cheque' | 'Transferencia BI' | 'Tarjeta';
  receiptPhotoUrl?: string;
  receiptPhotoDate?: string;
  receiptCoords?: { lat: number; lng: number };
  approvalStatus?: 'Aprobado' | 'Pendiente' | 'Rechazado';
  approvedBy?: string;
  approvedAt?: string;
  auditTrail?: ExpenseAuditEntry[];
  auditObservations?: string;
  assignedApuId?: string;
  assignedApuCode?: string;
  assignedApuDescription?: string;
  ownerId?: string;
  authorId?: string;
}

export interface QuoteRecord {
  id: string;
  projectId: string;
  clientName: string;
  clientNit: string;
  date: string;
  validUntil: string;
  items: { description: string; qty: number; unit: string; unitPriceGTQ: number }[];
  totalGTQ: number;
  status: 'Aceptada' | 'Enviada' | 'Borrador' | 'Rechazada';
  ownerId?: string;
  authorId?: string;
}

export interface APUItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  materialUnitCostGTQ: number;
  laborUnitCostGTQ: number;
  equipmentUnitCostGTQ: number;
  totalUnitCostGTQ: number;
  totalPriceGTQ: number;
  department?: string;
  breakdown?: {
    materials?: { name: string; quantity: number; unit: string; unitPriceGTQ: number; subtotalGTQ: number }[];
    labor?: { role: string; yieldHours: number; unitPriceGTQ: number; subtotalGTQ: number }[];
    equipment?: { name: string; subtotalGTQ: number }[];
    notes?: string;
    technicalNorm?: string;
  };
  ownerId?: string;
  authorId?: string;
}

export interface ScheduleTask {
  id: string;
  projectId: string;
  name: string;
  phase: string;
  startDate: string;
  endDate: string;
  progress: number;
  criticalPath: boolean;
  predecessors: string[];
  completed?: boolean;
  completedAt?: string;
  assignedTo?: string;
  weightPercent?: number;
  notes?: string;
  milestoneId?: string;
  ownerId?: string;
  authorId?: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  phase: string;
  targetDate: string;
  completed: boolean;
  completedAt?: string;
  progress: number; // 0 to 100
  weightPercent: number; // contribution to final goal (sum = 100%)
  description?: string;
  deliverable?: string;
  ownerId?: string;
  authorId?: string;
}

export type ReminderAdvanceOption =
  | 'same_day'
  | '1_day_before'
  | '2_days_before'
  | '3_days_before'
  | '1_week_before'
  | 'custom';

export interface TaskReminder {
  id: string;
  projectId: string;
  taskId?: string;
  taskName: string;
  milestoneId?: string;
  title: string;
  description: string;
  targetDate: string; // YYYY-MM-DD
  targetTime?: string; // HH:mm
  advanceOption: ReminderAdvanceOption;
  priority: 'Alta' | 'Media' | 'Baja';
  channel: 'in_app' | 'sound' | 'email';
  enabled: boolean;
  createdAt: string;
  triggered?: boolean;
  followFlowRequirement?: boolean; // Ensure preceding milestones are met
  ownerId?: string;
  authorId?: string;
}

export interface AiRecommendation {
  id: string;
  title: string;
  category: 'Clima & Programación' | 'Auditoría Financiera' | 'Planilla & IGSS' | 'Suministros';
  description: string;
  impact: 'Alto' | 'Medio' | 'Bajo';
  actionPrompt?: string;
}

export type OfflineActionType =
  | 'project'
  | 'project_delete'
  | 'fieldVisit'
  | 'fieldVisit_delete'
  | 'expense'
  | 'expense_delete'
  | 'attendance'
  | 'attendance_delete'
  | 'machinery'
  | 'machinery_delete'
  | 'employee'
  | 'employee_delete'
  | 'quote'
  | 'quote_delete'
  | 'apuItem'
  | 'apuItem_delete'
  | 'scheduleTask'
  | 'scheduleTask_delete'
  | 'milestone'
  | 'milestone_delete'
  | 'reminder'
  | 'reminder_delete'
  | 'companySettings'
  | 'progress';

export interface OfflineQueueItem {
  id: string;
  type: OfflineActionType;
  timestamp: string;
  description: string;
  payload: any;
  synced: boolean;
}


