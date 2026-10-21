import { 
  Lead, Dealer, Tender, Quotation, EmdPbgRecord, Product, 
  StockMovement, Employee, AttendanceRecord, PayrollRecord,
  QualityInspection, CalibrationCertificate, ComplianceDocument,
  Invoice, DispatchChallan, ServiceTicket, AmcContract, AuditLog,
  NotificationItem
} from '../types/crm';

import {
  SEED_LEADS, SEED_DEALERS, SEED_TENDERS, SEED_PRODUCTS,
  SEED_STOCK_MOVEMENTS, SEED_EMD_PBG, SEED_QUOTATIONS,
  SEED_EMPLOYEES, SEED_ATTENDANCE, SEED_QUALITY_INSPECTIONS,
  SEED_CALIBRATION_CERTS, SEED_COMPLIANCE_DOCS, SEED_INVOICES,
  SEED_DISPATCH_CHALLANS, SEED_SERVICE_TICKETS, SEED_AMC_CONTRACTS,
  SEED_AUDIT_LOGS
} from './mockSeedData';

const DB_NAME = 'MedicalEquipmentCRM_DB';
const DB_VERSION = 1;

type StoreName = 
  | 'leads'
  | 'dealers'
  | 'tenders'
  | 'quotations'
  | 'emdPbg'
  | 'products'
  | 'stockMovements'
  | 'employees'
  | 'attendance'
  | 'payroll'
  | 'qualityInspections'
  | 'calibrationCerts'
  | 'complianceDocs'
  | 'invoices'
  | 'dispatchChallans'
  | 'serviceTickets'
  | 'amcContracts'
  | 'auditLogs'
  | 'notifications';

const STORES: StoreName[] = [
  'leads', 'dealers', 'tenders', 'quotations', 'emdPbg', 'products',
  'stockMovements', 'employees', 'attendance', 'payroll',
  'qualityInspections', 'calibrationCerts', 'complianceDocs',
  'invoices', 'dispatchChallans', 'serviceTickets', 'amcContracts',
  'auditLogs', 'notifications'
];

let dbPromise: Promise<IDBDatabase> | null = null;
const listeners = new Set<() => void>();

export function subscribeToDatabase(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifySubscribers() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error(e);
    }
  });
}

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      STORES.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };

    request.onsuccess = async (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      await ensureSeedData(db);
      resolve(db);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
}

async function ensureSeedData(db: IDBDatabase) {
  const tx = db.transaction(['leads', 'tenders', 'products'], 'readonly');
  const leadStore = tx.objectStore('leads');
  const countReq = leadStore.count();

  const count = await new Promise<number>((resolve) => {
    countReq.onsuccess = () => resolve(countReq.result);
    countReq.onerror = () => resolve(0);
  });

  if (count === 0) {
    console.log('Seeding initial Medical Equipment manufacturing database...');
    const writeTx = db.transaction(STORES, 'readwrite');
    
    SEED_LEADS.forEach((item) => writeTx.objectStore('leads').put(item));
    SEED_DEALERS.forEach((item) => writeTx.objectStore('dealers').put(item));
    SEED_TENDERS.forEach((item) => writeTx.objectStore('tenders').put(item));
    SEED_PRODUCTS.forEach((item) => writeTx.objectStore('products').put(item));
    SEED_STOCK_MOVEMENTS.forEach((item) => writeTx.objectStore('stockMovements').put(item));
    SEED_EMD_PBG.forEach((item) => writeTx.objectStore('emdPbg').put(item));
    SEED_QUOTATIONS.forEach((item) => writeTx.objectStore('quotations').put(item));
    SEED_EMPLOYEES.forEach((item) => writeTx.objectStore('employees').put(item));
    SEED_ATTENDANCE.forEach((item) => writeTx.objectStore('attendance').put(item));
    SEED_QUALITY_INSPECTIONS.forEach((item) => writeTx.objectStore('qualityInspections').put(item));
    SEED_CALIBRATION_CERTS.forEach((item) => writeTx.objectStore('calibrationCerts').put(item));
    SEED_COMPLIANCE_DOCS.forEach((item) => writeTx.objectStore('complianceDocs').put(item));
    SEED_INVOICES.forEach((item) => writeTx.objectStore('invoices').put(item));
    SEED_DISPATCH_CHALLANS.forEach((item) => writeTx.objectStore('dispatchChallans').put(item));
    SEED_SERVICE_TICKETS.forEach((item) => writeTx.objectStore('serviceTickets').put(item));
    SEED_AMC_CONTRACTS.forEach((item) => writeTx.objectStore('amcContracts').put(item));
    SEED_AUDIT_LOGS.forEach((item) => writeTx.objectStore('auditLogs').put(item));

    const initialNotifications: NotificationItem[] = [
      {
        id: 'notif-1',
        title: 'GeM Tender Submission in 8 Days',
        message: 'AIIMS ICU Ventilator bid GEM/2026/B/8940122 closing on 24-Oct-2026.',
        category: 'Tender',
        severity: 'warning',
        timestamp: new Date().toISOString(),
        read: false,
        linkModule: 'tenders'
      },
      {
        id: 'notif-2',
        title: 'Low Stock Alert: Syringe Pumps',
        message: 'Syringe Infusion Pump SP-900 quantity has dropped to 6 units (Min threshold: 12).',
        category: 'Stock',
        severity: 'danger',
        timestamp: new Date().toISOString(),
        read: false,
        linkModule: 'inventory'
      },
      {
        id: 'notif-3',
        title: 'EMD Refund Overdue',
        message: 'FDR EMD for Safdarjung Hospital (₹2,20,000) expired today. Follow-up letter pending.',
        category: 'EMD/PBG',
        severity: 'danger',
        timestamp: new Date().toISOString(),
        read: false,
        linkModule: 'emd-pbg'
      }
    ];
    initialNotifications.forEach((n) => writeTx.objectStore('notifications').put(n));

    await new Promise<void>((resolve, reject) => {
      writeTx.oncomplete = () => resolve();
      writeTx.onerror = () => reject(writeTx.error);
    });
  }
}

