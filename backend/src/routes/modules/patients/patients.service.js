// backend/src/routes/modules/patients/patients.service.js

import { prisma } from "../../../lib/prisma.js";
import { generateSequentialUHID } from "./patients.utils.js";

export class PatientService {

  // ==================== HELPER: ACCESSIBLE PATIENT IDS FOR DOCTOR ====================

  /**
   * Get all patient IDs that a doctor has access to (primary doctor or appointment history)
   */
  static async getAccessiblePatientIdsForDoctor(doctorId, hospitalId) {
    // Patients where doctor is primary
    const primary = await prisma.patient.findMany({
      where: { primaryDoctorId: doctorId, hospitalId },
      select: { id: true }
    });
    // Patients who have had appointments with this doctor
    const appointments = await prisma.appointment.findMany({
      where: { doctorId, hospitalId },
      select: { patientId: true },
      distinct: ['patientId']
    });
    const ids = [
      ...primary.map(p => p.id),
      ...appointments.map(a => a.patientId)
    ];
    return [...new Set(ids)];
  }

  // ==================== HELPER: CHECK PATIENT ACCESS ====================

  /**
   * Check if current user can access a given patient.
   * @param {Object} patient - Patient object (must include id, primaryDoctorId)
   * @param {string} role - User role
   * @param {string} currentDoctorId - Current doctor ID (if user is a doctor)
   * @param {string} currentPatientId - Current patient ID (if user is a patient)
   * @returns {boolean}
   */
  static async canAccessPatient(patient, role, currentDoctorId, currentPatientId) {
    if (['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'NURSE', 'ACCOUNTANT'].includes(role)) {
      return true;
    }
    if (role === 'DOCTOR') {
      // Check if doctor is primary or has appointment with patient
      if (patient.primaryDoctorId === currentDoctorId) return true;
      const hasAppointment = await prisma.appointment.findFirst({
        where: {
          doctorId: currentDoctorId,
          patientId: patient.id,
          hospitalId: patient.hospitalId
        }
      });
      return !!hasAppointment;
    }
    if (role === 'PATIENT') {
      return patient.id === currentPatientId;
    }
    return false;
  }

  // ==================== PATIENT CREATION ====================

  /**
   * Get next patient sequence number for hospital
   */
  static async getNextSequence(hospitalId, year) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const count = await prisma.patient.count({
      where: {
        hospitalId,
        createdAt: {
          gte: startOfYear,
          lte: endOfYear
        }
      }
    });

    return count + 1;
  }

  /**
   * Generate unique UHID
   */
  static async generateUHID(hospitalId, hospitalCode) {
    const year = new Date().getFullYear();
    const sequence = await this.getNextSequence(hospitalId, year);
    return generateSequentialUHID(hospitalCode, year, sequence);
  }

