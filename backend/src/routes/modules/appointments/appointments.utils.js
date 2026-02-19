// backend/src/routes/modules/appointments/appointments.utils.js

/**
 * Calculate end time from start time and duration
 * @param {Date|string} startTime - Start time
 * @param {number} durationMinutes - Duration in minutes
 * @returns {Date} End time
 */
export function calculateEndTime(startTime, durationMinutes) {
  const end = new Date(startTime);
  end.setMinutes(end.getMinutes() + durationMinutes);
  return end;
}

/**
 * Check if two appointments overlap
 * @param {Date} appt1Start - First appointment start
 * @param {Date} appt1End - First appointment end
 * @param {Date} appt2Start - Second appointment start
 * @param {Date} appt2End - Second appointment end
 * @returns {boolean} True if appointments overlap
 */
export function doAppointmentsOverlap(appt1Start, appt1End, appt2Start, appt2End) {
  return (appt1Start < appt2End && appt1End > appt2Start);
}

/**
 * Validate appointment time is within working hours
 * @param {Date} startTime - Appointment start time
 * @param {Date} endTime - Appointment end time
 * @param {Object} workingHours - Working hours configuration
 * @returns {boolean} True if within working hours
 */
export function isValidAppointmentTime(startTime, endTime, workingHours) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const dayOfWeek = start.getDay();
  
  const hours = workingHours[dayOfWeek];
  if (!hours || !hours.isWorking) return false;
  
  const workStart = new Date(start);
  workStart.setHours(hours.start.split(':')[0], hours.start.split(':')[1], 0);
  
  const workEnd = new Date(start);
  workEnd.setHours(hours.end.split(':')[0], hours.end.split(':')[1], 0);
  
  return start >= workStart && end <= workEnd;
}

/**
 * Get status badge color for UI
 * @param {string} status - Appointment status
 * @returns {string} Color code or name
 */
export function getStatusColor(status) {
  const colors = {
    SCHEDULED: 'blue',
    CHECKED_IN: 'green',
    WAITING: 'orange',
    IN_PROGRESS: 'purple',
    COMPLETED: 'gray',
    CANCELLED: 'red',
    NO_SHOW: 'darkred'
  };
  return colors[status] || 'gray';
}

/**
 * Calculate waiting time estimate based on queue position
 * @param {number} currentPosition - Position in queue
 * @param {number} averageConsultationTime - Average consultation time in minutes
 * @returns {number} Estimated wait time in minutes
 */
export function estimateWaitTime(currentPosition, averageConsultationTime = 15) {
  return currentPosition * averageConsultationTime;
}

/**
 * Parse time slot from string
 * @param {string} timeString - Time in "HH:MM" format
 * @returns {Object} Hours and minutes
 */
