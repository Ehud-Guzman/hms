// backend/src/routes/modules/appointments/appointments.service.js

import { prisma } from "../../../lib/prisma.js";
import { calculateEndTime } from "./appointments.utils.js";

export class AppointmentService {

  // ==================== HELPER: CHECK APPOINTMENT ACCESS ====================

  /**
   * Check if the current user can access a given appointment.
   * @param {Object} appointment - Must include doctorId field
   * @param {string} role - User role
   * @param {string} currentDoctorId - Current doctor ID (if user is a doctor)
   * @returns {boolean}
   */
  static canAccessAppointment(appointment, role, currentDoctorId) {
    if (role === 'SYSTEM_ADMIN' || role === 'HOSPITAL_ADMIN') return true;
    if (role === 'DOCTOR') {
      return appointment.doctorId === currentDoctorId;
    }
    // For other roles (NURSE, RECEPTIONIST, etc.), allow access as needed
    // Here we allow them to view any appointment within the hospital (already filtered by hospital)
    return true;
  }

  // ==================== APPOINTMENT CREATION ====================

  /**
   * Book new appointment
   */
  static async bookAppointment(data, hospitalId, hospitalCode, userId, role, currentDoctorId) {
    const {
      patientId,
      doctorId,
      departmentId,
      date,
      startTime,
      reason,
      symptoms,
      type = 'CONSULTATION',
      priority = 'ROUTINE',
      offlineId
    } = data;

    // Parse date and time
    const startDateTime = new Date(`${date}T${startTime}`);

    // Get doctor's schedule to determine duration
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        schedules: {
          where: {
            dayOfWeek: startDateTime.getDay(),
            isActive: true
          }
        }
      }
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    // Get slot duration from schedule or default
    const schedule = doctor.schedules[0];
    const duration = schedule?.slotDuration || 15;

    // Calculate end time
    const endDateTime = calculateEndTime(startDateTime, duration);

    // Check for conflicts
    const conflicting = await prisma.appointment.findFirst({
      where: {
        doctorId,
        hospitalId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        OR: [
          {
            startTime: { lt: endDateTime },
            endTime: { gt: startDateTime }
          }
        ]
      }
    });

