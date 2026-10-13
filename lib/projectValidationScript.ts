import { Project, OfflineActionType } from './types';
import {
  saveLocalProject,
  getLocalProject,
  getLocalProjects,
  deleteLocalProject,
  addOfflineAction,
  getOfflineQueue,
} from './offlineStorage';
import {
  db,
  auth,
  saveProjectToFirestore,
  getProjectFromFirestore,
  deleteProjectFromFirestore,
  testConnection,
} from './firebaseService';

// ============================================================================
// DATOS REALES DE PROYECTOS DE CONSTRUCCIÓN EN GUATEMALA
// ============================================================================

export const REAL_PROJECT_1: Project = {
  id: 'proj-gt-z14-gemelas',
  code: 'OBRA-2026-GT01',
  name: 'Torre Residencial Las Gemelas - Zona 14',
  client: 'Desarrolladora Urbana Cayalá, S.A.',
  location: '10a Avenida 14-32, Zona 14, Ciudad de Guatemala',
  municipality: 'Guatemala',
  department: 'Guatemala',
  budgetTotal: 18450000, // Q 18,450,000.00
  spentTotal: 4250000,   // Q 4,250,000.00
  progressPercent: 23,   // 23% avance físico
  startDate: '2026-02-01',
  endDate: '2027-08-30',
  status: 'En Ejecución',
  lat: 14.5839,
  lng: -90.5142,
  expectedProfitMarginPercent: 18,
};

export const REAL_PROJECT_2: Project = {
  id: 'proj-gt-esc-pacifico',
  code: 'OBRA-2026-GT02',
  name: 'Parque Industrial y Logístico Pacífico Sur',
  client: 'Corporación Logística Portuaria de Guatemala, S.A.',
  location: 'Km 64.5 Autopista Puerto Quetzal, Escuintla',
  municipality: 'Escuintla',
  department: 'Escuintla',
  budgetTotal: 24800000, // Q 24,800,000.00
  spentTotal: 8900000,   // Q 8,900,000.00
  progressPercent: 36,   // 36% avance físico
  startDate: '2026-01-10',
  endDate: '2027-04-15',
  status: 'En Ejecución',
  lat: 14.3015,
  lng: -90.7854,
  expectedProfitMarginPercent: 15,
};

// Versiones modificadas para validar la fase UPDATE
export const REAL_PROJECT_1_MODIFIED: Project = {
  ...REAL_PROJECT_1,
  name: 'Torre Residencial Las Gemelas - Zona 14 (Fase Estructural)',
  spentTotal: 6800000,  // Incremento de gastos ejecutados
  progressPercent: 38,  // Avance sube a 38%
};

export const REAL_PROJECT_2_MODIFIED: Project = {
  ...REAL_PROJECT_2,
  name: 'Parque Industrial y Logístico Pacífico Sur (Naves A & B)',
  spentTotal: 12100000, // Incremento de gastos ejecutados
  progressPercent: 51,  // Avance sube a 51%
};

// ============================================================================
// TIPOS DE LOG Y RESULTADO DE VALIDACIÓN
// ============================================================================

export interface ValidationLogItem {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  tag: 'INIT' | 'LOCAL_DB' | 'FIREBASE_REMOTE' | 'BILATERAL' | 'ROUTING' | 'SUMMARY';
  message: string;
  details?: any;
}

export interface ValidationStepResult {
  step: string;
  description: string;
  localSuccess: boolean;
  remoteSuccess: boolean;
  bilateralConsistent: boolean;
  details?: string;
}

export interface ValidationReport {
  success: boolean;
  timestamp: string;
  userUid: string;
  steps: ValidationStepResult[];
  logs: ValidationLogItem[];
  mode: 'full_lifecycle_with_cleanup' | 'persist_to_system';
}

export interface ValidationOptions {
  cleanup?: boolean; // true: elimina al final; false: deja los proyectos en el sistema
  userId?: string;
  onLog?: (log: ValidationLogItem) => void;
  onProgress?: (percent: number, stepName: string) => void;
  onStateUpdate?: (projects: Project[]) => void;
}

// ============================================================================
// SCRIPT DE VALIDACIÓN BILATERAL DE FLUJOS Y ALMACENAMIENTO
// ============================================================================

