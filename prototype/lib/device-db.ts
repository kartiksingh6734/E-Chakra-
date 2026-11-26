import { databaseName, deviceSignal, isPagesDemo, pagesScope } from './device-storage';

let connection: Promise<IDBDatabase> | undefined;

function open() {
  if (!connection) {
    connection = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('data');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => { db.close(); connection = undefined; };
        resolve(db);
      };
    }).catch(error => { connection = undefined; throw error; });
  }
  return connection;
}

export function result<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Keep all awaits inside the callback on IndexedDB requests so its transaction
// remains active. IndexedDB serializes read-write transactions across tabs.
export async function withStore<T>(
  mode: IDBTransactionMode, scope: string | undefined,
  run: (store: IDBObjectStore, key: (name: string) => string) => T | Promise<T>,
): Promise<T> {
  const owner = isPagesDemo ? scope ?? pagesScope() : undefined;
  const signal = deviceSignal(owner);
  const db = await open();
  signal.throwIfAborted();
  deviceSignal(owner);
  const tx = db.transaction('data', mode);
  const abort = () => { try { tx.abort(); } catch { /* transaction already finished */ } };
  const done = new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error('Device storage operation was interrupted.'));
  });
  // A device/account change can abort the transaction before its read resumes.
  void done.catch(() => {});
  signal.addEventListener('abort', abort, { once: true });
  const prefix = owner === undefined ? '' : 'user:' + owner + ':';
  try {
    const value = await run(tx.objectStore('data'), name => prefix + name);
    deviceSignal(owner);
    await done;
    signal.throwIfAborted();
    deviceSignal(owner);
    return value;
  } catch (error) {
    abort();
    await done.catch(() => {});
    throw error;
  } finally {
    signal.removeEventListener('abort', abort);
  }
}