    if (conflicting) {
      throw new Error("Time slot is already booked");
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        departmentId: departmentId || null,
        date: startDateTime,
        startTime: startDateTime,
        endTime: endDateTime,
        status: 'SCHEDULED',
        type,
        priority,
        reason,
        symptoms,
        hospitalId,
        offlineId: offlineId || null,
        syncStatus: 'SYNCED'
      },
      include: {
        patient: {
          select: {
            id: true,
            uhid: true,
            firstName: true,
            lastName: true,
            phone: true,
            dob: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
            consultationFee: true
          }
        }
      }
    });

    return appointment;
  }

  // ==================== LIST APPOINTMENTS (with filters and RBAC) ====================

  /**
   * Get all appointments for a hospital with optional filters
   */
  static async getAllAppointments(hospitalId, query = {}, role, currentDoctorId) {
    const { page = 1, limit = 20, status, doctorId, patientId, fromDate, toDate } = query;
    const skip = (page - 1) * limit;

    const where = { hospitalId };

    // Role-based base filter
    if (role === 'DOCTOR') {
      where.doctorId = currentDoctorId;
    }

    if (status) where.status = status;
    if (doctorId) where.doctorId = doctorId; // overrides role filter if needed (admins can query any doctor)
    if (patientId) where.patientId = patientId;
    if (fromDate || toDate) {
      where.startTime = {};
      if (fromDate) where.startTime.gte = new Date(fromDate);
      if (toDate) where.startTime.lte = new Date(toDate);
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { startTime: 'desc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, uhid: true } },
          doctor: { select: { id: true, firstName: true, lastName: true, specialty: true } },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get appointment by ID (with RBAC)
   */
  static async getAppointmentById(id, hospitalId, role, currentDoctorId) {
    const appointment = await prisma.appointment.findFirst({
      where: { id, hospitalId },
      include: {
        patient: {
          select: {
            id: true,
            uhid: true,
            firstName: true,
            lastName: true,
            phone: true,
            dob: true,
            bloodGroup: true,
            allergies: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
            consultationFee: true
          }
        },
        vitals: {
          orderBy: { recordedAt: 'desc' },
          take: 5
        },
        prescription: true,
        labOrders: {
          where: { status: { not: 'CANCELLED' } }
        },
        bill: true
      }
    });

    if (!appointment) return null;

    // Apply access control
    if (!this.canAccessAppointment(appointment, role, currentDoctorId)) {
      return null; // treat as not found
    }

    return appointment;
  }

  /**
   * Get today's appointments (with RBAC)
   */
  static async getTodayAppointments(hospitalId, role, currentDoctorId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where = {
      hospitalId,
      startTime: {
        gte: today,
        lt: tomorrow
      },
      status: { notIn: ['CANCELLED'] }
    };

    if (role === 'DOCTOR') {
      where.doctorId = currentDoctorId;
    }

    return prisma.appointment.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { startTime: 'asc' }
      ],
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true
          }
        }
      }
    });
  }

  /**
   * Get waiting list (with RBAC)
   */
  static async getWaitingList(hospitalId, role, currentDoctorId) {
    const where = {
      hospitalId,
      status: { in: ['CHECKED_IN', 'WAITING'] },
      startTime: { gte: new Date() }
    };

    if (role === 'DOCTOR') {
      where.doctorId = currentDoctorId;
    }

    return prisma.appointment.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { checkedInAt: 'asc' }
      ],
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true
          }
        }
      }
    });
  }

  /**
   * Get calendar view (with RBAC)
   */
  static async getCalendar(hospitalId, startDate, endDate, queryDoctorId, role, currentDoctorId) {
    const where = {
      hospitalId,
      startTime: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      },
      status: { notIn: ['CANCELLED'] }
    };

    if (queryDoctorId) {
      where.doctorId = queryDoctorId;
    } else if (role === 'DOCTOR') {
      where.doctorId = currentDoctorId;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: {
        startTime: 'asc'
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            uhid: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true
          }
        }
      }
    });

    // Group by date for calendar
    const calendar = {};
    appointments.forEach(appt => {
      const date = appt.startTime.toISOString().split('T')[0];
      if (!calendar[date]) {
        calendar[date] = [];
      }
      calendar[date].push(appt);
    });

    return calendar;
  }

  /**
   * Get patient appointments (with RBAC)
   */
  static async getPatientAppointments(patientId, hospitalId, limit = 10, role, currentDoctorId) {
    const where = {
      patientId,
      hospitalId
    };

    // If doctor, ensure they are the doctor for those appointments
    if (role === 'DOCTOR') {
      where.doctorId = currentDoctorId;
    }

    return prisma.appointment.findMany({
      where,
      orderBy: {
        startTime: 'desc'
      },
      take: limit,
      include: {
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            specialty: true
          }
        },
        vitals: {
          take: 1,
          orderBy: { recordedAt: 'desc' }
        }
      }
    });
  }

  /**
   * Get doctor appointments (with RBAC)
   */
  static async getDoctorAppointments(targetDoctorId, hospitalId, date = null, role, currentDoctorId) {
    // If current user is a doctor, they can only see their own appointments
    if (role === 'DOCTOR' && targetDoctorId !== currentDoctorId) {
      throw new Error("You can only view your own appointments");
    }

    const where = {
      doctorId: targetDoctorId,
      hospitalId,
      status: { notIn: ['CANCELLED'] }
    };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      where.startTime = {
        gte: start,
        lte: end
      };
    }

    return prisma.appointment.findMany({
      where,
      orderBy: {
        startTime: 'asc'
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            uhid: true,
            phone: true,
            dob: true
          }
        },
        vitals: {
          take: 1,
          orderBy: { recordedAt: 'desc' }
        }
      }
    });
  }

  // ==================== APPOINTMENT STATE TRANSITIONS (with RBAC) ====================

  /**
   * Check-in patient (receptionists, nurses, admins; doctors may check in their own patients)
   */
  static async checkIn(id, hospitalId, userId, role, currentDoctorId) {
    const appointment = await prisma.appointment.findFirst({
      where: { id, hospitalId, status: 'SCHEDULED' }
    });

    if (!appointment) return null;

    // Permission: doctors can only check in their own patients
    if (role === 'DOCTOR' && appointment.doctorId !== currentDoctorId) {
      throw new Error("You are not allowed to check in this patient");
    }

    return prisma.appointment.update({
      where: { id },
      data: {
        status: 'CHECKED_IN',
        checkedInAt: new Date(),
        checkedInBy: userId
      },
      include: {
        patient: true,
        doctor: true
      }
    });
  }

  /**
   * Start appointment (doctor begins)
   */
  static async startAppointment(id, hospitalId, role, currentDoctorId) {
    const appointment = await prisma.appointment.findFirst({
      where: { id, hospitalId, status: 'WAITING' }
    });

    if (!appointment) {
      throw new Error("Appointment not found or not in WAITING status");
    }

    // Only the assigned doctor can start the appointment
    if (role === 'DOCTOR' && appointment.doctorId !== currentDoctorId) {
      throw new Error("You are not allowed to start this appointment");
    }

    return prisma.appointment.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        consultedAt: new Date()
      }
    });
  }

  /**
   * Complete appointment
   */
  static async completeAppointment(id, hospitalId, data, role, currentDoctorId) {
    const { diagnosis, treatment, notes, icd10Code, userId } = data;

    const appointment = await prisma.appointment.findFirst({
      where: { id, hospitalId, status: 'IN_PROGRESS' }
    });

    if (!appointment) {
      throw new Error("Appointment not found or not in progress");
    }

    if (role === 'DOCTOR' && appointment.doctorId !== currentDoctorId) {
      throw new Error("You are not allowed to complete this appointment");
    }

    return prisma.$transaction(async (tx) => {
      // Update appointment
      const updatedAppt = await tx.appointment.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          diagnosis,
          treatment,
          notes
        }
      });

      // Create medical record
      await tx.medicalRecord.create({
        data: {
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          recordType: 'CONSULTATION',
          title: 'Consultation',
          description: diagnosis,
          icd10Code,
          hospitalId,
          recordedBy: userId
        }
      });

      return updatedAppt;
    });
  }

  /**
   * Cancel appointment
   */
  static async cancelAppointment(id, hospitalId, reason, userId, role, currentDoctorId) {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        hospitalId,
        status: { notIn: ['COMPLETED', 'CANCELLED'] }
      }
    });

    if (!appointment) {
      throw new Error("Appointment not found or cannot be cancelled");
    }

    // Permission: doctors can cancel their own appointments; admins/receptionists can cancel any
    if (role === 'DOCTOR' && appointment.doctorId !== currentDoctorId) {
      throw new Error("You are not allowed to cancel this appointment");
    }

    return prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason
      }
    });
  }

  /**
   * Mark as no-show
   */
  static async markNoShow(id, hospitalId, role, currentDoctorId) {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        hospitalId,
        status: { in: ['SCHEDULED', 'CHECKED_IN'] }
      }
    });

    if (!appointment) {
      throw new Error("Appointment not found or cannot be marked no-show");
    }

    if (role === 'DOCTOR' && appointment.doctorId !== currentDoctorId) {
      throw new Error("You are not allowed to mark this appointment as no-show");
    }

    return prisma.appointment.update({
      where: { id },
      data: { status: 'NO_SHOW' }
    });
  }

  /**
   * Reschedule appointment
   */
  static async rescheduleAppointment(id, hospitalId, newDate, newTime, reason, role, currentDoctorId) {
    const appointment = await prisma.appointment.findFirst({
      where: { id, hospitalId },
      include: { doctor: true }
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    if (role === 'DOCTOR' && appointment.doctorId !== currentDoctorId) {
      throw new Error("You are not allowed to reschedule this appointment");
    }

    const startDateTime = new Date(`${newDate}T${newTime}`);

    // Get doctor's schedule for new time
    const doctor = await prisma.doctor.findUnique({
      where: { id: appointment.doctorId },
      include: {
        schedules: {
          where: {
            dayOfWeek: startDateTime.getDay(),
            isActive: true
          }
        }
      }
    });

    const schedule = doctor?.schedules[0];
    const duration = schedule?.slotDuration || 15;
    const endDateTime = calculateEndTime(startDateTime, duration);

    // Check conflicts
    const conflicting = await prisma.appointment.findFirst({
      where: {
        doctorId: appointment.doctorId,
        hospitalId,
        id: { not: id },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        OR: [
          {
            startTime: { lt: endDateTime },
            endTime: { gt: startDateTime }
          }
        ]
      }
    });

    if (conflicting) {
      throw new Error("New time slot is not available");
    }

    return prisma.appointment.update({
      where: { id },
      data: {
        startTime: startDateTime,
        endTime: endDateTime,
        date: startDateTime,
        status: 'SCHEDULED',
        notes: appointment.notes
          ? `${appointment.notes}\nRescheduled: ${reason}`
          : `Rescheduled: ${reason}`
      }
    });
  }

  // ==================== STATISTICS ====================

  /**
   * Get appointment statistics (with RBAC)
   */
/**
 * Get appointment statistics (role‑aware)
 */
static async getAppointmentStats(hospitalId, role, currentDoctorId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Base where clause
  const where = { hospitalId };

  // Apply role‑based filter
  if (role === 'DOCTOR' && currentDoctorId) {
    where.doctorId = currentDoctorId;
  }
  // For other roles (nurse, receptionist, admin) – no extra filter (hospital‑wide stats)

  const [
    totalToday,
    checkedIn,
    waiting,
    inProgress,
    completed,
    cancelled,
    noShow,
    byDoctor,
    byDepartment
  ] = await Promise.all([
    // Total appointments today (excluding cancelled)
    prisma.appointment.count({
      where: {
        ...where,
        startTime: { gte: today },
        status: { notIn: ['CANCELLED'] }
      }
    }),

    // Checked in
    prisma.appointment.count({
      where: {
        ...where,
        status: 'CHECKED_IN'
      }
    }),

    // Waiting
    prisma.appointment.count({
      where: {
        ...where,
        status: 'WAITING'
      }
    }),

    // In progress
    prisma.appointment.count({
      where: {
        ...where,
        status: 'IN_PROGRESS'
      }
    }),

    // Completed today
    prisma.appointment.count({
      where: {
        ...where,
        status: 'COMPLETED',
        startTime: { gte: today }
      }
    }),

    // Cancelled today
    prisma.appointment.count({
      where: {
        ...where,
        status: 'CANCELLED',
        startTime: { gte: today }
      }
    }),

    // No‑show today
    prisma.appointment.count({
      where: {
        ...where,
        status: 'NO_SHOW',
        startTime: { gte: today }
      }
    }),

    // By doctor – only for admins, otherwise return empty
    role === 'DOCTOR'
      ? Promise.resolve([])
      : prisma.appointment.groupBy({
          by: ['doctorId'],
          where: {
            hospitalId,
            startTime: { gte: today }
          },
          _count: true
        }),

    // By department – only for admins
    role === 'DOCTOR'
      ? Promise.resolve([])
      : prisma.appointment.groupBy({
          by: ['departmentId'],
          where: {
            hospitalId,
            startTime: { gte: today },
            departmentId: { not: null }
          },
          _count: true
        })
  ]);

  return {
    today: {
      total: totalToday,
      completed,
      cancelled,
      noShow,
      active: totalToday - completed - cancelled - noShow
    },
    current: {
      checkedIn,
      waiting,
      inProgress
    },
    byDoctor,
    byDepartment
  };
}

  // ==================== SYNC ====================

  /**
   * Sync offline appointments
   */
  static async syncOfflineAppointments(appointments, hospitalId, userId, role, currentDoctorId) {
    const results = [];

    for (const appt of appointments) {
      try {
        // Check if exists by offlineId
        if (appt.offlineId) {
          const existing = await prisma.appointment.findFirst({
            where: {
              hospitalId,
              offlineId: appt.offlineId
            }
          });

          if (existing) {
            // For updates, ensure user has permission (simplified – you may want to check status transitions)
            const updated = await prisma.appointment.update({
              where: { id: existing.id },
              data: {
                status: appt.status,
                notes: appt.notes,
                syncStatus: 'SYNCED'
              }
            });
            results.push(updated);
            continue;
          }
        }

        // Create new
        const hospital = await prisma.hospital.findUnique({
          where: { id: hospitalId }
        });

        const created = await this.bookAppointment(
          appt,
          hospitalId,
          hospital.code,
          userId,
          role,
          currentDoctorId
        );
        results.push(created);

      } catch (error) {
        results.push({
          offlineId: appt.offlineId,
          error: error.message,
          status: 'FAILED'
        });
      }
    }

    return results;
  }
}