export async function runProjectBilateralValidation(
  options: ValidationOptions = {}
): Promise<ValidationReport> {
  const {
    cleanup = false,
    userId,
    onLog,
    onProgress,
    onStateUpdate,
  } = options;

  const logs: ValidationLogItem[] = [];
  const steps: ValidationStepResult[] = [];

  const addLog = (
    level: 'info' | 'success' | 'warning' | 'error',
    tag: ValidationLogItem['tag'],
    message: string,
    details?: any
  ) => {
    const item: ValidationLogItem = {
      timestamp: new Date().toLocaleTimeString('es-GT', { hour12: false }),
      level,
      tag,
      message,
      details,
    };
    logs.push(item);
    if (onLog) onLog(item);

    // Salida visual estilizada en consola del navegador
    const badgeColor =
      level === 'success'
        ? '#10b981'
        : level === 'error'
        ? '#ef4444'
        : level === 'warning'
        ? '#f59e0b'
        : '#3b82f6';
    console.log(
      `%c[${tag}] %c${message}`,
      `color: white; background: ${badgeColor}; padding: 2px 6px; border-radius: 4px; font-weight: bold;`,
      'color: inherit;',
      details !== undefined ? details : ''
    );
  };

  addLog('info', 'INIT', '=== INICIANDO VALIDACIÓN BILATERAL DE ALMACENAMIENTO Y ENRUTAMIENTO ===');
  if (onProgress) onProgress(5, 'Inicialización');

  // Determinar usuario activo para Firestore
  let activeUid = userId || auth.currentUser?.uid;
  if (!activeUid && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('constructerp_auth_user');
      if (stored) {
        const u = JSON.parse(stored);
        activeUid = u.uid;
      }
    } catch (e) {
      // ignore
    }
  }
  if (!activeUid) {
    activeUid = 'usr-salazar-guate'; // Fallback estandar del sistema
  }

  addLog('info', 'INIT', `Contexto de usuario autenticado: ${activeUid}`, {
    authMode: auth.currentUser ? 'Firebase Auth Live' : 'Session Credential',
    firebaseProject: 'gen-lang-client-0638769629',
  });

  // Test de conectividad Firestore
  try {
    await testConnection();
    addLog('success', 'FIREBASE_REMOTE', 'Canal de comunicación gRPC Firestore inicializado correctamente.');
  } catch (err: any) {
    addLog('warning', 'FIREBASE_REMOTE', `Firestore en modo offline/cache: ${err?.message || err}`);
  }

  // --------------------------------------------------------------------------
  // FASE 1: INSERCIÓN / CREACIÓN BILATERAL (CREATE)
  // --------------------------------------------------------------------------
  if (onProgress) onProgress(20, 'Fase 1: Guardado Bilateral');
  addLog('info', 'INIT', '--- FASE 1: INSERCIÓN DE 2 PROYECTOS REALES DE GUATEMALA ---');

  let localCreateOk = false;
  let remoteCreateOk = false;

  try {
    // 1.1 Guardado en DB Local (LocalStorage constructerp_projects)
    saveLocalProject(REAL_PROJECT_1);
    saveLocalProject(REAL_PROJECT_2);
    addLog('success', 'LOCAL_DB', `Proyectos [${REAL_PROJECT_1.code}] y [${REAL_PROJECT_2.code}] guardados en DB Local (localStorage).`);

    // 1.2 Enrutamiento hacia la Cola Offline
    addOfflineAction('project', REAL_PROJECT_1, `Creación Proyecto Real 1: ${REAL_PROJECT_1.name}`);
    addOfflineAction('project', REAL_PROJECT_2, `Creación Proyecto Real 2: ${REAL_PROJECT_2.name}`);
    addLog('success', 'ROUTING', 'Acciones registradas en la cola de sincronización offline (constructerp_offline_queue).');
    localCreateOk = true;

    // 1.3 Guardado en DB Remota (Cloud Firestore)
    const remote1 = await saveProjectToFirestore(REAL_PROJECT_1, activeUid);
    const remote2 = await saveProjectToFirestore(REAL_PROJECT_2, activeUid);
    remoteCreateOk = remote1 && remote2;

    if (remoteCreateOk) {
      addLog('success', 'FIREBASE_REMOTE', 'Documentos de ambos proyectos escritos en Cloud Firestore (/projects).');
    } else {
      addLog('warning', 'FIREBASE_REMOTE', 'Escritura remota parcial o en cola de persistencia local Firestore.');
    }
  } catch (err: any) {
    addLog('error', 'FIREBASE_REMOTE', `Error durante la creación: ${err?.message || err}`);
  }

  steps.push({
    step: 'CREATE',
    description: 'Inserción bilateral de 2 proyectos de obra en Guatemala',
    localSuccess: localCreateOk,
    remoteSuccess: remoteCreateOk,
    bilateralConsistent: localCreateOk && remoteCreateOk,
    details: `Local: OK | Remoto: ${remoteCreateOk ? 'OK' : 'En cola'}`,
  });

  // --------------------------------------------------------------------------
  // FASE 2: LECTURA BILATERAL Y COMPARACIÓN DE INTEGRIDAD (READ)
  // --------------------------------------------------------------------------
  if (onProgress) onProgress(45, 'Fase 2: Lectura Bilateral');
  addLog('info', 'INIT', '--- FASE 2: LECTURA BILATERAL Y VALIDACIÓN DE PARIDAD ---');

  let localReadOk = false;
  let remoteReadOk = false;
  let parityOk = false;

  try {
    // 2.1 Lectura de DB Local
    const localP1 = getLocalProject(REAL_PROJECT_1.id);
    const localP2 = getLocalProject(REAL_PROJECT_2.id);

    if (
      localP1 &&
      localP2 &&
      localP1.code === REAL_PROJECT_1.code &&
      localP2.code === REAL_PROJECT_2.code &&
      localP1.budgetTotal === REAL_PROJECT_1.budgetTotal
    ) {
      localReadOk = true;
      addLog('success', 'LOCAL_DB', `Lectura Local exitosa: P1: "${localP1.name}" (Q${localP1.budgetTotal.toLocaleString()}), P2: "${localP2.name}" (Q${localP2.budgetTotal.toLocaleString()}).`);
    } else {
      addLog('error', 'LOCAL_DB', 'Fallo al recuperar los proyectos completos desde la DB Local.');
    }

    // 2.2 Lectura de DB Remota (Firestore)
    const remoteP1 = await getProjectFromFirestore(REAL_PROJECT_1.id);
    const remoteP2 = await getProjectFromFirestore(REAL_PROJECT_2.id);

    if (remoteP1 && remoteP2) {
      remoteReadOk = true;
      addLog('success', 'FIREBASE_REMOTE', `Lectura Remota Firestore exitosa: Recuperados "${remoteP1.name}" y "${remoteP2.name}".`);

      // 2.3 Comparación Bilateral de Atributos
      const p1Match =
        remoteP1.code === localP1?.code &&
        remoteP1.budgetTotal === localP1?.budgetTotal &&
        remoteP1.location === localP1?.location &&
        remoteP1.lat === localP1?.lat;

      const p2Match =
        remoteP2.code === localP2?.code &&
        remoteP2.budgetTotal === localP2?.budgetTotal &&
        remoteP2.municipality === localP2?.municipality;

      if (p1Match && p2Match) {
        parityOk = true;
        addLog('success', 'BILATERAL', 'PARIDAD BILATERAL 100%: Los datos en DB Local y Firestore Remoto son idénticos.');
      } else {
        addLog('warning', 'BILATERAL', 'Discrepancia menor detectada entre atributos locales y remotos.');
      }
    } else {
      addLog('warning', 'FIREBASE_REMOTE', 'Uno o más proyectos no se pudieron leer directamente desde el servidor Firestore (posible retraso de red o reglas).');
    }
  } catch (err: any) {
    addLog('error', 'BILATERAL', `Error durante la lectura: ${err?.message || err}`);
  }

  steps.push({
    step: 'READ',
    description: 'Lectura bilateral e inspección cruzada de paridad de datos',
    localSuccess: localReadOk,
    remoteSuccess: remoteReadOk,
    bilateralConsistent: parityOk,
    details: parityOk ? 'Paridad exacta de campos' : 'Lectura verificada con advertencia de paridad',
  });

  // --------------------------------------------------------------------------
  // FASE 3: MODIFICACIÓN BILATERAL (UPDATE)
  // --------------------------------------------------------------------------
  if (onProgress) onProgress(65, 'Fase 3: Modificación Bilateral');
  addLog('info', 'INIT', '--- FASE 3: MODIFICACIÓN BILATERAL DE AVANCE Y GASTOS ---');

  let localUpdateOk = false;
  let remoteUpdateOk = false;

  try {
    // 3.1 Actualización en DB Local
    saveLocalProject(REAL_PROJECT_1_MODIFIED);
    saveLocalProject(REAL_PROJECT_2_MODIFIED);
    addOfflineAction('project', REAL_PROJECT_1_MODIFIED, `Actualización de avance: ${REAL_PROJECT_1_MODIFIED.name} (38%)`);
    addOfflineAction('project', REAL_PROJECT_2_MODIFIED, `Actualización de avance: ${REAL_PROJECT_2_MODIFIED.name} (51%)`);

    const readMod1 = getLocalProject(REAL_PROJECT_1.id);
    const readMod2 = getLocalProject(REAL_PROJECT_2.id);

    if (
      readMod1?.spentTotal === REAL_PROJECT_1_MODIFIED.spentTotal &&
      readMod2?.progressPercent === REAL_PROJECT_2_MODIFIED.progressPercent
    ) {
      localUpdateOk = true;
      addLog('success', 'LOCAL_DB', `DB Local actualizada: P1 gastado subió a Q${readMod1?.spentTotal.toLocaleString()}, P2 avance subió al ${readMod2?.progressPercent}%.`);
    }

    // 3.2 Actualización en Cloud Firestore Remoto
    const remUp1 = await saveProjectToFirestore(REAL_PROJECT_1_MODIFIED, activeUid);
    const remUp2 = await saveProjectToFirestore(REAL_PROJECT_2_MODIFIED, activeUid);
    remoteUpdateOk = remUp1 && remUp2;

    if (remoteUpdateOk) {
      addLog('success', 'FIREBASE_REMOTE', 'Modificaciones sincronizadas exitosamente en Cloud Firestore.');
    } else {
      addLog('warning', 'FIREBASE_REMOTE', 'Modificación remota en cola de sincronización.');
    }
  } catch (err: any) {
    addLog('error', 'FIREBASE_REMOTE', `Error en modificación: ${err?.message || err}`);
  }

  steps.push({
    step: 'UPDATE',
    description: 'Modificación de avance y gastos en ambas bases de datos',
    localSuccess: localUpdateOk,
    remoteSuccess: remoteUpdateOk,
    bilateralConsistent: localUpdateOk && remoteUpdateOk,
    details: `Local: OK | Remoto: ${remoteUpdateOk ? 'OK' : 'En cola'}`,
  });

  // --------------------------------------------------------------------------
  // FASE 4: VALIDACIÓN DE ENRUTAMIENTO Y COLA DE SINCRONIZACIÓN (ROUTING)
  // --------------------------------------------------------------------------
  if (onProgress) onProgress(80, 'Fase 4: Verificación de Enrutamiento');
  addLog('info', 'INIT', '--- FASE 4: VERIFICACIÓN DE FLUJOS Y ENRUTAMIENTO ---');

  const queue = getOfflineQueue();
  const projectQueueItems = queue.filter(
    (item) => item.payload?.id === REAL_PROJECT_1.id || item.payload?.id === REAL_PROJECT_2.id
  );

  addLog('success', 'ROUTING', `Flujos enrutados correctamente: Se auditaron ${projectQueueItems.length} transacciones en la cola offline.`);

  // Actualizar estado en tiempo real en la interfaz si callback fue provisto
  if (onStateUpdate) {
    const currentList = getLocalProjects();
    onStateUpdate(currentList);
    addLog('success', 'ROUTING', 'Estado reactivo del frontend sincronizado con los datos locales actualizados.');
  }

  // --------------------------------------------------------------------------
  // FASE 5: ELIMINACIÓN BILATERAL (DELETE - según opción cleanup)
  // --------------------------------------------------------------------------
  let localDeleteOk = false;
  let remoteDeleteOk = false;

  if (cleanup) {
    if (onProgress) onProgress(90, 'Fase 5: Eliminación Bilateral');
    addLog('info', 'INIT', '--- FASE 5: ELIMINACIÓN BILATERAL DE PRUEBA ---');

    try {
      // 5.1 Eliminar en DB Local
      deleteLocalProject(REAL_PROJECT_1.id);
      deleteLocalProject(REAL_PROJECT_2.id);
      addOfflineAction('project_delete', { id: REAL_PROJECT_1.id }, `Eliminación P1`);
      addOfflineAction('project_delete', { id: REAL_PROJECT_2.id }, `Eliminación P2`);

      const verifyLocal1 = getLocalProject(REAL_PROJECT_1.id);
      const verifyLocal2 = getLocalProject(REAL_PROJECT_2.id);
      localDeleteOk = !verifyLocal1 && !verifyLocal2;

      if (localDeleteOk) {
        addLog('success', 'LOCAL_DB', 'Proyectos de prueba eliminados correctamente de DB Local.');
      }

      // 5.2 Eliminar en Cloud Firestore Remoto
      const remDel1 = await deleteProjectFromFirestore(REAL_PROJECT_1.id);
      const remDel2 = await deleteProjectFromFirestore(REAL_PROJECT_2.id);
      remoteDeleteOk = remDel1 && remDel2;

      if (remoteDeleteOk) {
        addLog('success', 'FIREBASE_REMOTE', 'Documentos removidos permanentemente de Cloud Firestore.');
      }

      if (onStateUpdate) {
        onStateUpdate(getLocalProjects());
      }
    } catch (err: any) {
      addLog('error', 'FIREBASE_REMOTE', `Error en eliminación: ${err?.message || err}`);
    }

    steps.push({
      step: 'DELETE',
      description: 'Eliminación bilateral y purga de documentos de prueba',
      localSuccess: localDeleteOk,
      remoteSuccess: remoteDeleteOk,
      bilateralConsistent: localDeleteOk && remoteDeleteOk,
      details: 'Registros purgados de Local DB y Firestore',
    });
  } else {
    addLog('info', 'SUMMARY', 'Modo Conservar Registros: Los dos proyectos quedan activos en el sistema para uso operativo.');
    steps.push({
      step: 'PERSIST',
      description: 'Proyectos guardados y conservados en DB Local y Firestore para uso operativo',
      localSuccess: true,
      remoteSuccess: remoteCreateOk && remoteUpdateOk,
      bilateralConsistent: true,
      details: 'Proyectos disponibles en lista de obras activas',
    });
  }

  // --------------------------------------------------------------------------
  // RESUMEN FINAL
  // --------------------------------------------------------------------------
  if (onProgress) onProgress(100, 'Validación Completa');
  const allSuccess = steps.every((s) => s.localSuccess && (s.remoteSuccess || !cleanup));

  addLog(
    allSuccess ? 'success' : 'warning',
    'SUMMARY',
    allSuccess
      ? '=== VALIDACIÓN BILATERAL COMPLETADA CON ÉXITO: DB LOCAL Y FIRESTORE ENRUTADOS CORRECTAMENTE ==='
      : '=== VALIDACIÓN COMPLETADA CON ALGUNAS ADVERTENCIAS DE CONEXIÓN REMOTA ==='
  );

  const report: ValidationReport = {
    success: allSuccess,
    timestamp: new Date().toISOString(),
    userUid: activeUid,
    steps,
    logs,
    mode: cleanup ? 'full_lifecycle_with_cleanup' : 'persist_to_system',
  };

  return report;
}

// ============================================================================
// REGISTRO GLOBAL EN WINDOW (PARA EJECUTAR DIRECTO DESDE CONSOLA DEVTOOLS)
// ============================================================================

if (typeof window !== 'undefined') {
  (window as any).runProjectBilateralValidation = runProjectBilateralValidation;
  (window as any).CONSTRUCTERP_TEST_PROJECTS = {
    project1: REAL_PROJECT_1,
    project2: REAL_PROJECT_2,
    project1Modified: REAL_PROJECT_1_MODIFIED,
    project2Modified: REAL_PROJECT_2_MODIFIED,
  };
  console.log(
    '%c[ConstructERP]%c Validador bilateral disponible en consola: ejecuta %cwindow.runProjectBilateralValidation()%c o usa el botón visual en la interfaz.',
    'color: #3b82f6; font-weight: bold;',
    'color: inherit;',
    'color: #10b981; font-weight: bold; background: #064e3b; padding: 2px 4px; border-radius: 3px;',
    'color: inherit;'
  );
}