  /**
   * Create patient with offline support
   */
  static async createPatient(data, hospitalId, hospitalCode, userId, role, currentDoctorId) {
    // Generate UHID
    const uhid = await this.generateUHID(hospitalId, hospitalCode);

    // Prepare medical JSON fields
    const allergies = data.allergies ?
      (Array.isArray(data.allergies) ? data.allergies : [data.allergies]) : [];

    const chronicConditions = data.chronicConditions ?
      (Array.isArray(data.chronicConditions) ? data.chronicConditions : [data.chronicConditions]) : [];

    // Create patient
    const patient = await prisma.patient.create({
      data: {
        uhid,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        dob: data.dob ? new Date(data.dob) : null,
        bloodGroup: data.bloodGroup,
        phone: data.phone,
        email: data.email,
        address: data.address,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelation: data.emergencyContactRelation,
        allergies: allergies.length > 0 ? allergies : null,
        chronicConditions: chronicConditions.length > 0 ? chronicConditions : null,
        medicalHistory: data.medicalHistory || null,
        currentMedications: data.currentMedications || null,
        insuranceProvider: data.insuranceProvider,
        insurancePolicyNo: data.insurancePolicyNo,
        primaryDoctorId: data.primaryDoctorId,
        isActive: true,
        offlineId: data.offlineId || null,
        syncStatus: "SYNCED",
        hospitalId
      },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        primaryDoctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true
          }
        }
      }
    });

    return patient;
  }

  // ==================== PATIENT RETRIEVAL ====================

  /**
   * Get patient by ID (with RBAC)
   */
  static async getPatientById(id, hospitalId, role, currentDoctorId, currentPatientId) {
    const patient = await prisma.patient.findFirst({
      where: {
        id,
        hospitalId
      },
      include: {
        primaryDoctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true
          }
        },
        appointments: {
          take: 5,
          orderBy: { startTime: 'desc' },
          select: {
            id: true,
            startTime: true,
            status: true,
            doctor: {
              select: {
                firstName: true,
                lastName: true,
                specialty: true
              }
            }
          }
        },
        vitalRecords: {
          take: 5,
          orderBy: { recordedAt: 'desc' }
        },
        _count: {
          select: {
            appointments: true,
            prescriptions: true,
            labOrders: true,
            admissions: true,
            bills: true
          }
        }
      }
    });

    if (!patient) return null;

    // Apply access control
    if (!(await this.canAccessPatient(patient, role, currentDoctorId, currentPatientId))) {
      return null;
    }

    return patient;
  }

  /**
   * Get patient by UHID (with RBAC)
   */
  static async getPatientByUHID(uhid, hospitalId, role, currentDoctorId, currentPatientId) {
    const patient = await prisma.patient.findFirst({
      where: {
        uhid,
        hospitalId
      },
      include: {
        primaryDoctor: true
      }
    });

    if (!patient) return null;

    if (!(await this.canAccessPatient(patient, role, currentDoctorId, currentPatientId))) {
      return null;
    }

    return patient;
  }

  /**
   * List patients with filters (with RBAC)
   */
  static async listPatients({
    hospitalId,
    role,
    currentDoctorId,
    currentPatientId,
    search = '',
    doctorId = null,
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

    // Role-based filtering
    if (role === 'DOCTOR') {
      const accessibleIds = await this.getAccessiblePatientIdsForDoctor(currentDoctorId, hospitalId);
      if (accessibleIds.length === 0) {
        return { patients: [], pagination: { page, limit, total: 0, pages: 0 } };
      }
      where.id = { in: accessibleIds };
    } else if (role === 'PATIENT') {
      where.id = currentPatientId;
    }
    // For other roles (RECEPTIONIST, NURSE, ACCOUNTANT, ADMIN) – no extra filter

    // Search
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { uhid: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filter by primary doctor (if specified, and user has permission)
    if (doctorId) {
      // If doctor is specified, we must ensure the user is allowed to filter by that doctor.
      // For simplicity, we'll allow if user is admin or if doctorId matches currentDoctorId.
      if (role !== 'DOCTOR' || doctorId === currentDoctorId) {
        where.primaryDoctorId = doctorId;
      } else {
        // User is a doctor trying to filter by another doctor – ignore or restrict.
        // We'll ignore the filter.
      }
    }

    const total = await prisma.patient.count({ where });

    const patients = await prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      select: {
        id: true,
        uhid: true,
        firstName: true,
        lastName: true,
        gender: true,
        dob: true,
        bloodGroup: true,
        phone: true,
        email: true,
        isActive: true,
        createdAt: true,
        primaryDoctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true
          }
        },
        _count: {
          select: {
            appointments: true,
            prescriptions: true
          }
        }
      }
    });

    return {
      patients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // ==================== PATIENT UPDATE ====================

  /**
   * Update patient (with RBAC)
   */
  static async updatePatient(id, hospitalId, data, role, currentDoctorId, userId) {
    // First fetch patient to check access
    const patient = await prisma.patient.findFirst({
      where: { id, hospitalId }
    });

    if (!patient) {
      throw new Error("Patient not found");
    }

    // Access control: only admins, receptionists, nurses, or the doctor (if primary or has appointment) can update
    if (!(await this.canAccessPatient(patient, role, currentDoctorId, null))) {
      throw new Error("Access denied");
    }

    // Prepare medical JSON fields
    const allergies = data.allergies ?
      (Array.isArray(data.allergies) ? data.allergies : [data.allergies]) : undefined;

    const chronicConditions = data.chronicConditions ?
      (Array.isArray(data.chronicConditions) ? data.chronicConditions : [data.chronicConditions]) : undefined;

    const updated = await prisma.patient.update({
      where: {
        id,
        hospitalId
      },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        dob: data.dob ? new Date(data.dob) : undefined,
        bloodGroup: data.bloodGroup,
        phone: data.phone,
        email: data.email,
        address: data.address,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelation: data.emergencyContactRelation,
        allergies,
        chronicConditions,
        medicalHistory: data.medicalHistory,
        currentMedications: data.currentMedications,
        insuranceProvider: data.insuranceProvider,
        insurancePolicyNo: data.insurancePolicyNo,
        primaryDoctorId: data.primaryDoctorId,
        isActive: data.isActive,
        syncStatus: "SYNCED"
      },
      include: {
        primaryDoctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true
          }
        }
      }
    });

    return updated;
  }

  /**
   * Delete/deactivate patient (admin only)
   */
  static async deletePatient(id, hospitalId, role, userId) {
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(role)) {
      throw new Error("Access denied: Only admins can deactivate patients");
    }

    return prisma.patient.update({
      where: {
        id,
        hospitalId
      },
      data: {
        isActive: false,
        syncStatus: "SYNCED"
      }
    });
  }

  /**
   * Reactivate patient (admin only)
   */
  static async reactivatePatient(id, hospitalId, role, userId) {
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(role)) {
      throw new Error("Access denied: Only admins can reactivate patients");
    }

    return prisma.patient.update({
      where: {
        id,
        hospitalId
      },
      data: {
        isActive: true,
        syncStatus: "SYNCED"
      }
    });
  }

  // ==================== STATISTICS ====================

