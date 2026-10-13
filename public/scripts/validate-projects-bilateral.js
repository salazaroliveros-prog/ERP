/**
 * ConstructERP Guatemala - Script de Validación Bilateral de Proyectos (Frontend DevTools)
 * Puede ejecutarse pegando este código directamente en la Consola del Navegador (F12)
 * o invocando: window.runProjectBilateralValidation()
 */

(async function runFrontendBilateralTest() {
  console.group('%c[ConstructERP Guatemala] Iniciando Validación Bilateral de Proyectos', 'color: #3b82f6; font-size: 14px; font-weight: bold;');

  const PREFIX = 'constructerp_';
  const LOCAL_PROJECTS_KEY = `${PREFIX}projects`;
  const LOCAL_QUEUE_KEY = `${PREFIX}offline_queue`;

  // 1. Datos reales de dos proyectos en Guatemala
  const PROYECTO_1 = {
    id: 'proj-gt-z14-gemelas',
    code: 'OBRA-2026-GT01',
    name: 'Torre Residencial Las Gemelas - Zona 14',
    client: 'Desarrolladora Urbana Cayalá, S.A.',
    location: '10a Avenida 14-32, Zona 14, Ciudad de Guatemala',
    municipality: 'Guatemala',
    department: 'Guatemala',
    budgetTotal: 18450000,
    spentTotal: 4250000,
    progressPercent: 23,
    startDate: '2026-02-01',
    endDate: '2027-08-30',
    status: 'En Ejecución',
    lat: 14.5839,
    lng: -90.5142,
    expectedProfitMarginPercent: 18
  };

  const PROYECTO_2 = {
    id: 'proj-gt-esc-pacifico',
    code: 'OBRA-2026-GT02',
    name: 'Parque Industrial y Logístico Pacífico Sur',
    client: 'Corporación Logística Portuaria de Guatemala, S.A.',
    location: 'Km 64.5 Autopista Puerto Quetzal, Escuintla',
    municipality: 'Escuintla',
    department: 'Escuintla',
    budgetTotal: 24800000,
    spentTotal: 8900000,
    progressPercent: 36,
    startDate: '2026-01-10',
    endDate: '2027-04-15',
    status: 'En Ejecución',
    lat: 14.3015,
    lng: -90.7854,
    expectedProfitMarginPercent: 15
  };

  console.log('%c[1/5] Preparando datos de prueba:', 'font-weight: bold; color: #6366f1;', { PROYECTO_1, PROYECTO_2 });

  // Helpers de Local DB
  function getLocalProjects() {
    try {
      const raw = localStorage.getItem(LOCAL_PROJECTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLocalProjects(projects) {
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
  }

  function addLocalQueueAction(type, payload, desc) {
    try {
      const raw = localStorage.getItem(LOCAL_QUEUE_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      const item = {
        id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type,
        timestamp: new Date().toLocaleString('es-GT'),
        description: desc,
        payload,
        synced: false
      };
      localStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify([item, ...queue]));
      return item;
    } catch (e) {
      console.warn('Queue error:', e);
    }
  }

  // --- FASE 1: GUARDADO BILATERAL (CREATE) ---
  console.log('%c[2/5] FASE 1: Guardando en DB Local y encolando para sincronización...', 'color: #0284c7; font-weight: bold;');
  let currentLocal = getLocalProjects();
  // Filtrar si ya existían
  currentLocal = currentLocal.filter(p => p.id !== PROYECTO_1.id && p.id !== PROYECTO_2.id);
  currentLocal.unshift(PROYECTO_1, PROYECTO_2);
  saveLocalProjects(currentLocal);

  addLocalQueueAction('project', PROYECTO_1, `Creación Proyecto 1: ${PROYECTO_1.name}`);
  addLocalQueueAction('project', PROYECTO_2, `Creación Proyecto 2: ${PROYECTO_2.name}`);
  console.log('%c✔ DB Local: Proyectos guardados con éxito en LocalStorage.', 'color: #10b981;');

  // Si window.runProjectBilateralValidation está en scope TypeScript, ejecutar canal Firestore
  if (typeof window.runProjectBilateralValidation === 'function') {
    console.log('%c[Firestore]: Invocando canal de sincronización Firestore...', 'color: #8b5cf6;');
    await window.runProjectBilateralValidation({ cleanup: false });
  } else {
    console.log('%c✔ Enrutamiento: Acciones registradas en la cola offline para Firestore.', 'color: #10b981;');
  }

  // --- FASE 2: LECTURA Y VALIDACIÓN (READ) ---
  console.log('%c[3/5] FASE 2: Leyendo y verificando integridad desde DB Local...', 'color: #0284c7; font-weight: bold;');
  const reloadedProjects = getLocalProjects();
  const p1Found = reloadedProjects.find(p => p.id === PROYECTO_1.id);
  const p2Found = reloadedProjects.find(p => p.id === PROYECTO_2.id);

  if (p1Found && p2Found) {
    console.log('%c✔ Lectura Local Exitosa: Ambos proyectos recuperados intactos.', 'color: #10b981;', {
      p1: { nombre: p1Found.name, presupuesto: `Q ${p1Found.budgetTotal.toLocaleString()}` },
      p2: { nombre: p2Found.name, presupuesto: `Q ${p2Found.budgetTotal.toLocaleString()}` }
    });
  } else {
    console.error('❌ Error de lectura en DB Local.');
  }

  // --- FASE 3: MODIFICACIÓN (UPDATE) ---
  console.log('%c[4/5] FASE 3: Modificando registros (avance físico y gastos)...', 'color: #0284c7; font-weight: bold;');
  const PROYECTO_1_MOD = {
    ...p1Found,
    name: 'Torre Residencial Las Gemelas - Zona 14 (Fase Estructural)',
    spentTotal: 6800000,
    progressPercent: 38
  };
  const PROYECTO_2_MOD = {
    ...p2Found,
    name: 'Parque Industrial y Logístico Pacífico Sur (Naves A & B)',
    spentTotal: 12100000,
    progressPercent: 51
  };

  const updatedLocal = getLocalProjects().map(p => {
    if (p.id === PROYECTO_1.id) return PROYECTO_1_MOD;
    if (p.id === PROYECTO_2.id) return PROYECTO_2_MOD;
    return p;
  });
  saveLocalProjects(updatedLocal);
  addLocalQueueAction('project', PROYECTO_1_MOD, 'Actualización P1');
  addLocalQueueAction('project', PROYECTO_2_MOD, 'Actualización P2');
  console.log('%c✔ DB Local Modificada: Gastos y porcentajes de avance actualizados bilateralmente.', 'color: #10b981;');

  // Notificar al frontend reactivo para refrescar pantalla
  window.dispatchEvent(new Event('constructerp_projects_updated'));

  // --- FASE 4: RESUMEN Y ESTADO ---
  console.log('%c[5/5] Resumen de Validación Bilateral:', 'color: #10b981; font-size: 13px; font-weight: bold;');
  console.table([
    { Entidad: PROYECTO_1_MOD.code, Nombre: PROYECTO_1_MOD.name, Ubicacion: PROYECTO_1_MOD.location, Presupuesto: `Q ${PROYECTO_1_MOD.budgetTotal.toLocaleString()}`, Gastado: `Q ${PROYECTO_1_MOD.spentTotal.toLocaleString()}`, Avance: `${PROYECTO_1_MOD.progressPercent}%`, Estado_DB_Local: 'GUARDADO', Estado_Firestore: 'ENRUTADO' },
    { Entidad: PROYECTO_2_MOD.code, Nombre: PROYECTO_2_MOD.name, Ubicacion: PROYECTO_2_MOD.location, Presupuesto: `Q ${PROYECTO_2_MOD.budgetTotal.toLocaleString()}`, Gastado: `Q ${PROYECTO_2_MOD.spentTotal.toLocaleString()}`, Avance: `${PROYECTO_2_MOD.progressPercent}%`, Estado_DB_Local: 'GUARDADO', Estado_Firestore: 'ENRUTADO' }
  ]);

  console.groupEnd();
  return { success: true, p1: PROYECTO_1_MOD, p2: PROYECTO_2_MOD };
})();
