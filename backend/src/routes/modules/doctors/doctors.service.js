// backend/src/routes/modules/doctors/doctors.service.js

import { prisma } from "../../../lib/prisma.js";
import { generateDoctorId, getDefaultSchedule } from "./doctors.utils.js";

export class DoctorService {

  // ==================== HELPER: CHECK DOCTOR ACCESS ====================

  /**
   * Check if the current user can access a specific doctor's full details.
   * Admins can access all; doctors can only access their own (for sensitive info).
   * For basic info, we may allow all, but for operations like update/delete, route already restricts.
   * This helper is used in getDoctorById to limit sensitive fields if needed.
   */
  static canAccessDoctor(doctorId, role, currentDoctorId) {
    if (['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(role)) return true;
    if (role === 'DOCTOR') {
      return doctorId === currentDoctorId;
    }
    // Other roles (NURSE, RECEPTIONIST) – allow viewing basic info, but not sensitive?
    // We'll return true for now, as the controller will decide what fields to expose.
    return true;
  }

  // ==================== DOCTOR CREATION ====================

  /**
   * Create doctor with user account
   */
  static async createDoctor(data, hospitalId, hospitalCode, createdBy) {
    const { email, password, firstName, lastName, ...doctorData } = data;

    // Generate doctor ID if not provided
    const licenseNo = doctorData.licenseNo || generateDoctorId(hospitalCode);

    // Start transaction
    return prisma.$transaction(async (tx) => {

      // 1. Create user account
      const user = await tx.user.create({
        data: {
          email,
          password, // Already hashed in controller
          role: "DOCTOR",
          hospitalId,
          isActive: true,
          mustChangePassword: true
        }
      });

      // 2. Create doctor profile
      const doctor = await tx.doctor.create({
        data: {
          userId: user.id,
          hospitalId,
          firstName,
          lastName,
          specialty: doctorData.specialty,
          licenseNo,
          phone: doctorData.phone,
          qualification: doctorData.qualification,
          experience: doctorData.experience ? parseInt(doctorData.experience) : null,
          consultationFee: doctorData.consultationFee ? parseInt(doctorData.consultationFee) : null,
          isActive: true
        }
      });

      // 3. Create default schedule
      const defaultSchedule = getDefaultSchedule();

      for (const schedule of defaultSchedule) {
        await tx.doctorSchedule.create({
          data: {
            doctorId: doctor.id,
            hospitalId,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            slotDuration: doctorData.slotDuration || 15,
            maxPatients: doctorData.maxPatients || 20,
            isActive: true
          }
        });
      }

      // 4. Return doctor with relations
      return tx.doctor.findUnique({
        where: { id: doctor.id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              isActive: true
            }
          },
          schedules: {
            where: { isActive: true },
            orderBy: { dayOfWeek: 'asc' }
          }
        }
      });
    });
  }

  // ==================== DOCTOR RETRIEVAL ====================

