// backend/src/routes/modules/laboratory/laboratory.utils.js

/**
 * Generate order number
 * Format: LAB-YYYYMMDD-XXXXX
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
 * Get priority color
 */
export function getPriorityColor(priority) {
  const colors = {
    'ROUTINE': 'blue',
    'URGENT': 'orange',
    'STAT': 'red'
  };
  return colors[priority] || 'gray';
}

/**
 * Get status color
 */
export function getStatusColor(status) {
  const colors = {
    'ORDERED': 'gray',
    'COLLECTED': 'purple',
    'PROCESSING': 'blue',
    'COMPLETED': 'green',
    'CANCELLED': 'red',
    'REJECTED': 'darkred'
  };
  return colors[status] || 'gray';
}

/**
 * Calculate turnaround time
 */
export function calculateTAT(orderedAt, completedAt) {
  if (!orderedAt || !completedAt) return null;
  const ordered = new Date(orderedAt);
  const completed = new Date(completedAt);
  const minutes = Math.round((completed - ordered) / 60000);
  return minutes;
}

/**
 * Check if result is abnormal based on reference ranges
 */
export function isAbnormal(value, referenceRanges, gender, age) {
  if (!referenceRanges || value === null || value === undefined) return false;
  
  // Find appropriate range based on gender/age
  let range = referenceRanges;
  
  if (Array.isArray(referenceRanges)) {
    // Find range matching patient demographics
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
  
  const formatted = {
    id: result.id,
    orderId: result.orderId,
    resultData: result.resultData,
    reportFile: result.reportFile,
    notes: result.notes,
    isAbnormal: result.isAbnormal,
    criticalFlags: result.criticalFlags,
    verifiedBy: result.verifiedBy,
    verifiedAt: result.verifiedAt,
    createdAt: result.createdAt
  };
  
  // Add test info if available
  if (test) {
    formatted.testName = test.name;
    formatted.testCode = test.code;
    formatted.category = test.category;
    formatted.referenceRanges = test.referenceRanges;
  }
  
  return formatted;
}

/**
 * Parse CSV/Excel result data
 */
export function parseResultData(rawData, testParameters) {
  try {
    // If it's already an object
    if (typeof rawData === 'object' && !Array.isArray(rawData)) {
      return rawData;
    }
    
    // If it's a JSON string
    if (typeof rawData === 'string') {
      try {
        return JSON.parse(rawData);
      } catch {
        // Not JSON, try CSV format
      }
    }
    
    // Parse CSV format: "parameter,value,unit"
    if (typeof rawData === 'string' && rawData.includes(',')) {
      const lines = rawData.split('\n');
      const result = {};
      
      lines.forEach(line => {
        const [param, value, unit] = line.split(',').map(s => s.trim());
        if (param && value) {
          result[param] = {
            value,
            unit: unit || ''
          };
        }
      });
      
      return result;
    }
    
    return {};
  } catch (error) {
    console.error("Error parsing result data:", error);
    return {};
  }
}

/**
 * Validate test parameters against order
 */
export function validateTestParameters(parameters, test) {
  if (!test.parameters) return { valid: true, errors: [] };
  
  const errors = [];
  const testParams = typeof test.parameters === 'string' 
    ? JSON.parse(test.parameters) 
    : test.parameters;
  
  if (!testParams || !Array.isArray(testParams)) {
    return { valid: true, errors: [] };
  }
  
  const requiredParams = testParams.filter(p => p.required).map(p => p.name);
  
  requiredParams.forEach(param => {
    if (!parameters[param] && !parameters[param]?.value) {
      errors.push(`Missing required parameter: ${param}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate barcode for sample
 */
export function generateSampleBarcode(orderNumber, testCode) {
  const timestamp = Date.now().toString(36);
  return `${orderNumber}-${testCode}-${timestamp}`.toUpperCase();
}

/**
 * Get sample type options
 */
export function getSampleTypes() {
  return [
    'Blood',
    'Urine',
    'Stool',
    'Sputum',
    'Swab',
    'Tissue',
    'CSF',
    'Fluid',
    'Other'
  ];
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
 * Format critical flag
 */
export function formatCriticalFlag(value, range) {
  if (!range) return null;
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return null;
  
  if (range.criticalLow !== undefined && numValue <= range.criticalLow) {
    return {
      level: 'CRITICAL_LOW',
      message: `Value ${value} is critically low (≤ ${range.criticalLow})`
    };
  }
  
  if (range.criticalHigh !== undefined && numValue >= range.criticalHigh) {
    return {
      level: 'CRITICAL_HIGH',
      message: `Value ${value} is critically high (≥ ${range.criticalHigh})`
    };
  }
  
  return null;
}

/**
 * Group orders by status
 */
export function groupOrdersByStatus(orders) {
  return orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Generate offline ID
 */
export function generateOfflineId() {
  return `offline_lab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate date range
 */
export function validateDateRange(startDate, endDate, maxDays = 90) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
  
  return {
    valid: diffDays <= maxDays,
    diffDays,
    maxDays,
    message: diffDays > maxDays ? `Date range cannot exceed ${maxDays} days` : null
  };
}

/**
 * Parse reference ranges from string/JSON
 */
export function parseReferenceRanges(ranges) {
  if (!ranges) return null;
  
  if (typeof ranges === 'object') return ranges;
  
  try {
    if (typeof ranges === 'string') {
      return JSON.parse(ranges);
    }
  } catch {
    // If not JSON, try simple format: "min-max" or ">value" or "<value"
    const strRanges = String(ranges);
    const ranges_obj = {};
    
    // Parse multiple lines
    strRanges.split('\n').forEach(line => {
      const [key, value] = line.split(':').map(s => s.trim());
      if (key && value) {
        ranges_obj[key] = value;
      }
    });
    
    return ranges_obj;
  }
  
  return null;
}