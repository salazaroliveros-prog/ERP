import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  getDocFromServer,
  collection,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  Project,
  FieldVisit,
  ExpenseRecord,
  AttendanceRecord,
  CompanySettings,
  Machinery,
  Employee,
  QuoteRecord,
  APUItem,
  ScheduleTask,
  Milestone,
  TaskReminder,
} from './types';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// CRITICAL: The app will break without passing firebaseConfig.firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Connection test helper (called on demand if needed)
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently offline.');
    }
  }
}

// Required error handling schema
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  // Avoid rethrowing normal idle stream disconnections from gRPC
  if (errMsg.includes('Disconnecting idle stream') || errMsg.includes('Timed out waiting for new targets')) {
    console.debug('Firestore idle stream disconnected:', errMsg);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// -------------------------------------------------------------
// Firestore Helpers for Application Entities
// -------------------------------------------------------------

// 1. Projects
export async function saveProjectToFirestore(project: Project, userId: string) {
  const path = `projects/${project.id}`;
  try {
    const docRef = doc(db, 'projects', project.id);
    await setDoc(
      docRef,
      {
        ...project,
        ownerId: userId,
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
}

export function subscribeProjects(userId: string, callback: (projects: Project[]) => void): Unsubscribe {
  const path = 'projects';
  try {
    const q = query(collection(db, path), where('ownerId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: Project[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Project);
        });
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
}

export async function deleteProjectFromFirestore(projectId: string) {
  const path = `projects/${projectId}`;
  try {
    await deleteDoc(doc(db, 'projects', projectId));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    return false;
  }
}

// 2. Field Visits & Inspections
export async function saveFieldVisitToFirestore(visit: FieldVisit, userId: string) {
  const path = `fieldVisits/${visit.id}`;
  try {
    const docRef = doc(db, 'fieldVisits', visit.id);
    await setDoc(
      docRef,
      {
        ...visit,
        authorId: userId,
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
}

export function subscribeFieldVisits(userId: string, callback: (visits: FieldVisit[]) => void): Unsubscribe {
  const path = 'fieldVisits';
  try {
    const q = query(collection(db, path), where('authorId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: FieldVisit[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as FieldVisit);
        });
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
}

// 3. Expenses
export async function saveExpenseToFirestore(expense: ExpenseRecord, userId: string) {
  const path = `expenses/${expense.id}`;
  try {
    const docRef = doc(db, 'expenses', expense.id);
    await setDoc(
      docRef,
      {
        ...expense,
        authorId: userId,
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
}

export function subscribeExpenses(userId: string, callback: (expenses: ExpenseRecord[]) => void): Unsubscribe {
  const path = 'expenses';
  try {
    const q = query(collection(db, path), where('authorId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: ExpenseRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as ExpenseRecord);
        });
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
}

// 4. Attendance
export async function saveAttendanceToFirestore(record: AttendanceRecord, userId: string) {
  const path = `attendance/${record.id}`;
  try {
    const docRef = doc(db, 'attendance', record.id);
    await setDoc(
      docRef,
      {
        ...record,
        authorId: userId,
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
}

export function subscribeAttendance(userId: string, callback: (records: AttendanceRecord[]) => void): Unsubscribe {
  const path = 'attendance';
  try {
    const q = query(collection(db, path), where('authorId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: AttendanceRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as AttendanceRecord);
        });
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
}

// 5. Company Settings
export async function saveCompanySettingsToFirestore(settings: CompanySettings, userId: string) {
  const path = `companySettings/${userId}`;
  try {
    const docRef = doc(db, 'companySettings', userId);
    await setDoc(
      docRef,
      {
        ...settings,
        ownerId: userId,
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
}

export function subscribeCompanySettings(userId: string, callback: (settings: CompanySettings | null) => void): Unsubscribe {
  const path = `companySettings/${userId}`;
  try {
    const docRef = doc(db, 'companySettings', userId);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as CompanySettings);
        } else {
          callback(null);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return () => {};
  }
}

// 6. Machinery
export async function saveMachineryToFirestore(item: Machinery, userId: string) {
  const path = `machinery/${item.id}`;
  try {
    const docRef = doc(db, 'machinery', item.id);
    await setDoc(docRef, { ...item, ownerId: userId }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
}

export function subscribeMachinery(userId: string, callback: (list: Machinery[]) => void): Unsubscribe {
  const path = 'machinery';
  try {
    const q = query(collection(db, path), where('ownerId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: Machinery[] = [];
        snapshot.forEach((docSnap) => list.push(docSnap.data() as Machinery));
        callback(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, path)
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
}

// 7. Employees
export async function saveEmployeeToFirestore(employee: Employee, userId: string) {
  const path = `employees/${employee.id}`;
  try {
    const docRef = doc(db, 'employees', employee.id);
    await setDoc(docRef, { ...employee, ownerId: userId }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
}

export function subscribeEmployees(userId: string, callback: (list: Employee[]) => void): Unsubscribe {
  const path = 'employees';
  try {
    const q = query(collection(db, path), where('ownerId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: Employee[] = [];
        snapshot.forEach((docSnap) => list.push(docSnap.data() as Employee));
        callback(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, path)
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
}

// 8. Quotes
export async function saveQuoteToFirestore(quote: QuoteRecord, userId: string) {
  const path = `quotes/${quote.id}`;
  try {
    const docRef = doc(db, 'quotes', quote.id);
    await setDoc(docRef, { ...quote, authorId: userId }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
}

export function subscribeQuotes(userId: string, callback: (list: QuoteRecord[]) => void): Unsubscribe {
  const path = 'quotes';
  try {
    const q = query(collection(db, path), where('authorId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: QuoteRecord[] = [];
        snapshot.forEach((docSnap) => list.push(docSnap.data() as QuoteRecord));
        callback(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, path)
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
}

// 9. APU Items
export async function saveAPUItemToFirestore(item: APUItem, userId: string) {
  const path = `apuItems/${item.id}`;
  try {
    const docRef = doc(db, 'apuItems', item.id);
    await setDoc(docRef, { ...item, authorId: userId }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
}

export function subscribeAPUItems(userId: string, callback: (list: APUItem[]) => void): Unsubscribe {
  const path = 'apuItems';
  try {
    const q = query(collection(db, path), where('authorId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: APUItem[] = [];
        snapshot.forEach((docSnap) => list.push(docSnap.data() as APUItem));
        callback(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, path)
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
}

// 10. Schedule Tasks
export async function saveScheduleTaskToFirestore(task: ScheduleTask, userId: string) {
  const path = `scheduleTasks/${task.id}`;
  try {
    const docRef = doc(db, 'scheduleTasks', task.id);
    await setDoc(docRef, { ...task, authorId: userId }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
}

export function subscribeScheduleTasks(userId: string, callback: (list: ScheduleTask[]) => void): Unsubscribe {
  const path = 'scheduleTasks';
  try {
    const q = query(collection(db, path), where('authorId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: ScheduleTask[] = [];
        snapshot.forEach((docSnap) => list.push(docSnap.data() as ScheduleTask));
        callback(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, path)
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
}

// 11. Milestones
export async function saveMilestoneToFirestore(milestone: Milestone, userId: string) {
  const path = `milestones/${milestone.id}`;
  try {
    const docRef = doc(db, 'milestones', milestone.id);
    await setDoc(docRef, { ...milestone, authorId: userId }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
}

export function subscribeMilestones(userId: string, callback: (list: Milestone[]) => void): Unsubscribe {
  const path = 'milestones';
  try {
    const q = query(collection(db, path), where('authorId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: Milestone[] = [];
        snapshot.forEach((docSnap) => list.push(docSnap.data() as Milestone));
        callback(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, path)
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
}

// 12. Task Reminders
export async function saveTaskReminderToFirestore(reminder: TaskReminder, userId: string) {
  const path = `taskReminders/${reminder.id}`;
  try {
    const docRef = doc(db, 'taskReminders', reminder.id);
    await setDoc(docRef, { ...reminder, authorId: userId }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
}

export function subscribeTaskReminders(userId: string, callback: (list: TaskReminder[]) => void): Unsubscribe {
  const path = 'taskReminders';
  try {
    const q = query(collection(db, path), where('authorId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: TaskReminder[] = [];
        snapshot.forEach((docSnap) => list.push(docSnap.data() as TaskReminder));
        callback(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, path)
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
}

// -------------------------------------------------------------
// Universal Deletion Helpers for Remote Firestore
// -------------------------------------------------------------

export async function deleteFieldVisitFromFirestore(visitId: string) {
  const path = `fieldVisits/${visitId}`;
  try {
    await deleteDoc(doc(db, 'fieldVisits', visitId));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    return false;
  }
}

export async function deleteExpenseFromFirestore(expenseId: string) {
  const path = `expenses/${expenseId}`;
  try {
    await deleteDoc(doc(db, 'expenses', expenseId));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    return false;
  }
}

export async function deleteAttendanceFromFirestore(recordId: string) {
  const path = `attendance/${recordId}`;
  try {
    await deleteDoc(doc(db, 'attendance', recordId));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    return false;
  }
}

export async function deleteMachineryFromFirestore(machineryId: string) {
  const path = `machinery/${machineryId}`;
  try {
    await deleteDoc(doc(db, 'machinery', machineryId));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    return false;
  }
}

export async function deleteEmployeeFromFirestore(employeeId: string) {
  const path = `employees/${employeeId}`;
  try {
    await deleteDoc(doc(db, 'employees', employeeId));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    return false;
  }
}

export async function deleteQuoteFromFirestore(quoteId: string) {
  const path = `quotes/${quoteId}`;
  try {
    await deleteDoc(doc(db, 'quotes', quoteId));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    return false;
  }
}

export async function deleteAPUItemFromFirestore(apuId: string) {
  const path = `apuItems/${apuId}`;
  try {
    await deleteDoc(doc(db, 'apuItems', apuId));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    return false;
  }
}

export async function deleteScheduleTaskFromFirestore(taskId: string) {
  const path = `scheduleTasks/${taskId}`;
  try {
    await deleteDoc(doc(db, 'scheduleTasks', taskId));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    return false;
  }
}

export async function deleteMilestoneFromFirestore(milestoneId: string) {
  const path = `milestones/${milestoneId}`;
  try {
    await deleteDoc(doc(db, 'milestones', milestoneId));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    return false;
  }
}

export async function deleteTaskReminderFromFirestore(reminderId: string) {
  const path = `taskReminders/${reminderId}`;
  try {
    await deleteDoc(doc(db, 'taskReminders', reminderId));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    return false;
  }
}


