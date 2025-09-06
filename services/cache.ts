
import { Organisation, Project, FundraisingEvent } from '../types';

const DB_NAME = 'BetterplaceSupportToolDB';
const ORGS_STORE_NAME = 'organisations';
const PROJECTS_STORE_NAME = 'projects';
const EVENTS_STORE_NAME = 'fundraising_events';
const VERSION = 2; // Incremented version for schema change
const CACHE_KEY = 'allData';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// FIX: Export CachedData interface to be accessible from other modules.
export interface CachedData<T> {
  timestamp: number;
  etag: string | null;
  data: T[];
}

let dbPromise: Promise<IDBDatabase> | null = null;

const openDatabase = (): Promise<IDBDatabase> => {
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject('Error opening IndexedDB.');
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(ORGS_STORE_NAME)) {
        db.createObjectStore(ORGS_STORE_NAME);
      }
      if (!db.objectStoreNames.contains(PROJECTS_STORE_NAME)) {
        db.createObjectStore(PROJECTS_STORE_NAME);
      }
      if (!db.objectStoreNames.contains(EVENTS_STORE_NAME)) {
        db.createObjectStore(EVENTS_STORE_NAME);
      }
    };
  });
  return dbPromise;
};

export const saveDataToCache = async <T>(storeName: string, data: T[], etag: string | null): Promise<void> => {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, 'readwrite');
  const store = transaction.objectStore(storeName);

  const dataToCache: CachedData<T> = {
    timestamp: Date.now(),
    data,
    etag,
  };

  store.put(dataToCache, CACHE_KEY);

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(`Failed to save to cache for store: ${storeName}.`);
  });
};

export const getDataFromCache = async <T>(storeName: string): Promise<CachedData<T> | null> => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(CACHE_KEY);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result: CachedData<T> | undefined = request.result;
        resolve(result || null);
      };
      request.onerror = () => {
        console.error(`Error fetching from cache for store ${storeName}:`, request.error);
        reject(null);
      };
    });
  } catch (error) {
    console.error("Could not access IndexedDB. Cache is disabled.", error);
    return null; // Gracefully fail if IndexedDB is blocked or unavailable
  }
};

export const isCacheStale = (timestamp: number): boolean => {
    return (Date.now() - timestamp) > CACHE_DURATION_MS;
};

export const updateCacheTimestamp = async (storeName: string): Promise<void> => {
    const db = await openDatabase();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.get(CACHE_KEY);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            const data: CachedData<any> | undefined = request.result;
            if (data) {
                data.timestamp = Date.now();
                store.put(data, CACHE_KEY);
            }
            resolve();
        };
        request.onerror = () => reject(`Failed to update cache timestamp for store ${storeName}.`);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(`Transaction failed while updating cache timestamp for store ${storeName}.`);
    });
};

// Specific type exports for clarity
export const getOrganisationsFromCache = () => getDataFromCache<Organisation>(ORGS_STORE_NAME);
export const saveOrganisationsToCache = (data: Organisation[], etag: string | null) => saveDataToCache(ORGS_STORE_NAME, data, etag);
export const updateOrganisationsTimestamp = () => updateCacheTimestamp(ORGS_STORE_NAME);

export const getProjectsFromCache = () => getDataFromCache<Project>(PROJECTS_STORE_NAME);
export const saveProjectsToCache = (data: Project[], etag: string | null) => saveDataToCache(PROJECTS_STORE_NAME, data, etag);
export const updateProjectsTimestamp = () => updateCacheTimestamp(PROJECTS_STORE_NAME);

export const getFundraisingEventsFromCache = () => getDataFromCache<FundraisingEvent>(EVENTS_STORE_NAME);
export const saveFundraisingEventsToCache = (data: FundraisingEvent[], etag: string | null) => saveDataToCache(EVENTS_STORE_NAME, data, etag);
export const updateFundraisingEventsTimestamp = () => updateCacheTimestamp(EVENTS_STORE_NAME);