// Generic CRUD operations
export async function getAllFromStore<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function getByIdFromStore<T>(storeName: StoreName, id: string): Promise<T | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve((request.result as T) || null);
    request.onerror = () => reject(request.error);
  });
}

export async function putToStore<T extends { id: string }>(storeName: StoreName, item: T, auditInfo?: { user: string; role: string; action: string; details: string }): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName, 'auditLogs'], 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(item);

    if (auditInfo) {
      const auditLog: AuditLog = {
        id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        timestamp: new Date().toISOString(),
        user: auditInfo.user,
        role: auditInfo.role,
        action: auditInfo.action,
        module: storeName,
        details: auditInfo.details
      };
      tx.objectStore('auditLogs').put(auditLog);
    }

    req.onsuccess = () => {
      notifySubscribers();
      resolve(item);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteFromStore(storeName: StoreName, id: string, auditInfo?: { user: string; role: string; details: string }): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName, 'auditLogs'], 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);

    if (auditInfo) {
      const auditLog: AuditLog = {
        id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        timestamp: new Date().toISOString(),
        user: auditInfo.user,
        role: auditInfo.role,
        action: 'Delete Record',
        module: storeName,
        details: auditInfo.details
      };
      tx.objectStore('auditLogs').put(auditLog);
    }

    req.onsuccess = () => {
      notifySubscribers();
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

// Reset Database to Seed Data
export async function resetDatabaseToSeed(): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(STORES, 'readwrite');
  STORES.forEach((s) => tx.objectStore(s).clear());

  await new Promise<void>((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });

  await ensureSeedData(db);
  notifySubscribers();
}

// Full Database Export to JSON
export async function exportFullDatabase(customInfo?: { systemName?: string; companyName?: string }): Promise<string> {
  const db = await openDatabase();
  const data: Record<string, any[]> = {};

  for (const store of STORES) {
    data[store] = await getAllFromStore(store);
  }

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    system: customInfo?.systemName || 'Medical Equipment CRM & ERP',
    company: customInfo?.companyName || 'Medical Equipment Instruments Ltd.',
    version: '1.0',
    data
  };

  return JSON.stringify(exportPayload, null, 2);
}

// Full Database Import from JSON
export async function importFullDatabase(jsonString: string): Promise<{ success: boolean; message: string }> {
  try {
    const payload = JSON.parse(jsonString);
    if (!payload.data) {
      throw new Error('Invalid backup file: missing data root');
    }

    const db = await openDatabase();
    const tx = db.transaction(STORES, 'readwrite');

    for (const store of STORES) {
      if (Array.isArray(payload.data[store])) {
        const os = tx.objectStore(store);
        os.clear();
        for (const item of payload.data[store]) {
          os.put(item);
        }
      }
    }

    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });

    notifySubscribers();
    return { success: true, message: 'Database restored successfully!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to import backup' };
  }
}
