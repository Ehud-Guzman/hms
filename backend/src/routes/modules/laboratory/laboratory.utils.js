// backend/src/routes/modules/laboratory/laboratory.utils.js

/**
 * Generate a unique lab order number
 * Format: HOSP-YYYYMMDD-XXXXX
 */
export function generateOrderNumber(hospitalCode = "HOSP") {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `${hospitalCode}-${year}${month}${day}-${random}`;
}

/**
 * Get priority color for UI
 */
export function getPriorityColor(priority) {
  const map = { ROUTINE: 'blue', URGENT: 'orange', STAT: 'red' };
  return map[priority] || 'gray';
}

/**
 * Get status color for UI
 */
export function getStatusColor(status) {
  const map = {
    ORDERED: 'gray',
    COLLECTED: 'purple',
    PROCESSING: 'blue',
    COMPLETED: 'green',
    CANCELLED: 'red',
    REJECTED: 'darkred'
  };
  return map[status] || 'gray';
}

/**
 * Calculate turnaround time in minutes
 */
export function calculateTAT(orderedAt, completedAt) {
  if (!orderedAt || !completedAt) return null;
  const minutes = Math.round((new Date(completedAt) - new Date(orderedAt)) / 60000);
  return minutes;
}

/**
 * Check if value is abnormal based on reference ranges
 */
export function isAbnormal(value, referenceRanges, gender, age) {
  if (value === null || value === undefined || !referenceRanges) return false;
  
  let range = referenceRanges;

  if (Array.isArray(referenceRanges)) {
    range = referenceRanges.find(r => {
      if (r.gender && r.gender !== gender) return false;
      if (r.ageMin && age < r.ageMin) return false;
      if (r.ageMax && age > r.ageMax) return false;
      return true;
    });
  }

  if (!range) return false;

  const numValue = parseFloat(value);
  if (isNaN(numValue)) return false;

  if (range.min !== undefined && numValue < range.min) return true;
  if (range.max !== undefined && numValue > range.max) return true;

  return false;
}

/**
 * Format test result for display
 */
export function formatTestResult(result, test) {
  if (!result) return null;
  const formatted = { ...result };
  
  if (test) {
    formatted.testName = test.name;
    formatted.testCode = test.code;
    formatted.category = test.category;
    formatted.referenceRanges = test.referenceRanges;
  }

  return formatted;
}

/**
 * Parse CSV or JSON lab result data
 */
export function parseResultData(rawData) {
  try {
    if (!rawData) return {};

    if (typeof rawData === 'object' && !Array.isArray(rawData)) return rawData;

    if (typeof rawData === 'string') {
      try {
        return JSON.parse(rawData);
      } catch {
        // fallback to CSV parsing
        if (rawData.includes(',')) {
          const lines = rawData.split('\n');
          const result = {};
          lines.forEach(line => {
            const [param, value, unit] = line.split(',').map(s => s.trim());
            if (param && value) result[param] = { value, unit: unit || '' };
          });
          return result;
        }
      }
    }

    return {};
  } catch (err) {
    console.error("Error parsing result data:", err);
    return {};
  }
}

/**
 * Validate test parameters against test definition
 */
export function validateTestParameters(parameters, test) {
  if (!test?.parameters) return { valid: true, errors: [] };

  let testParams = test.parameters;
  if (typeof test.parameters === 'string') {
    try { testParams = JSON.parse(test.parameters); } catch { testParams = []; }
  }

  if (!Array.isArray(testParams)) return { valid: true, errors: [] };

  const errors = [];
  testParams.filter(p => p.required).forEach(p => {
    if (!parameters?.[p.name]?.value && parameters?.[p.name] === undefined) {
      errors.push(`Missing required parameter: ${p.name}`);
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Generate barcode for sample
 */
export function generateSampleBarcode(orderNumber, testCode) {
  const ts = Date.now().toString(36);
  return `${orderNumber}-${testCode}-${ts}`.toUpperCase();
}

/**
 * Calculate age from DOB
 */
export function calculateAge(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
}

/**
 * Format critical flag for test values
 */
export function formatCriticalFlag(value, range) {
  if (!range || value === null || value === undefined) return null;
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return null;

  if (range.criticalLow !== undefined && numValue <= range.criticalLow)
    return { level: 'CRITICAL_LOW', message: `Value ${value} is critically low (≤ ${range.criticalLow})` };

  if (range.criticalHigh !== undefined && numValue >= range.criticalHigh)
    return { level: 'CRITICAL_HIGH', message: `Value ${value} is critically high (≥ ${range.criticalHigh})` };

  return null;
}

/**
 * Group orders by status
 */
export function groupOrdersByStatus(orders = []) {
  return orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {});
}

/**
 * Generate offline ID for syncing
 */
export function generateOfflineId() {
  return `offline_lab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validate date range
 */
export function validateDateRange(startDate, endDate, maxDays = 90) {
  if (!startDate || !endDate) return { valid: false, message: "Dates are required" };
  const diff = Math.round((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
  return { valid: diff <= maxDays, diffDays: diff, maxDays, message: diff > maxDays ? `Date range cannot exceed ${maxDays} days` : null };
}

/**
 * Parse reference ranges from string or object
 */
export function parseReferenceRanges(ranges) {
  if (!ranges) return null;
  if (typeof ranges === 'object') return ranges;

  try {
    return JSON.parse(ranges);
  } catch {
    const lines = String(ranges).split('\n');
    const obj = {};
    lines.forEach(line => {
      const [key, value] = line.split(':').map(s => s.trim());
      if (key && value) obj[key] = value;
    });
    return obj;
  }
}

/**
 * Return sample type options
 */
export function getSampleTypes() {
  return ['Blood', 'Urine', 'Stool', 'Sputum', 'Swab', 'Tissue', 'CSF', 'Fluid', 'Other'];
}
