#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const collectionNames = [
  'projects',
  'fieldVisits',
  'expenses',
  'attendance',
  'machinery',
  'employees',
  'quotes',
  'apuItems',
  'scheduleTasks',
  'milestones',
  'taskReminders',
  'companySettings',
];

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_CREDENTIALS_PATH;
const dryRun = !serviceAccountPath || process.env.FIREBASE_MIGRATION_DRY_RUN === '1';

function log(message) {
  console.log(`[firestore-ownership-migration] ${message}`);
}

async function main() {
  log(`Starting ownership migration (${dryRun ? 'dry-run' : 'live'} mode).`);

  if (dryRun) {
    log('No Firebase service account configured. Printing planned migration only.');
    for (const collectionName of collectionNames) {
      log(`Would normalize ${collectionName}: ownerId = authorId when needed; fill createdAt/updatedAt if missing`);
    }
    return;
  }

  let admin;
  try {
    admin = require('firebase-admin');
  } catch (error) {
    log('firebase-admin is not installed in this environment. Install it to run the live migration.');
    process.exit(1);
  }

  const resolvedPath = path.resolve(serviceAccountPath);
  if (!fs.existsSync(resolvedPath)) {
    log(`Service account file not found: ${resolvedPath}`);
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

  const db = admin.firestore();

  for (const collectionName of collectionNames) {
    log(`Migrating ${collectionName}`);
    const snapshot = await db.collection(collectionName).get();
    let updated = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const updates = {};

      if (!data.ownerId && data.authorId) {
        updates.ownerId = data.authorId;
      }
      if (!data.authorId && data.ownerId) {
        updates.authorId = data.ownerId;
      }
      if (!data.createdAt) {
        updates.createdAt = new Date().toISOString();
      }
      if (!data.updatedAt) {
        updates.updatedAt = new Date().toISOString();
      }

      if (Object.keys(updates).length > 0) {
        await doc.ref.update(updates);
        updated += 1;
      }
    }

    log(`Finished ${collectionName}: ${updated} documents updated.`);
  }

  log('Ownership migration completed successfully.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
