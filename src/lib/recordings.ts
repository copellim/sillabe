// Audio stays on this device. No microphone data is uploaded.
export interface Recording {
  key: string;
  blob: Blob;
}
let database: Promise<IDBDatabase> | null = null;
function db(): Promise<IDBDatabase> {
  if (!database)
    database = new Promise((resolve, reject) => {
      const request = indexedDB.open("sillabe-voices", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("clips", { keyPath: "key" });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        database = null;
        reject(request.error);
      };
    });
  return database;
}
export async function getRecording(key: string): Promise<Blob | null> {
  try {
    const database = await db();
    return await new Promise((resolve, reject) => {
      const request = database
        .transaction("clips")
        .objectStore("clips")
        .get(key);
      request.onsuccess = () => resolve(request.result?.blob ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}
export async function recordingKeys(): Promise<string[]> {
  try {
    const database = await db();
    return await new Promise((resolve, reject) => {
      const request = database
        .transaction("clips")
        .objectStore("clips")
        .getAllKeys();
      request.onsuccess = () => resolve(request.result.map(String));
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}
export async function saveRecording(
  key: string,
  blob: Blob | null,
): Promise<void> {
  const database = await db();
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction("clips", "readwrite");
    if (blob) tx.objectStore("clips").put({ key, blob });
    else tx.objectStore("clips").delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
