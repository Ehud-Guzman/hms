// backend/src/routes/modules/patients/patients.utils.js

/**
 * Generate UHID (Universal Hospital ID)
 * Format: HOSP-YYYY-XXXXX
 * Example: CGH-2026-00001
 */
export function generateUHID(hospitalCode = "HOSP", year = null) {
  const currentYear = year || new Date().getFullYear();
  const random = Math.floor(Math.random() * 90000) + 10000; // 5 digits
  return `${hospitalCode}-${currentYear}-${random}`;
}

/**
 * Generate sequential UHID (better for production)
 * Use this with a counter from database
 */
export function generateSequentialUHID(hospitalCode, year, sequence) {
  const padded = String(sequence).padStart(5, '0');
  return `${hospitalCode}-${year}-${padded}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

/**
 * Validate phone number (basic)
 */
export function isValidPhone(phone) {
  const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return re.test(String(phone));
}

/**
 * Calculate age from DOB
 */
export function calculateAge(dob) {
  const diff = Date.now() - new Date(dob).getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

/**
 * Sanitize patient input
 */
export function sanitizePatientInput(data) {
  const sanitized = { ...data };
  
  // Remove empty strings
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === '') sanitized[key] = null;
  });
  
  // Trim strings
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitized[key].trim();
    }
  });
  
  return sanitized;
}

/**
 * Parse JSON fields (allergies, conditions, etc.)
 */
export function parseMedicalJson(field) {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch {
      return field.split(',').map(s => s.trim());
    }
  }
  return [];
}

/**
 * Generate offline ID for client
 */
export function generateOfflineId() {
  return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}