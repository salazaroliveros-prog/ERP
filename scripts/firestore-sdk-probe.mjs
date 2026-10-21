#!/usr/bin/env node
/**
 * Reproduce EXACTAMENTE el camino de código de la app usando el SDK Web de Firebase.
 * Usa la misma config (firebase-applet-config.json) y las mismas funciones de
 * lib/firebaseService.ts: getUserOwnedDocuments / subscribeUserOwnedDocuments.
 *
 * Uso: node scripts/firestore-sdk-probe.mjs
 */
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore, collection, query, where, getDocs, setDoc, doc, deleteDoc, getDoc,
} from 'firebase/firestore';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const config = require('../firebase-applet-config.json');

const KEY = config.apiKey;
const EMAIL = 'erp.diag.test@gmail.com';
const PASS = 'DiagTest-2026!';

const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

const log = (...a) => console.log(...a);
const err = (e) => ({
  name: e?.name, code: e?.code, message: e?.message,
});

(async () => {
  log('== 0. Init ==');
  log('databaseId usado:', config.firestoreDatabaseId);
  log('projectId:', config.projectId);
  log('appId:', config.appId);
  log('apiKey prefix:', String(KEY).slice(0, 12) + '...');

  log('\n== 1. signInWithEmailAndPassword ==');
  const cred = await signInWithEmailAndPassword(auth, EMAIL, PASS);
  const uid = cred.user.uid;
  log('uid:', uid, '| emailVerified:', cred.user.emailVerified);

  log('\n== 2. getUserOwnedDocuments("projects", uid) ==');
  // Exactamente lo que hace firebaseService.getUserOwnedDocuments
  try {
    const ownerQuery = query(collection(db, 'projects'), where('ownerId', '==', uid));
    const authorQuery = query(collection(db, 'projects'), where('authorId', '==', uid));
    const [o, a] = await Promise.all([getDocs(ownerQuery), getDocs(authorQuery)]);
    log('OK owner docs:', o.docs.length, '| author docs:', a.docs.length);
  } catch (e) {
    log('FALLO:', JSON.stringify(err(e)));
  }

  log('\n== 3. setDoc merge (create proyecto) ==');
  const pid = 'sdk_proj_' + Date.now();
  try {
    await setDoc(doc(db, 'projects', pid), {
      id: pid, code: 'SDK-001', name: 'SDK probe', client: 'Probe',
      budgetTotal: 1000, spentTotal: 0, status: 'En Ejecución',
      ownerId: uid, authorId: uid,
    }, { merge: true });
    log('OK create', pid);
  } catch (e) {
    log('FALLO:', JSON.stringify(err(e)));
  }

  log('\n== 4. getDocs ownerId-filter (tras crear) ==');
  try {
    const q = query(collection(db, 'projects'), where('ownerId', '==', uid));
    const s = await getDocs(q);
    log('OK docs:', s.docs.length, s.docs.map(d => d.id));
  } catch (e) {
    log('FALLO:', JSON.stringify(err(e)));
  }

  log('\n== 5. getDocs authorId-filter ==');
  try {
    const q = query(collection(db, 'projects'), where('authorId', '==', uid));
    const s = await getDocs(q);
    log('OK docs:', s.docs.length);
  } catch (e) {
    log('FALLO:', JSON.stringify(err(e)));
  }

  log('\n== 6. Todas las colecciones: query ownerId ==');
  for (const col of ['projects','fieldVisits','expenses','attendance','companySettings','machinery','machineryLogs','employees','quotes','apuItems','scheduleTasks','milestones','taskReminders']) {
    for (const field of ['ownerId','authorId']) {
      try {
        const q = query(collection(db, col), where(field, '==', uid));
        const s = await getDocs(q);
        log(`  ${col}.${field} -> OK (${s.docs.length})`);
      } catch (e) {
        log(`  ${col}.${field} -> FALLO ${e.code}: ${e.message}`);
      }
    }
  }

  log('\n== 7. List SIN filtro (no usado por la app, referencia) ==');
  try {
    const s = await getDocs(collection(db, 'projects'));
    log('OK docs:', s.docs.length);
  } catch (e) {
    log('FALLO (esperado por rules):', e.code, '-', e.message);
  }

  log('\n== 8. Limpieza ==');
  try {
    await deleteDoc(doc(db, 'projects', pid));
    log('delete OK');
  } catch (e) {
    log('delete FALLO:', JSON.stringify(err(e)));
  }
})();
