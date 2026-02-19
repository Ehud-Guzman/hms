// backend/src/routes/modules/medical-records/medical-records.utils.js

/**
 * Generate record number
 * Format: MRN-YYYYMMDD-XXXXX
 */
export function generateRecordNumber(hospitalCode = "HOSP") {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `${hospitalCode}-${year}${month}${day}-${random}`;
}

/**
 * Get record type color
 */
export function getRecordTypeColor(type) {
  const colors = {
    'DIAGNOSIS': 'red',
    'PROCEDURE': 'blue',
    'NOTE': 'green',
    'PRESCRIPTION': 'purple',
    'LAB_RESULT': 'orange',
    'IMAGING': 'indigo',
    'VACCINATION': 'teal',
    'ALLERGY': 'pink',
    'SURGERY': 'darkred',
    'FOLLOW_UP': 'cyan'
  };
  return colors[type] || 'gray';
}

/**
 * Get record type icon
 */
export function getRecordTypeIcon(type) {
  const icons = {
    'DIAGNOSIS': '🏥',
    'PROCEDURE': '🔧',
    'NOTE': '📝',
    'PRESCRIPTION': '💊',
    'LAB_RESULT': '🧪',
    'IMAGING': '📡',
    'VACCINATION': '💉',
    'ALLERGY': '⚠️',
    'SURGERY': '🔪',
    'FOLLOW_UP': '📅'
  };
  return icons[type] || '📄';
}

/**
 * Format ICD-10 code for display
 */
export function formatICD10Code(code) {
  if (!code) return '';
  // Format: A00.0, B99.9, etc.
  const match = code.match(/^([A-Z])(\d{2})(?:\.(\d{1,2}))?$/);
  if (match) {
    const [_, letter, num, sub] = match;
    return sub ? `${letter}${num}.${sub}` : `${letter}${num}`;
  }
  return code;
}

/**
 * Get ICD-10 category from code
 */
export function getICD10Category(code) {
  if (!code) return 'UNKNOWN';
  
  const firstChar = code.charAt(0);
  const categories = {
    'A': 'Infectious diseases',
    'B': 'Infectious diseases',
    'C': 'Neoplasms',
    'D': 'Neoplasms & blood disorders',
    'E': 'Endocrine disorders',
    'F': 'Mental disorders',
    'G': 'Nervous system',
    'H': 'Eye & ear disorders',
    'I': 'Circulatory system',
    'J': 'Respiratory system',
    'K': 'Digestive system',
    'L': 'Skin disorders',
    'M': 'Musculoskeletal',
    'N': 'Genitourinary system',
    'O': 'Pregnancy & childbirth',
    'P': 'Perinatal conditions',
    'Q': 'Congenital malformations',
    'R': 'Symptoms & signs',
    'S': 'Injuries',
    'T': 'Injuries & poisoning',
    'Z': 'Factors influencing health'
  };
  
  return categories[firstChar] || 'OTHER';
}

/**
 * Validate medical record
 */
export function validateMedicalRecord(data) {
  const errors = [];
  
  if (!data.patientId) {
    errors.push("Patient ID is required");
  }
  
  if (!data.recordType) {
    errors.push("Record type is required");
  }
  
  if (!data.title) {
    errors.push("Title is required");
  }
  
  const validTypes = ['DIAGNOSIS', 'PROCEDURE', 'NOTE', 'PRESCRIPTION', 'LAB_RESULT', 'IMAGING', 'VACCINATION', 'ALLERGY', 'SURGERY', 'FOLLOW_UP'];
  if (data.recordType && !validTypes.includes(data.recordType)) {
    errors.push(`Invalid record type. Must be one of: ${validTypes.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Parse attachments from request
 */
export function parseAttachments(files) {
  if (!files || files.length === 0) return null;
  
  return files.map(file => ({
    filename: file.originalname,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
    uploadedAt: new Date()
  }));
}

/**
 * Generate summary from multiple records
 */
export function generateMedicalSummary(records) {
  const summary = {
    diagnoses: [],
    procedures: [],
    medications: [],
    allergies: [],
    labResults: [],
    immunizations: [],
    visits: 0,
    lastVisit: null
  };
  
  records.forEach(record => {
    switch (record.recordType) {
      case 'DIAGNOSIS':
        summary.diagnoses.push({
          date: record.recordedAt,
          diagnosis: record.title,
          description: record.description,
          icd10: record.icd10Code
        });
        break;
        
      case 'PROCEDURE':
        summary.procedures.push({
          date: record.recordedAt,
          procedure: record.title,
          description: record.description
        });
        break;
        
      case 'PRESCRIPTION':
        // Parse prescription data from description or metadata
        summary.medications.push({
          date: record.recordedAt,
          medication: record.title,
          instructions: record.description
        });
        break;
        
      case 'ALLERGY':
        summary.allergies.push({
          date: record.recordedAt,
          allergy: record.title,
          reaction: record.description
        });
        break;
        
      case 'VACCINATION':
        summary.immunizations.push({
          date: record.recordedAt,
          vaccine: record.title,
          notes: record.description
        });
        break;
    }
    
    summary.visits++;
    if (!summary.lastVisit || record.recordedAt > summary.lastVisit) {
      summary.lastVisit = record.recordedAt;
    }
  });
  
  return summary;
}

/**
 * Check if record is confidential
 */
export function isConfidential(recordType, userRole) {
  const confidentialTypes = ['MENTAL_HEALTH', 'STD', 'GENETIC', 'SUBSTANCE_ABUSE'];
  
  if (confidentialTypes.includes(recordType)) {
    return userRole !== 'SYSTEM_ADMIN' && userRole !== 'HOSPITAL_ADMIN' && userRole !== 'DOCTOR';
  }
  
  return false;
}

/**
 * Format record for display
 */
export function formatRecordDisplay(record) {
  return {
    id: record.id,
    type: record.recordType,
    typeIcon: getRecordTypeIcon(record.recordType),
    title: record.title,
    description: record.description,
    date: record.recordedAt,
    doctor: record.doctor ? 
      `${record.doctor.firstName} ${record.doctor.lastName}` : 'Unknown',
    icd10Code: formatICD10Code(record.icd10Code),
    icd10Description: record.icd10Description,
    isConfidential: record.isConfidential,
    hasAttachments: !!(record.attachments && record.attachments.length > 0)
  };
}

/**
 * Generate offline ID
 */
export function generateOfflineId() {
  return `offline_mr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Search in medical records
 */
export function searchInRecords(records, query) {
  const searchTerm = query.toLowerCase();
  
  return records.filter(record => {
    return (
      record.title?.toLowerCase().includes(searchTerm) ||
      record.description?.toLowerCase().includes(searchTerm) ||
      record.icd10Code?.toLowerCase().includes(searchTerm) ||
      record.icd10Description?.toLowerCase().includes(searchTerm)
    );
  });
}

/**
 * Get record timeline
 */
export function buildTimeline(records) {
  return records
    .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
    .map(record => ({
      id: record.id,
      date: record.recordedAt,
      type: record.recordType,
      title: record.title,
      description: record.description,
      doctor: record.doctor ? 
        `${record.doctor.firstName} ${record.doctor.lastName}` : 'Unknown',
      icon: getRecordTypeIcon(record.recordType),
      color: getRecordTypeColor(record.recordType)
    }));
}