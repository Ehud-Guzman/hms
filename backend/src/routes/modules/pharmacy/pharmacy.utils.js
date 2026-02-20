// backend/src/routes/modules/pharmacy/pharmacy.utils.js

/**
 * Generate drug code
 * Format: DRUG-XXXXX or based on category
 */
export function generateDrugCode(category = "GEN", sequence = 1) {
  const padded = String(sequence).padStart(5, '0');
  return `${category}-${padded}`;
}

/**
 * Calculate expiry status
 */
export function getExpiryStatus(expiryDate) {
  if (!expiryDate) return 'UNKNOWN';
  
  const today = new Date();
  const expiry = new Date(expiryDate);
  const monthsLeft = (expiry.getFullYear() - today.getFullYear()) * 12 + 
                     (expiry.getMonth() - today.getMonth());
  
  if (monthsLeft < 0) return 'EXPIRED';
  if (monthsLeft < 1) return 'EXPIRING_SOON';
  if (monthsLeft < 3) return 'WARNING';
  return 'GOOD';
}

/**
 * Check if stock is low
 */
export function isLowStock(quantity, reorderLevel) {
  return quantity <= reorderLevel;
}

/**
 * Calculate total value of inventory
 */
export function calculateInventoryValue(items) {
  return items.reduce((total, item) => {
    return total + (item.quantityInStock * item.unitPrice);
  }, 0);
}

/**
 * Calculate total value of inventory (formatted with commas)
 */
export function calculateInventoryValueFormatted(items) {
  return formatNumberWithCommas(calculateInventoryValue(items));
}

/**
 * Format medicine name for display
 */
export function formatMedicineName(item) {
  if (!item) return '';
  const generic = item.genericName || '';
  const brand = item.brandName ? ` (${item.brandName})` : '';
  const strength = item.strength ? ` ${item.strength}` : '';
  const form = item.form ? ` - ${item.form}` : '';
  return `${generic}${brand}${strength}${form}`;
}

/**
 * Validate batch number format
 */
export function isValidBatchNo(batchNo) {
  if (!batchNo) return false;
  const re = /^[A-Z0-9_-]{3,20}$/i;
  return re.test(batchNo);
}

/**
 * Parse medication instructions
 */
export function parseInstructions(instructions) {
  if (!instructions) return {};
  
  const parsed = {};
  
  const dosageMatch = instructions.match(/(\d+)\s*(tablet|cap|capsule|ml|mg|g|puff|drop)s?/i);
  if (dosageMatch) parsed.dosage = dosageMatch[0];
  
  const frequencyMatch = instructions.match(/(once|twice|thrice|\d+ times?)\s*(daily|day|per day|every\s*\d+\s*hours?)/i);
  if (frequencyMatch) parsed.frequency = frequencyMatch[0];
  
  const durationMatch = instructions.match(/for\s*(\d+)\s*(day|week|month)s?/i);
  if (durationMatch) parsed.duration = durationMatch[0];
  
  return parsed;
}

/**
 * Generate prescription reference
 */
export function generatePrescriptionRef(hospitalCode = "HOSP", year = null) {
  const currentYear = year || new Date().getFullYear();
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `RX-${hospitalCode}-${currentYear}-${random}`;
}

/**
 * Calculate total prescription cost
 */
export function calculatePrescriptionCost(items) {
  return items.reduce((total, item) => {
    return total + ((item.unitPrice || 0) * (item.quantity || 0));
  }, 0);
}

/**
 * Calculate total prescription cost (formatted with commas)
 */
export function calculatePrescriptionCostFormatted(items) {
  return formatNumberWithCommas(calculatePrescriptionCost(items));
}

/**
 * Check for drug interactions (simplified)
 */
export function checkInteractions(medications, interactionDatabase = []) {
  const warnings = [];
  
  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const interaction = interactionDatabase.find(int => 
        (int.drug1 === medications[i] && int.drug2 === medications[j]) ||
        (int.drug1 === medications[j] && int.drug2 === medications[i])
      );
      if (interaction) {
        warnings.push({
          drugs: [medications[i], medications[j]],
          severity: interaction.severity,
          description: interaction.description
        });
      }
    }
  }
  
  return warnings;
}

/**
 * Get stock status color
 */
export function getStockStatusColor(quantity, reorderLevel) {
  if (quantity <= 0) return 'red';
  if (quantity <= reorderLevel) return 'orange';
  if (quantity <= reorderLevel * 2) return 'yellow';
  return 'green';
}

/**
 * Generate barcode (simplified)
 */
export function generateBarcode(drugCode, batchNo) {
  return `${drugCode}-${batchNo}`;
}

/**
 * Parse dosage form
 */
export function parseDosageForm(form) {
  const forms = {
    'TAB': 'Tablet',
    'CAP': 'Capsule',
    'SYR': 'Syrup',
    'INJ': 'Injection',
    'CRM': 'Cream',
    'ONT': 'Ointment',
    'DPS': 'Drops',
    'INH': 'Inhaler',
    'SPR': 'Spray',
    'SOL': 'Solution'
  };
  return forms[form] || form;
}

/**
 * Calculate days of supply
 */
export function calculateDaysSupply(quantity, dosagePerDay) {
  if (!dosagePerDay || dosagePerDay <= 0) return 0;
  return Math.floor(quantity / dosagePerDay);
}

/**
 * Generate offline ID
 */
export function generateOfflineId() {
  return `offline_pharm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format numbers with commas (e.g., 1000000 -> 1,000,000)
 */
export function formatNumberWithCommas(value) {
  if (value == null || isNaN(value)) return '0';
  return new Intl.NumberFormat('en-KE').format(value);
}
