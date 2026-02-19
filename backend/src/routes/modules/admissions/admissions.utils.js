// backend/src/routes/modules/admissions/admissions.utils.js

/**
 * Generate admission number
 * Format: ADM-YYYYMMDD-XXXXX
 */
export function generateAdmissionNumber(hospitalCode = "HOSP") {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `${hospitalCode}-${year}${month}${day}-${random}`;
}

/**
 * Calculate length of stay in days
 */
export function calculateLengthOfStay(admissionDate, dischargeDate = null) {
  const start = new Date(admissionDate);
  const end = dischargeDate ? new Date(dischargeDate) : new Date();
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Get status color
 */
export function getStatusColor(status) {
  const colors = {
    'REQUESTED': 'gray',
    'APPROVED': 'blue',
    'ADMITTED': 'green',
    'TRANSFERRED': 'orange',
    'DISCHARGED': 'purple',
    'CANCELLED': 'red'
  };
  return colors[status] || 'gray';
}

/**
 * Validate bed capacity
 */
export function validateBedCapacity(ward, bedNumber) {
  if (!ward) return { valid: false, error: "Ward not found" };
  
  if (ward.occupiedBeds >= ward.totalBeds) {
    return { valid: false, error: "Ward is at full capacity" };
  }
  
  const bedExists = ward.beds.some(b => b.bedNumber === bedNumber);
  if (bedExists) {
    return { valid: false, error: `Bed ${bedNumber} already exists in this ward` };
  }
  
  return { valid: true };
}

/**
 * Check if bed is available
 */
export function isBedAvailable(bed) {
  return bed.isActive && !bed.isOccupied;
}

/**
 * Calculate occupancy rate
 */
export function calculateOccupancyRate(ward) {
  if (!ward || ward.totalBeds === 0) return 0;
  return Math.round((ward.occupiedBeds / ward.totalBeds) * 100);
}

/**
 * Group admissions by status
 */
export function groupAdmissionsByStatus(admissions) {
  return admissions.reduce((acc, adm) => {
    acc[adm.status] = (acc[adm.status] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Calculate average length of stay
 */
export function calculateAverageLOS(admissions) {
  const discharged = admissions.filter(a => a.status === 'DISCHARGED' && a.dischargeDate);
  if (discharged.length === 0) return 0;
  
  const totalDays = discharged.reduce((sum, a) => {
    return sum + calculateLengthOfStay(a.admissionDate, a.dischargeDate);
  }, 0);
  
  return Math.round((totalDays / discharged.length) * 10) / 10;
}

/**
 * Generate ward report
 */


export function generateWardReport(ward, admissions) {
  const totalBeds = ward.totalBeds;
  const occupied = ward.occupiedBeds;
  const available = totalBeds - occupied;
  const occupancyRate = calculateOccupancyRate(ward);
  
  const currentAdmissions = admissions.filter(a => 
    a.status === 'ADMITTED' && a.bed?.wardId === ward.id
  );
  
  return {
    wardName: ward.name,
    wardCode: ward.code,
    wardType: ward.type,
    totalBeds,
    occupied,
    available,
    occupancyRate,
    currentPatients: currentAdmissions.length,
    patients: currentAdmissions.map(a => ({
      admissionNumber: a.admissionNumber,
      patientName: a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : 'Unknown',
      patientUhid: a.patient?.uhid,
      admissionDate: a.admissionDate,
      doctor: a.doctor ? `${a.doctor.firstName} ${a.doctor.lastName}` : 'Unknown',
      diagnosis: a.diagnosis,
      bedNumber: a.bed?.bedNumber
    }))
  };
}

/**
 * Generate offline ID
 */
export function generateOfflineId() {
  return `offline_adm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate admission dates
 */
export function validateAdmissionDates(admissionDate, expectedDischarge = null) {
  const admission = new Date(admissionDate);
  const now = new Date();
  
  if (admission > now) {
    return {
      valid: false,
      error: "Admission date cannot be in the future"
    };
  }
  
  if (expectedDischarge) {
    const discharge = new Date(expectedDischarge);
    if (discharge <= admission) {
      return {
        valid: false,
        error: "Expected discharge date must be after admission date"
      };
    }
  }
  
  return { valid: true };
}

/**
 * Format admission for display
 */
export function formatAdmissionDisplay(admission) {
  return {
    id: admission.id,
    admissionNumber: admission.admissionNumber,
    patientName: admission.patient ? 
      `${admission.patient.firstName} ${admission.patient.lastName}` : 'Unknown',
    patientUhid: admission.patient?.uhid,
    doctorName: admission.doctor ?
      `${admission.doctor.firstName} ${admission.doctor.lastName}` : 'Unknown',
    wardName: admission.bed?.ward?.name,
    bedNumber: admission.bed?.bedNumber,
    admissionDate: admission.admissionDate,
    expectedDischarge: admission.expectedDischarge,
    status: admission.status,
    lengthOfStay: calculateLengthOfStay(admission.admissionDate, admission.dischargeDate),
    diagnosis: admission.diagnosis
  };
}