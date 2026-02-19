// backend/src/routes/modules/doctors/doctors.utils.js

/**
 * Generate Doctor ID / License Number format
 * Format: DOC-YYYY-XXXXX
 */
export function generateDoctorId(hospitalCode = "HOSP", year = null) {
  const currentYear = year || new Date().getFullYear();
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `${hospitalCode}-DOC-${currentYear}-${random}`;
}

/**
 * Validate license number format
 */
export function isValidLicense(license) {
  if (!license) return false;
  // Basic format: alphanumeric, dashes, 5-20 chars
  const re = /^[A-Z0-9-]{5,20}$/i;
  return re.test(String(license));
}

/**
 * Parse days of week from schedule
 */
export function parseDaysOfWeek(days) {
  if (!days) return [];
  if (Array.isArray(days)) return days;
  if (typeof days === 'string') {
    return days.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d) && d >= 0 && d <= 6);
  }
  return [];
}

/**
 * Generate time slots for a schedule
 */
export function generateTimeSlots(startTime, endTime, durationMinutes = 15) {
  const slots = [];
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  
  let current = new Date(start);
  
  while (current < end) {
    const timeString = current.toTimeString().slice(0, 5);
    slots.push(timeString);
    current.setMinutes(current.getMinutes() + durationMinutes);
  }
  
  return slots;
}

/**
 * Check if two schedules overlap
 */
export function doSchedulesOverlap(schedule1, schedule2) {
  // Same day check
  if (schedule1.dayOfWeek !== schedule2.dayOfWeek) return false;
  
  // Time overlap check
  const s1Start = schedule1.startTime;
  const s1End = schedule1.endTime;
  const s2Start = schedule2.startTime;
  const s2End = schedule2.endTime;
  
  return (s1Start < s2End && s1End > s2Start);
}

/**
 * Format doctor name for display
 */
export function formatDoctorName(doctor) {
  if (!doctor) return '';
  const firstName = doctor.firstName || '';
  const lastName = doctor.lastName || '';
  const specialty = doctor.specialty ? ` (${doctor.specialty})` : '';
  return `${firstName} ${lastName}${specialty}`.trim();
}

/**
 * Calculate consultation duration from fee
 * (Simple heuristic - higher fee = longer slot)
 */
export function estimateSlotDuration(consultationFee) {
  if (!consultationFee) return 15;
  if (consultationFee < 1000) return 15;
  if (consultationFee < 2000) return 20;
  if (consultationFee < 3000) return 30;
  return 45;
}

/**
 * Validate working hours format
 */
export function isValidTimeFormat(time) {
  if (!time) return false;
  const re = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return re.test(time);
}

/**
 * Get default schedule for a new doctor
 */
export function getDefaultSchedule() {
  return [
    { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isActive: true }, // Monday
    { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", isActive: true }, // Tuesday
    { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", isActive: true }, // Wednesday
    { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", isActive: true }, // Thursday
    { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", isActive: true }  // Friday
  ];
}