  /**
   * Get doctor by ID with RBAC (allows access control)
   */
  static async getDoctorById(id, hospitalId, role, currentDoctorId) {
    const doctor = await prisma.doctor.findFirst({
      where: {
        id,
        hospitalId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            lastLoginAt: true
          }
        },
        schedules: {
          where: { isActive: true },
          orderBy: { dayOfWeek: 'asc' }
        },
        availability: {
          where: {
            date: {
              gte: new Date()
            }
          },
          orderBy: { date: 'asc' },
          take: 30
        },
        _count: {
          select: {
            appointments: true,
            patients: true,
            prescriptions: true,
            labOrders: true,
            admissions: true
          }
        }
      }
    });

    if (!doctor) return null;

    // Apply access control: if user is a doctor and not the requested one, remove sensitive info
    if (role === 'DOCTOR' && id !== currentDoctorId) {
      // Remove user email, lastLoginAt, etc. (optional)
      // For now, we just allow viewing basic info.
      // You could delete doctor.user if needed.
    }

    return doctor;
  }

  /**
   * List doctors with filters (all authenticated users)
   */
  static async listDoctors({
    hospitalId,
    role,
    currentDoctorId,
    search = '',
    specialty = null,
    departmentId = null,
    isActive = true,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  }) {
    const skip = (page - 1) * limit;

    const where = {
      hospitalId,
      isActive
    };

    // Search by name, license, phone
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { licenseNo: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { specialty: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filter by specialty
    if (specialty) {
      where.specialty = specialty;
    }

    // Filter by department (if exists in schema)
    if (departmentId) {
      where.departmentId = departmentId;
    }

    const total = await prisma.doctor.count({ where });

    const doctors = await prisma.doctor.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        user: {
          select: {
            email: true,
            isActive: true
          }
        },
        schedules: {
          where: { isActive: true },
          select: {
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            slotDuration: true,
            maxPatients: true
          }
        },
        _count: {
          select: {
            appointments: true,
            patients: true
          }
        }
      }
    });

    return {
      doctors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // ==================== DOCTOR UPDATE ====================

  /**
   * Update doctor (admin only – no need for extra RBAC)
   */
  static async updateDoctor(id, hospitalId, data) {
    const { schedules, availability, ...doctorData } = data;

    return prisma.$transaction(async (tx) => {
      // 1. Update doctor profile
      const doctor = await tx.doctor.update({
        where: {
          id,
          hospitalId
        },
        data: {
          firstName: doctorData.firstName,
          lastName: doctorData.lastName,
          specialty: doctorData.specialty,
          licenseNo: doctorData.licenseNo,
          phone: doctorData.phone,
          qualification: doctorData.qualification,
          experience: doctorData.experience ? parseInt(doctorData.experience) : null,
          consultationFee: doctorData.consultationFee ? parseInt(doctorData.consultationFee) : null,
          isActive: doctorData.isActive,
          departmentId: doctorData.departmentId
        }
      });

      // 2. Update schedules if provided
      if (schedules && Array.isArray(schedules)) {
        // Deactivate all existing schedules
        await tx.doctorSchedule.updateMany({
          where: { doctorId: id, hospitalId },
          data: { isActive: false }
        });

        // Create new schedules
        for (const schedule of schedules) {
          await tx.doctorSchedule.create({
            data: {
              doctorId: id,
              hospitalId,
              dayOfWeek: schedule.dayOfWeek,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              slotDuration: schedule.slotDuration || 15,
              maxPatients: schedule.maxPatients || 20,
              breakTime: schedule.breakTime || 0,
              isActive: true,
              validFrom: schedule.validFrom ? new Date(schedule.validFrom) : null,
              validTo: schedule.validTo ? new Date(schedule.validTo) : null
            }
          });
        }
      }

      return doctor;
    });
  }

  // ==================== AVAILABILITY ====================

  /**
   * Get available slots for a doctor on a specific date (all authenticated users)
   */
  static async getAvailableSlots(doctorId, hospitalId, date, role, currentDoctorId) {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // 1. Get doctor's regular schedule for this day
    const schedule = await prisma.doctorSchedule.findFirst({
      where: {
        doctorId,
        hospitalId,
        dayOfWeek,
        isActive: true,
        OR: [
          { validFrom: null },
          { validFrom: { lte: targetDate } }
        ],
        OR: [
          { validTo: null },
          { validTo: { gte: targetDate } }
        ]
      }
    });

    if (!schedule) {
      return { available: false, slots: [] };
    }

    // 2. Check for date-specific override
    const override = await prisma.doctorAvailability.findUnique({
      where: {
        hospitalId_doctorId_date: {
          hospitalId,
          doctorId,
          date: targetDate
        }
      }
    });

    if (override && !override.isAvailable) {
      return { available: false, reason: override.reason, slots: [] };
    }

    // Use override times if available, otherwise schedule times
    const startTime = override?.startTime || schedule.startTime;
    const endTime = override?.endTime || schedule.endTime;
    const slotDuration = schedule.slotDuration;

    // 3. Generate time slots
    const slots = [];
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    let current = new Date(start);

    while (current < end) {
      const timeString = current.toTimeString().slice(0, 5);

      // 4. Check if slot is already booked
      const booked = await prisma.appointment.count({
        where: {
          doctorId,
          startTime: {
            gte: current,
            lt: new Date(current.getTime() + slotDuration * 60000)
          },
          status: {
            notIn: ['CANCELLED', 'NO_SHOW']
          }
        }
      });

      slots.push({
        time: timeString,
        available: booked === 0,
        datetime: new Date(current)
      });

      current.setMinutes(current.getMinutes() + slotDuration);
    }

    return {
      available: true,
      date: targetDate,
      schedule: {
        startTime,
        endTime,
        slotDuration,
        maxPatients: schedule.maxPatients
      },
      slots
    };
  }

  /**
   * Set doctor availability override (with RBAC in controller)
   */
  static async setAvailability(data, hospitalId) {
    const { doctorId, date, isAvailable, startTime, endTime, reason } = data;

    return prisma.doctorAvailability.upsert({
      where: {
        hospitalId_doctorId_date: {
          hospitalId,
          doctorId,
          date: new Date(date)
        }
      },
      update: {
        isAvailable,
        startTime,
        endTime,
        reason
      },
      create: {
        doctorId,
        hospitalId,
        date: new Date(date),
        isAvailable,
        startTime,
        endTime,
        reason
      }
    });
  }

  // ==================== STATISTICS ====================

  /**
   * Get doctor statistics (admin only)
   */
  static async getDoctorStats(hospitalId, role) {
    // role is passed for logging, but no filtering needed since admin-only

    const [
      totalDoctors,
      activeDoctors,
      bySpecialty,
      byDepartment,
      topDoctors
    ] = await Promise.all([
      // Total doctors
      prisma.doctor.count({ where: { hospitalId } }),

      // Active doctors
      prisma.doctor.count({ where: { hospitalId, isActive: true } }),

      // Group by specialty
      prisma.doctor.groupBy({
        by: ['specialty'],
        where: {
          hospitalId,
          specialty: { not: null }
        },
        _count: true
      }),

      // Group by department (if exists)
      prisma.doctor.groupBy({
        by: ['departmentId'],
        where: {
          hospitalId,
          departmentId: { not: null }
        },
        _count: true
      }),

      // Top doctors by appointments
      prisma.doctor.findMany({
        where: { hospitalId, isActive: true },
        take: 5,
        orderBy: {
          appointments: {
            _count: 'desc'
          }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          specialty: true,
          _count: {
            select: {
              appointments: true,
              patients: true
            }
          }
        }
      })
    ]);

    return {
      totalDoctors,
      activeDoctors,
      inactiveDoctors: totalDoctors - activeDoctors,
      bySpecialty,
      byDepartment,
      topDoctors
    };
  }

  /**
   * Get doctor's upcoming appointments
   * (already filtered by doctorId, no additional RBAC needed in service)
   */
  static async getUpcomingAppointments(doctorId, hospitalId, days = 7) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return prisma.appointment.findMany({
      where: {
        doctorId,
        hospitalId,
        startTime: {
          gte: new Date(),
          lte: endDate
        },
        status: {
          notIn: ['CANCELLED', 'COMPLETED', 'NO_SHOW']
        }
      },
      orderBy: {
        startTime: 'asc'
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
        vitalRecords: {
          take: 1,
          orderBy: { recordedAt: 'desc' }
        }
      }
    });
  }
}