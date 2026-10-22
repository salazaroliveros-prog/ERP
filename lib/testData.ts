// ============================================================================
// DATOS DE PRUEBA / DESARROLLO - Solo para validación bilateral y diagnóstico
// NO son datos de producción. Se usan en BilateralValidationModal y consola.
// ============================================================================
import { Project, PROJECT_STATUSES } from './types';

export const TEST_PROJECT_1: Project = {
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
  status: PROJECT_STATUSES.EJECUCION,
  lat: 14.5839,
  lng: -90.5142,
  expectedProfitMarginPercent: 18,
};

export const TEST_PROJECT_2: Project = {
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
  status: PROJECT_STATUSES.EJECUCION,
  lat: 14.3015,
  lng: -90.7854,
  expectedProfitMarginPercent: 15,
};

export const TEST_PROJECT_1_MODIFIED: Project = {
  ...TEST_PROJECT_1,
  name: 'Torre Residencial Las Gemelas - Zona 14 (Fase Estructural)',
  spentTotal: 6800000,
  progressPercent: 38,
};

export const TEST_PROJECT_2_MODIFIED: Project = {
  ...TEST_PROJECT_2,
  name: 'Parque Industrial y Logístico Pacífico Sur (Naves A & B)',
  spentTotal: 12100000,
  progressPercent: 51,
};
