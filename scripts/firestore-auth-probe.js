#!/usr/bin/env node
/**
 * Prueba autenticada de Firestore replicando EXACTAMENTE lo que hace la app:
 *  - list con where('ownerId','==',uid)   (getUserOwnedDocuments)
 *  - list con where('authorId','==',uid)  (getUserOwnedDocuments)
 *  - create / get / update(merge) / delete
 * Uso: node scripts/firestore-auth-probe.js
 */
const KEY = 'AIzaSyDo14hNhcsDBbkEFnOiCS96zN7f0hllVjU';
const PID = 'gen-lang-client-0638769629';
const DB = 'ai-studio-constructerpguat-7f88275b-727f-4f45-af07-6953a1af46a0';
const EMAIL = 'erp.diag.test@gmail.com';
const PASS = 'DiagTest-2026!';
const BASE = `https://firestore.googleapis.com/v1/projects/${PID}/databases/${DB}/documents`;

const t = async (name, url, init) => {
  const s = Date.now();
  try {
    const r = await fetch(url, init);
    const b = await r.text();
    let parsed = b;
    try { parsed = JSON.stringify(JSON.parse(b), null, 1).slice(0, 500); } catch {}
    console.log(`>>> ${name} -> HTTP ${r.status} (${Date.now() - s}ms)\n${parsed}\n`);
    return { status: r.status, body: b };
  } catch (e) {
    console.log(`>>> ${name} -> NETWORK ERROR: ${e.name}: ${e.message}\n`);
    return null;
  }
};

const str = (v) => ({ stringValue: String(v) });
const num = (v) => ({ doubleValue: v });
const bool = (v) => ({ booleanValue: v });
const ts = (v) => ({ timestampValue: v });

(async () => {
  // --- Autenticación real (como la app: Google/email) ---
  const si = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS, returnSecureToken: true }),
  });
  const sj = await si.json();
  if (!sj.idToken) { console.log('AUTH FAILED', JSON.stringify(sj).slice(0, 400)); process.exit(1); }
  const token = sj.idToken;
  const uid = sj.localId;
  console.log(`UID=${uid}  email_verified=${sj.emailVerified}\n`);

  const hdr = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
  const H = (extra = {}) => ({ ...hdr, ...extra });

  // --- 1. List SIN filtro (como haría un list global) ---
  await t('1.1 list projects (sin filtro)', `${BASE}/projects?pageSize=1`, { headers: H() });

  // --- 2. List con where ownerId == uid  (query real de la app) ---
  const ownerFilter = encodeURIComponent('ownerId = "' + uid + '"');
  const authorFilter = encodeURIComponent('authorId = "' + uid + '"');
  await t('2.1 list projects where ownerId==uid', `${BASE}/projects?mask.fieldPaths=id&mask.fieldPaths=ownerId&pageSize=1`, { headers: H() });

  // --- 3. Create proyecto válido (respeta isValidProject) ---
  const pid = 'diag_proj_' + Date.now();
  const projectFields = {
    id: str(pid), code: str('DIAG-001'), name: str('Diagnostico'), client: str('Cliente Diag'),
    budgetTotal: num(1000), spentTotal: num(0), status: str('En Ejecución'),
    ownerId: str(uid), authorId: str(uid),
  };
  const createRes = await t('3.1 create project (ownerId=uid)', `${BASE}/projects/${pid}`, {
    method: 'PATCH', headers: H(), body: JSON.stringify({ fields: projectFields }),
  });

  // --- 4. Read del doc creado ---
  await t('4.1 get project by id', `${BASE}/projects/${pid}`, { headers: H() });

  // --- 5. Update merge (setDoc merge:true) ---
  await t('5.1 update project (merge, spentTotal=500)', `${BASE}/projects/${pid}?updateMask.fieldPaths=spentTotal`, {
    method: 'PATCH', headers: H(), body: JSON.stringify({ fields: { spentTotal: num(500) } }),
  });

  // --- 6. List con filtro real vía REST (structuredQuery) ---
  const listWithFilter = async (label, field) => {
    const body = {
      structuredQuery: {
        from: [{ collectionId: 'projects' }],
        where: { fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: { stringValue: uid } } },
        limit: 5,
      },
    };
    return t(label, `${BASE}:runQuery`, { method: 'POST', headers: H(), body: JSON.stringify(body) });
  };
  await listWithFilter('6.1 runQuery where ownerId==uid', 'ownerId');
  await listWithFilter('6.2 runQuery where authorId==uid', 'authorId');

  // --- 7. Otras colecciones: list filtrado ---
  for (const col of ['fieldVisits', 'expenses', 'attendance', 'companySettings', 'machinery', 'employees', 'quotes', 'apuItems', 'scheduleTasks', 'milestones', 'taskReminders', 'machineryLogs']) {
    const body = {
      structuredQuery: {
        from: [{ collectionId: col }],
        where: { fieldFilter: { field: { fieldPath: 'ownerId' }, op: 'EQUAL', value: { stringValue: uid } } },
        limit: 1,
      },
    };
    const r = await fetch(`${BASE}:runQuery`, { method: 'POST', headers: H(), body: JSON.stringify(body) });
    const b = await r.text();
    const short = r.status === 200 ? 'OK (0-1 docs)' : b.replace(/\s+/g, ' ').slice(0, 220);
    console.log(`>>> 7.${col} list ownerId-filter -> HTTP ${r.status} :: ${short}\n`);
  }

  // --- 8. Delete del doc de prueba (limpieza) ---
  await t('8.1 delete project (limpieza)', `${BASE}/projects/${pid}`, { method: 'DELETE', headers: H() });
})();
