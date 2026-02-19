// backend/src/routes/modules/vitals/vitals.utils.js

/**
 * Calculate BMI from weight and height
 * Formula: weight(kg) / (height(m))^2
 */
export function calculateBMI(weight, height) {
  if (!weight || !height || weight <= 0 || height <= 0) return null;
  
  // Convert height from cm to m if needed
  const heightInMeters = height > 3 ? height / 100 : height;
  
  const bmi = weight / (heightInMeters * heightInMeters);
  return Math.round(bmi * 10) / 10; // Round to 1 decimal
}

/**
 * Get BMI category
 */
export function getBMICategory(bmi) {
  if (!bmi) return 'UNKNOWN';
  if (bmi < 18.5) return 'UNDERWEIGHT';
  if (bmi < 25) return 'NORMAL';
  if (bmi < 30) return 'OVERWEIGHT';
  if (bmi < 35) return 'OBESE_CLASS_1';
  if (bmi < 40) return 'OBESE_CLASS_2';
  return 'OBESE_CLASS_3';
}

/**
 * Calculate MAP (Mean Arterial Pressure)
 * Formula: (SBP + 2*DBP) / 3
 */
export function calculateMAP(systolic, diastolic) {
  if (!systolic || !diastolic) return null;
  const map = (systolic + 2 * diastolic) / 3;
  return Math.round(map);
}

/**
 * Get blood pressure category
 */
export function getBPCategory(systolic, diastolic) {
  if (!systolic || !diastolic) return 'UNKNOWN';
  
  if (systolic < 120 && diastolic < 80) return 'NORMAL';
  if (systolic < 130 && diastolic < 80) return 'ELEVATED';
  if (systolic < 140 || diastolic < 90) return 'HYPERTENSION_STAGE_1';
  if (systolic < 180 || diastolic < 120) return 'HYPERTENSION_STAGE_2';
  if (systolic >= 180 || diastolic >= 120) return 'HYPERTENSION_CRISIS';
  
  return 'UNKNOWN';
}

/**
 * Calculate pulse pressure
 * Formula: SBP - DBP
 */
export function calculatePulsePressure(systolic, diastolic) {
  if (!systolic || !diastolic) return null;
  return systolic - diastolic;
}

/**
 * Get heart rate category
 */
export function getHRCategory(heartRate, age) {
  if (!heartRate) return 'UNKNOWN';
  
  // Adult normal: 60-100
  if (age >= 18) {
    if (heartRate < 60) return 'BRADYCARDIA';
    if (heartRate <= 100) return 'NORMAL';
    return 'TACHYCARDIA';
  }
  
  // Pediatric ranges (simplified)
  if (age < 1) {
    if (heartRate < 100) return 'BRADYCARDIA';
    if (heartRate <= 160) return 'NORMAL';
    return 'TACHYCARDIA';
  }
  if (age < 3) {
    if (heartRate < 90) return 'BRADYCARDIA';
    if (heartRate <= 150) return 'NORMAL';
    return 'TACHYCARDIA';
  }
  if (age < 8) {
    if (heartRate < 70) return 'BRADYCARDIA';
    if (heartRate <= 130) return 'NORMAL';
    return 'TACHYCARDIA';
  }
  
  return 'UNKNOWN';
}

/**
 * Get temperature category
 */
export function getTemperatureCategory(temp, unit = 'C') {
  if (!temp) return 'UNKNOWN';
  
  // Convert to Celsius if needed
  const tempC = unit === 'F' ? (temp - 32) * 5/9 : temp;
  
  if (tempC < 35) return 'HYPOTHERMIA_SEVERE';
  if (tempC < 35.5) return 'HYPOTHERMIA_MILD';
  if (tempC < 36) return 'LOW';
  if (tempC <= 37.5) return 'NORMAL';
  if (tempC <= 38) return 'ELEVATED';
  if (tempC <= 39) return 'FEVER_MILD';
  if (tempC <= 40) return 'FEVER_MODERATE';
  return 'FEVER_HIGH';
}

