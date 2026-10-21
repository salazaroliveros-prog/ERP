#!/usr/bin/env node
/**
 * Diagnóstico de conectividad a Firebase (Firestore + Identity Toolkit).
 * Uso: node scripts/firebase-connectivity-diagnostic.js
 *
 * No modifica datos: sólo signUp/signIn de un usuario de prueba y lecturas.
 */
const KEY = 'AIzaSyDo14hNhcsDBbkEFnOiCS96zN7f0hllVjU';
const PID = 'gen-lang-client-0638769629';
const DB = 'ai-studio-constructerpguat-7f88275b-727f-4f45-af07-6953a1af46a0';
const EMAIL = 'erp.diag.test@gmail.com';
const PASS = 'DiagTest-2026!';

const t = async (name, url, init) => {
  const s = Date.now();
  try {
    const r = await fetch(url, init);
    const b = await r.text();
    console.log(`--- ${name} -> HTTP ${r.status} (${Date.now() - s}ms)`);
    console.log(b.slice(0, 800));
    return { status: r.status, body: b };
  } catch (e) {
    console.log(`--- ${name} -> NETWORK ERROR (${Date.now() - s}ms): ${e.name}: ${e.message}`);
    if (e.cause) console.log(`    cause: ${e.cause.code || ''} ${e.cause.message || ''}`);
    return null;
  }
};

(async () => {
  console.log('=== 1. Conectividad base ===');
  await t('1.1 googleapis root', 'https://www.googleapis.com/');
  await t('1.2 firestore.googleapis.com', 'https://firestore.googleapis.com/');

  console.log('\n=== 2. Descubrimiento de bases de datos Firestore ===');
  const list = await t('2.1 list databases', `https://firestore.googleapis.com/v1/projects/${PID}/databases?key=${KEY}`);
  const named = await t('2.2 get named database', `https://firestore.googleapis.com/v1/projects/${PID}/databases/${DB}?key=${KEY}`);
  const def = await t('2.3 get default database', `https://firestore.googleapis.com/v1/projects/${PID}/databases/(default)?key=${KEY}`);

  console.log('\n=== 3. Identity Toolkit ===');
  const su = await t('3.1 signUp', `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS, returnSecureToken: true }),
  });
  let idToken = null;
  if (su && su.status === 200) {
    idToken = JSON.parse(su.body).idToken;
  } else {
    const si = await t('3.2 signInWithPassword', `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASS, returnSecureToken: true }),
    });
    if (si && si.status === 200) idToken = JSON.parse(si.body).idToken;
  }

  if (!idToken) {
    console.log('\n=== 4. Sin idToken: no se puede probar Firestore autenticado ===');
    return;
  }
  console.log('\n[idToken obtenido, longitud=' + idToken.length + ']');

  console.log('\n=== 4. Firestore REST autenticado ===');
  const hdr = { 'Authorization': 'Bearer ' + idToken, 'Content-Type': 'application/json' };
  const base = `https://firestore.googleapis.com/v1/projects/${PID}/databases/${DB}/documents`;

  // Lectura de una colección (list)
  await t('4.1 list /projects (db nombrada)', `${base}/projects?pageSize=1`, { headers: hdr });
  // Lectura de la db por defecto
  const defBase = `https://firestore.googleapis.com/v1/projects/${PID}/databases/(default)/documents`;
  await t('4.2 list /projects (db por defecto)', `${defBase}/projects?pageSize=1`, { headers: hdr });
  // Escritura mínima en colección de prueba
  const docId = 'diag_' + Date.now();
  const body = { fields: { id: { stringValue: docId }, ownerId: { stringValue: 'x' } } };
  await t('4.3 create diag doc (db nombrada)', `${base}/projects/${docId}`, {
    method: 'PATCH', headers: hdr, body: JSON.stringify(body),
  });
})();
