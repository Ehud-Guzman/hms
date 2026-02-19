import Dexie from 'dexie';

export const db = new Dexie('hms-offline');

// Increment version to 2 to add retries field
db.version(2).stores({
  // Core data tables (unchanged)
  patients: 'id, uhid, firstName, lastName, syncStatus',
  doctors: 'id, firstName, lastName, specialty, syncStatus',
  appointments: 'id, patientId, doctorId, date, status, syncStatus',
  vitals: 'id, patientId, recordedAt, syncStatus',
  
  // Pharmacy
  pharmacyItems: 'id, drugCode, genericName, syncStatus',
  prescriptions: 'id, patientId, doctorId, issuedAt, status, syncStatus',
  
  // Laboratory
  labTests: 'id, code, name, category, syncStatus',
  labOrders: 'id, orderNumber, patientId, testId, status, syncStatus',
  labResults: 'id, orderId, syncStatus',
  
  // Billing
  invoices: 'id, billNumber, patientId, status, syncStatus',
  payments: 'id, receiptNumber, invoiceId, syncStatus',
  
  // Admissions
  wards: 'id, name, code, syncStatus',
  beds: 'id, wardId, bedNumber, isOccupied, syncStatus',
  admissions: 'id, admissionNumber, patientId, status, syncStatus',
  
  // Medical Records
  medicalRecords: 'id, patientId, recordType, recordedAt, syncStatus',

  // Sync queue with retries
  syncQueue: '++id, entity, action, timestamp, retries'
});

export const syncStatus = {
  SYNCED: 'SYNCED',
  PENDING: 'PENDING',
  CONFLICT: 'CONFLICT'
};