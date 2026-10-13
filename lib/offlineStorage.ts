import { OfflineQueueItem, AttendanceRecord, Project } from './types';

const PREFIX = 'constructerp_';
const QUEUE_KEY = `${PREFIX}offline_queue`;

export function saveOfflineData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving offline data:', e);
  }
}

export function loadOfflineData<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(`${PREFIX}${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
}

export function getOfflineQueue(): OfflineQueueItem[] {
  return loadOfflineData<OfflineQueueItem[]>('offline_queue', []);
}

export function addOfflineAction(
  type: 'attendance' | 'progress' | 'fieldVisit',
  payload: any,
  description: string
): OfflineQueueItem {
  const queue = getOfflineQueue();
  const newItem: OfflineQueueItem = {
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    timestamp: new Date().toLocaleString('es-GT'),
    description,
    payload,
    synced: false,
  };
  const updated = [newItem, ...queue];
  saveOfflineData('offline_queue', updated);
  return newItem;
}

export function removeOfflineAction(id: string): void {
  const queue = getOfflineQueue();
  const updated = queue.filter((item) => item.id !== id);
  saveOfflineData('offline_queue', updated);
}

export function clearOfflineQueue(): void {
  saveOfflineData('offline_queue', []);
}

export async function processOfflineQueue(
  handler: (item: OfflineQueueItem) => Promise<boolean> | boolean
): Promise<{ processed: number; remaining: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { processed: 0, remaining: 0 };

  const remainingItems: OfflineQueueItem[] = [];
  let processedCount = 0;

  for (const item of queue) {
    try {
      const success = await handler(item);
      if (success) {
        processedCount++;
      } else {
        remainingItems.push(item);
      }
    } catch (err) {
      console.error('Failed to sync item:', item, err);
      remainingItems.push(item);
    }
  }

  saveOfflineData('offline_queue', remainingItems);
  return { processed: processedCount, remaining: remainingItems.length };
}

export function registerServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[ConstructERP SW] Service Worker registrado exitosamente:', reg.scope);
        })
        .catch((err) => {
          console.warn('[ConstructERP SW] Registro de Service Worker omitido:', err);
        });
    });
  }
}