export function parseTimeSlot(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Group appointments by status for dashboard
 * @param {Array} appointments - List of appointments
 * @returns {Object} Count by status
 */
export function groupByStatus(appointments) {
  return appointments.reduce((acc, appt) => {
    acc[appt.status] = (acc[appt.status] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Format appointment for display
 * @param {Object} appointment - Appointment object with patient and doctor relations
 * @returns {Object} Formatted appointment for UI
 */
export function formatAppointmentDisplay(appointment) {
  if (!appointment) return null;
  
  const date = new Date(appointment.startTime).toLocaleDateString();
  const time = new Date(appointment.startTime).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  return {
    id: appointment.id,
    date,
    time,
    patientName: appointment.patient ? 
      `${appointment.patient.firstName} ${appointment.patient.lastName}` : 'Unknown',
    patientId: appointment.patient?.id,
    patientUhid: appointment.patient?.uhid,
    doctorName: appointment.doctor ?
      `${appointment.doctor.firstName} ${appointment.doctor.lastName}` : 'Unknown',
    doctorId: appointment.doctor?.id,
    doctorSpecialty: appointment.doctor?.specialty,
    status: appointment.status,
    type: appointment.type,
    priority: appointment.priority,
    reason: appointment.reason,
    checkedIn: !!appointment.checkedInAt,
    startTime: appointment.startTime,
    endTime: appointment.endTime
  };
}

/**
 * Generate offline ID for client
 * @returns {string} Unique offline ID
 */
export function generateOfflineId() {
  return `offline_appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date object
 * @returns {string} Formatted date
 */
export function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format time to HH:MM
 * @param {Date} date - Date object
 * @returns {string} Formatted time
 */
export function formatTime(date) {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Get appointment duration in minutes
 * @param {Object} appointment - Appointment with startTime and endTime
 * @returns {number} Duration in minutes
 */
export function getAppointmentDuration(appointment) {
  if (!appointment.startTime || !appointment.endTime) return 0;
  const start = new Date(appointment.startTime);
  const end = new Date(appointment.endTime);
  return Math.round((end - start) / 60000);
}

/**
 * Check if appointment is upcoming
 * @param {Object} appointment - Appointment object
 * @returns {boolean} True if appointment is in the future
 */
export function isUpcoming(appointment) {
  return new Date(appointment.startTime) > new Date();
}

/**
 * Check if appointment is today
 * @param {Object} appointment - Appointment object
 * @returns {boolean} True if appointment is today
 */
export function isToday(appointment) {
  const today = formatDate(new Date());
  const apptDate = formatDate(appointment.startTime);
  return today === apptDate;
}

/**
 * Sort appointments by start time
 * @param {Array} appointments - List of appointments
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array} Sorted appointments
 */
export function sortAppointmentsByTime(appointments, order = 'asc') {
  return [...appointments].sort((a, b) => {
    const timeA = new Date(a.startTime).getTime();
    const timeB = new Date(b.startTime).getTime();
    return order === 'asc' ? timeA - timeB : timeB - timeA;
  });
}

/**
 * Filter appointments by status
 * @param {Array} appointments - List of appointments
 * @param {Array} statuses - Allowed statuses
 * @returns {Array} Filtered appointments
 */
export function filterByStatus(appointments, statuses) {
  return appointments.filter(appt => statuses.includes(appt.status));
}

/**
 * Get appointment summary for patient
 * @param {Array} appointments - Patient's appointments
 * @returns {Object} Summary statistics
 */
export function getPatientAppointmentSummary(appointments) {
  const total = appointments.length;
  const completed = appointments.filter(a => a.status === 'COMPLETED').length;
  const cancelled = appointments.filter(a => a.status === 'CANCELLED').length;
  const upcoming = appointments.filter(a => 
    a.status === 'SCHEDULED' && new Date(a.startTime) > new Date()
  ).length;
  
  return {
    total,
    completed,
    cancelled,
    upcoming,
    noShow: appointments.filter(a => a.status === 'NO_SHOW').length
  };
}

/**
 * Get appointment summary for doctor
 * @param {Array} appointments - Doctor's appointments
 * @returns {Object} Summary statistics
 */
export function getDoctorAppointmentSummary(appointments) {
  const today = formatDate(new Date());
  const todayAppointments = appointments.filter(a => 
    formatDate(a.startTime) === today
  );
  
  return {
    total: appointments.length,
    today: todayAppointments.length,
    checkedIn: todayAppointments.filter(a => a.status === 'CHECKED_IN').length,
    waiting: todayAppointments.filter(a => a.status === 'WAITING').length,
    inProgress: todayAppointments.filter(a => a.status === 'IN_PROGRESS').length,
    completed: todayAppointments.filter(a => a.status === 'COMPLETED').length
  };
}

/**
 * Validate appointment data
 * @param {Object} data - Appointment data
 * @returns {Object} Validation result
 */
export function validateAppointmentData(data) {
  const errors = [];
  
  if (!data.patientId) errors.push("Patient ID is required");
  if (!data.doctorId) errors.push("Doctor ID is required");
  if (!data.date) errors.push("Date is required");
  if (!data.startTime) errors.push("Start time is required");
  
  // Validate date format
  if (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.push("Date must be in YYYY-MM-DD format");
  }
  
  // Validate time format
  if (data.startTime && !/^\d{2}:\d{2}$/.test(data.startTime)) {
    errors.push("Start time must be in HH:MM format");
  }
  
  // Check if date is in past
  if (data.date && data.startTime) {
    const appointmentDateTime = new Date(`${data.date}T${data.startTime}`);
    if (appointmentDateTime < new Date()) {
      errors.push("Cannot book appointment in the past");
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}