/**
 * Get patient statistics (role‑aware)
 */
static async getPatientStats(hospitalId, role, currentDoctorId) {
  // Base where clause
  let where = { hospitalId };

  if (role === 'DOCTOR' && currentDoctorId) {
    const accessibleIds = await this.getAccessiblePatientIdsForDoctor(currentDoctorId, hospitalId);
    where.id = { in: accessibleIds };
  }
  // For other roles (admin, nurse, receptionist) – no extra filter (hospital‑wide)

  const [
    totalPatients,
    activePatients,
    newPatientsToday,
    newPatientsThisMonth,
    genderDistribution,
    bloodGroupDistribution
  ] = await Promise.all([
    prisma.patient.count({ where }),
    prisma.patient.count({ where: { ...where, isActive: true } }),
    prisma.patient.count({
      where: {
        ...where,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    }),
    prisma.patient.count({
      where: {
        ...where,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    }),
    prisma.patient.groupBy({
      by: ['gender'],
      where,
      _count: true
    }),
    prisma.patient.groupBy({
      by: ['bloodGroup'],
      where: {
        ...where,
        bloodGroup: { not: null }
      },
      _count: true
    })
  ]);

  return {
    totalPatients,
    activePatients,
    newPatientsToday,
    newPatientsThisMonth,
    genderDistribution,
    bloodGroupDistribution
  };
}

  // ==================== SYNC ====================

  /**
   * Offline sync - create or update from offline client (with RBAC)
   */
  static async syncOfflinePatient(data, hospitalId, hospitalCode, userId, role, currentDoctorId) {
    // Check if patient exists by offlineId
    if (data.offlineId) {
      const existing = await prisma.patient.findFirst({
        where: {
          hospitalId,
          offlineId: data.offlineId
        }
      });

      if (existing) {
        // Update existing – ensure user has access
        return this.updatePatient(existing.id, hospitalId, data, role, currentDoctorId, userId);
      }
    }

    // Check if patient exists by UHID (if provided)
    if (data.uhid) {
      const existing = await prisma.patient.findFirst({
        where: {
          hospitalId,
          uhid: data.uhid
        }
      });

      if (existing) {
        return this.updatePatient(existing.id, hospitalId, data, role, currentDoctorId, userId);
      }
    }

    // Create new patient
    return this.createPatient(data, hospitalId, hospitalCode, userId, role, currentDoctorId);
  }
}