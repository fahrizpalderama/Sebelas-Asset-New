
import { mongoService } from './mongoService';

// Mock types and functions to replace firebase/firestore
export const collection = (db: any, name: string) => name;
export const doc = (db: any, name: string, id?: string) => ({ collection: name, id });

export const addDoc = async (colName: string, data: any) => {
  return await mongoService.create(colName, data);
};

export const setDoc = async (docRef: any, data: any) => {
  return await mongoService.create(docRef.collection, { ...data, id: docRef.id });
};

export const updateDoc = async (docRef: any, data: any) => {
  return await mongoService.update(docRef.collection, docRef.id, data);
};

export const deleteDoc = async (docRef: any) => {
  return await mongoService.delete(docRef.collection, docRef.id);
};

export const getDoc = async (docRef: any) => {
  const data = await mongoService.get(docRef.collection, docRef.id);
  return {
    exists: () => !!data,
    data: () => data,
    id: data ? data.id : docRef.id
  };
};

export const getDocs = async (colRef: any) => {
  const constraints = Array.isArray(colRef) ? colRef.slice(1) : []; // This matches how query() works in my mock
  const collectionName = Array.isArray(colRef) ? colRef[0] : colRef;
  const data = await mongoService.list(collectionName, constraints);
  return {
    docs: data.map((item: any) => ({
      id: item.id,
      data: () => item
    })),
    empty: data.length === 0
  };
};

// Simplified query/orderBy/limit mocks
export const query = (colRef: any, ...constraints: any[]) => [colRef, ...constraints];
export const orderBy = (...args: any[]) => ({ type: 'orderBy', args });
export const limit = (n: number) => ({ type: 'limit', n });
export const where = (...args: any[]) => ({ type: 'where', args });

export const startAfter = (...args: any[]) => ({ type: 'startAfter', args });
export const getDocFromServer = getDoc;

// Real-time listener mock (simple polling)
export const onSnapshot = (colRef: any, callback: (snapshot: any) => void, onError?: (error: any) => void) => {
  let active = true;
  const poll = async () => {
    if (!active) return;
    try {
      if (typeof colRef === 'string' || Array.isArray(colRef)) {
        const snapshot = await getDocs(colRef);
        callback(snapshot);
      } else if (colRef && colRef.collection && colRef.id) {
        // Doc snapshot
        const snap = await getDoc(colRef);
        callback(snap);
      }
    } catch (err) {
      if (onError) onError(err);
    }
    // High frequency for "real-time" feel, but maybe 3s is safer for performance
    if (active) setTimeout(poll, 3000);
  };
  poll();
  return () => { active = false; };
};