/**
 * Calculate respiratory rate category
 */
export function getRRCategory(rr, age) {
  if (!rr) return 'UNKNOWN';
  
  // Adult normal: 12-20
  if (age >= 18) {
    if (rr < 12) return 'BRADYPNEA';
    if (rr <= 20) return 'NORMAL';
    return 'TACHYPNEA';
  }
  
  // Pediatric (simplified)
  if (age < 1) {
    if (rr < 30) return 'BRADYPNEA';
    if (rr <= 60) return 'NORMAL';
    return 'TACHYPNEA';
  }
  if (age < 3) {
    if (rr < 24) return 'BRADYPNEA';
    if (rr <= 40) return 'NORMAL';
    return 'TACHYPNEA';
  }
  
  return 'UNKNOWN';
}

/**
 * Get oxygen saturation category
 */
export function getSpO2Category(spo2) {
  if (!spo2) return 'UNKNOWN';
  
  if (spo2 >= 95) return 'NORMAL';
  if (spo2 >= 91) return 'MILD_HYPOXEMIA';
  if (spo2 >= 86) return 'MODERATE_HYPOXEMIA';
  if (spo2 >= 75) return 'SEVERE_HYPOXEMIA';
  return 'CRITICAL_HYPOXEMIA';
}

/**
 * Calculate NEWS score (National Early Warning Score)
 * Simplified version
 */
export function calculateNEWS(vitals) {
  let score = 0;
  
  // Respiration Rate
  if (vitals.respiratoryRate) {
    if (vitals.respiratoryRate <= 8) score += 3;
    else if (vitals.respiratoryRate >= 25) score += 3;
    else if (vitals.respiratoryRate >= 21) score += 2;
    else if (vitals.respiratoryRate >= 12) score += 0;
    else score += 1;
  }
  
  // SpO2
  if (vitals.oxygenSaturation) {
    if (vitals.oxygenSaturation <= 91) score += 3;
    else if (vitals.oxygenSaturation <= 93) score += 2;
    else if (vitals.oxygenSaturation <= 95) score += 1;
    else score += 0;
  }
  
  // Temperature
  if (vitals.temperature) {
    if (vitals.temperature <= 35) score += 3;
    else if (vitals.temperature >= 39) score += 2;
    else if (vitals.temperature >= 38.1) score += 1;
    else if (vitals.temperature >= 36.1) score += 0;
    else score += 1;
  }
  
  // Systolic BP
  if (vitals.bloodPressureSystolic) {
    if (vitals.bloodPressureSystolic <= 90) score += 3;
    else if (vitals.bloodPressureSystolic <= 100) score += 2;
    else if (vitals.bloodPressureSystolic <= 110) score += 1;
    else if (vitals.bloodPressureSystolic <= 219) score += 0;
    else score += 3;
  }
  
  // Heart Rate
  if (vitals.heartRate) {
    if (vitals.heartRate <= 40) score += 3;
    else if (vitals.heartRate >= 131) score += 3;
    else if (vitals.heartRate >= 111) score += 2;
    else if (vitals.heartRate >= 91) score += 1;
    else if (vitals.heartRate >= 51) score += 0;
    else score += 1;
  }
  
}

/**
 * Get NEWS risk category
 */
