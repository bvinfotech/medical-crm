import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { FirebaseConnectionConfig } from '../types/crm';

const CONFIG_STORAGE_KEY = 'bmt_medical_crm_firebase_config';

export function getStoredFirebaseConfig(): FirebaseConnectionConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.projectId && parsed.apiKey) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed reading firebase config from storage', e);
  }
  return null;
}

export function saveFirebaseConfig(config: FirebaseConnectionConfig) {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}

export function clearFirebaseConfig() {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export function initFirebase(): { app: FirebaseApp | null; auth: Auth | null; db: Firestore | null; isConnected: boolean } {
  const config = getStoredFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return { app: null, auth: null, db: null, isConnected: false };
  }

  try {
    if (getApps().length === 0) {
      appInstance = initializeApp(config);
    } else {
      appInstance = getApp();
    }
    authInstance = getAuth(appInstance);
    dbInstance = config.firestoreDatabaseId 
      ? getFirestore(appInstance, config.firestoreDatabaseId)
      : getFirestore(appInstance);

    return { app: appInstance, auth: authInstance, db: dbInstance, isConnected: true };
  } catch (err) {
    console.warn('Firebase initialization note:', err);
    return { app: null, auth: null, db: null, isConnected: false };
  }
}

export async function testFirestoreConnection(): Promise<{ success: boolean; message: string }> {
  const { db } = initFirebase();
  if (!db) {
    return { 
      success: false, 
      message: 'Firebase is not yet configured. Please provide your Firebase project credentials in Settings.' 
    };
  }

  try {
    // Attempt reading from test collection or metadata
    await getDocFromServer(doc(db, 'system_metadata', 'status'));
    return { success: true, message: 'Successfully connected to Cloud Firestore!' };
  } catch (error: any) {
    if (error?.message && error.message.includes('permission-denied')) {
      return { 
        success: true, 
        message: 'Connected to Firestore! (Firestore security rules active)' 
      };
    }
    return { 
      success: false, 
      message: error?.message || 'Could not connect to Firestore. Verify API key and Project ID.' 
    };
  }
}