export function getNEWSRiskCategory(newsScore) {
  if (newsScore === null || newsScore === undefined) return 'UNKNOWN';
  
  if (newsScore <= 4) return 'LOW';
  if (newsScore <= 6) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Format vitals for display
 */
export function formatVitalsDisplay(vitals) {
  return {
    id: vitals.id,
    patientId: vitals.patientId,
    patientName: vitals.patient ? 
      `${vitals.patient.firstName} ${vitals.patient.lastName}` : 'Unknown',
    recordedAt: vitals.recordedAt,
    recordedBy: vitals.recordedBy,
    bloodPressure: vitals.bloodPressureSystolic && vitals.bloodPressureDiastolic ?
      `${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic}` : null,
    heartRate: vitals.heartRate,
    temperature: vitals.temperature,
    respiratoryRate: vitals.respiratoryRate,
    oxygenSaturation: vitals.oxygenSaturation,
    weight: vitals.weight,
    height: vitals.height,
    bmi: vitals.bmi,
    painScore: vitals.painScore,
    newsScore: vitals.newsScore,
    newsRisk: vitals.newsRisk
  };
}

/**
 * Validate vital signs ranges
 */
export function validateVitals(vitals) {
  const errors = [];
  
  if (vitals.bloodPressureSystolic && 
      (vitals.bloodPressureSystolic < 50 || vitals.bloodPressureSystolic > 250)) {
    errors.push("Systolic BP out of range (50-250)");
  }
  
  if (vitals.bloodPressureDiastolic && 
      (vitals.bloodPressureDiastolic < 30 || vitals.bloodPressureDiastolic > 150)) {
    errors.push("Diastolic BP out of range (30-150)");
  }
  
  if (vitals.heartRate && (vitals.heartRate < 30 || vitals.heartRate > 220)) {
    errors.push("Heart rate out of range (30-220)");
  }
  
  if (vitals.temperature && (vitals.temperature < 30 || vitals.temperature > 45)) {
    errors.push("Temperature out of range (30-45°C)");
  }
  
  if (vitals.respiratoryRate && (vitals.respiratoryRate < 5 || vitals.respiratoryRate > 60)) {
    errors.push("Respiratory rate out of range (5-60)");
  }
  
  if (vitals.oxygenSaturation && (vitals.oxygenSaturation < 50 || vitals.oxygenSaturation > 100)) {
    errors.push("Oxygen saturation out of range (50-100%)");
  }
  
  if (vitals.weight && vitals.weight < 1) {
    errors.push("Weight must be > 1 kg");
  }
  
  if (vitals.height && vitals.height < 30) {
    errors.push("Height must be > 30 cm");
  }
  
  if (vitals.painScore && (vitals.painScore < 0 || vitals.painScore > 10)) {
    errors.push("Pain score must be 0-10");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate offline ID
 */
export function generateOfflineId() {
  return `offline_vitals_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate growth percentiles (simplified)
 * In production, use WHO growth charts
 */
export function calculateGrowthPercentile(weight, height, age, gender) {
  // Simplified placeholder - in production use actual growth charts
  return {
    weightPercentile: 50,
    heightPercentile: 50,
    bmiPercentile: 50
  };
}

/**
 * Get triage priority based on vitals
 */
export function getTriagePriority(vitals) {
  const newsScore = vitals.newsScore || calculateNEWS(vitals);
  
  if (newsScore >= 7) return 'RESUSCITATION';
  if (newsScore >= 5) return 'EMERGENCY';
  if (newsScore >= 3) return 'URGENT';
  if (newsScore >= 1) return 'SEMI_URGENT';
  return 'NON_URGENT';
}

/**
 * Check if vitals are critical
 */
export function isCritical(vitals) {
  if (!vitals) return false;
  
  // Check for critical values
  if (vitals.bloodPressureSystolic && vitals.bloodPressureSystolic < 70) return true;
  if (vitals.bloodPressureSystolic && vitals.bloodPressureSystolic > 200) return true;
  if (vitals.heartRate && vitals.heartRate < 40) return true;
  if (vitals.heartRate && vitals.heartRate > 140) return true;
  if (vitals.temperature && vitals.temperature < 32) return true;
  if (vitals.temperature && vitals.temperature > 41) return true;
  if (vitals.respiratoryRate && vitals.respiratoryRate < 8) return true;
  if (vitals.respiratoryRate && vitals.respiratoryRate > 30) return true;
  if (vitals.oxygenSaturation && vitals.oxygenSaturation < 85) return true;
  
  return false;
}