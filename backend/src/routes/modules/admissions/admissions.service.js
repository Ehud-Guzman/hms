// backend/src/routes/modules/admissions/admissions.service.js

import { prisma } from "../../../lib/prisma.js";
import { 
  generateAdmissionNumber,
  calculateLengthOfStay,
  validateBedCapacity,
  isBedAvailable,
  validateAdmissionDates,
  calculateOccupancyRate
} from "./admissions.utils.js";

export class AdmissionsService {
  
  // ==================== HELPER: CHECK ADMISSION ACCESS ====================
  
  /**
   * Check if the current user can access a given admission.
   * @param {Object} admission - The admission record (must include doctorId field)
   * @param {string} role - User role
   * @param {string} currentDoctorId - Current doctor ID (if user is a doctor)
   * @returns {boolean}
   */
  static canAccessAdmission(admission, role, currentDoctorId) {
    if (role === 'SYSTEM_ADMIN' || role === 'HOSPITAL_ADMIN') return true;
    if (role === 'DOCTOR') {
      return admission.admittingDoctorId === currentDoctorId;
    }
    // For other roles (NURSE, RECEPTIONIST, etc.) you may define additional rules
    // For now, allow nurses/receptionists to view if needed – adjust per business rules
    if (role === 'NURSE' || role === 'RECEPTIONIST') {
      return true; // or restrict further
    }
    return false;
  }

  // ==================== WARD MANAGEMENT ====================

  /**
   * Create ward
   */
  static async createWard(data, hospitalId) {
    const {
      name,
      code,
      type,
      location,
      phone,
      totalBeds
    } = data;
    
    // Check if code already exists
    if (code) {
      const existing = await prisma.ward.findFirst({
        where: {
          hospitalId,
          code
        }
      });
      
      if (existing) {
        throw new Error(`Ward with code ${code} already exists`);
      }
    }
    
    return prisma.ward.create({
      data: {
        name,
        code: code || `WARD-${Date.now()}`,
        type,
        location,
        phone,
        totalBeds,
        availableBeds: totalBeds,
        occupiedBeds: 0,
        isActive: true,
        hospitalId
      }
    });
  }

  /**
   * Update ward
   */
  static async updateWard(id, hospitalId, data) {
    const ward = await prisma.ward.findFirst({
      where: { id, hospitalId }
    });
    
    if (!ward) {
      throw new Error("Ward not found");
    }
    
    // If total beds changed, adjust available beds
    let updateData = { ...data };
    if (data.totalBeds && data.totalBeds !== ward.totalBeds) {
      const bedDiff = data.totalBeds - ward.totalBeds;
      updateData.availableBeds = ward.availableBeds + bedDiff;
    }
    
    return prisma.ward.update({
      where: { id },
      data: updateData
    });
  }

  /**
   * Get ward by ID
   */
  static async getWardById(id, hospitalId) {
    return prisma.ward.findFirst({
      where: {
        id,
        hospitalId
      },
      include: {
        beds: {
          where: { isActive: true },
          orderBy: { bedNumber: 'asc' },
          include: {
            admission: {
              where: {
                status: 'ADMITTED'
              },
              include: {
                patient: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    uhid: true
                  }
                }
              }
            }
          }
        },
        nurses: {
          take: 10,
          orderBy: { date: 'desc' }
        }
      }
    });
  }

  /**
   * List wards
   */
  static async listWards({
    hospitalId,
    role,                     // <-- added
    type = null,
    isActive = true,
    search = '',
    page = 1,
    limit = 20
  }) {
    const skip = (page - 1) * limit;
    
    const where = {
      hospitalId,
      isActive
    };
    
    if (type) {
      where.type = type;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const total = await prisma.ward.count({ where });
    
    const wards = await prisma.ward.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        name: 'asc'
      },
      include: {
        beds: {
          where: { isActive: true },
          select: {
            id: true,
            bedNumber: true,
            isOccupied: true
          }
        },
        _count: {
          select: {
            beds: true,
            nurses: true
          }
        }
      }
    });
    
    // Add occupancy rate
    const wardsWithStats = wards.map(ward => ({
      ...ward,
      occupancyRate: ward.totalBeds > 0 
        ? Math.round((ward.occupiedBeds / ward.totalBeds) * 100) 
        : 0,
      availableBeds: ward.totalBeds - ward.occupiedBeds
    }));
    
    return {
      wards: wardsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get ward types
   */
  static async getWardTypes(hospitalId) {
    const types = await prisma.ward.findMany({
      where: {
        hospitalId,
        type: { not: null }
      },
      distinct: ['type'],
      select: {
        type: true
      }
    });
    
    return types.map(t => t.type).filter(Boolean);
  }

  // ==================== BED MANAGEMENT ====================

  /**
   * Create bed
   */
  static async createBed(data, hospitalId) {
    const {
      wardId,
      bedNumber,
      dailyRate
    } = data;
    
    // Check if ward exists
    const ward = await prisma.ward.findFirst({
      where: {
        id: wardId,
        hospitalId
      },
      include: {
        beds: true
      }
    });
    
    if (!ward) {
      throw new Error("Ward not found");
    }
    
    // Validate bed capacity
    const validation = validateBedCapacity(ward, bedNumber);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return prisma.bed.create({
      data: {
        wardId,
        bedNumber,
        dailyRate: dailyRate || 0,
        isOccupied: false,
        isActive: true,
        hospitalId
      }
    });
  }

  /**
   * Update bed
   */
  static async updateBed(id, hospitalId, data) {
    return prisma.bed.update({
      where: {
        id,
        hospitalId
      },
      data: {
        bedNumber: data.bedNumber,
        dailyRate: data.dailyRate,
        isActive: data.isActive
      }
    });
  }

  /**
   * Get available beds
   */
static async getAvailableBeds(hospitalId, wardId = null) {
  const where = {
    hospitalId,
    isActive: true,
    isOccupied: false
  };
  
  if (wardId) {
    where.wardId = wardId;
  }
  
  return prisma.bed.findMany({
    where,
    include: {
      ward: {
        select: {
          id: true,
          name: true,
          type: true
          // ❌ dailyRate removed – it's not a field on Ward
        }
      }
    },
    orderBy: [
      { ward: { name: 'asc' } },
      { bedNumber: 'asc' }
    ]
  });
}

/**
 * Update admission details (non‑status fields)
 */
/**
 * Update admission details (including bed if mutable)
 */
static async updateAdmission(id, hospitalId, data, userId, role, currentDoctorId) {
  const admission = await prisma.admission.findFirst({
    where: { id, hospitalId },
    include: { bed: true }
  });

  if (!admission) {
    throw new Error("Admission not found");
  }

  // Permission check
  if (!this.canAccessAdmission(admission, role, currentDoctorId)) {
    throw new Error("Access denied");
  }

  // If bed is being changed
  if (data.bedId && data.bedId !== admission.bedId) {
    // Check if admission can have its bed changed (REQUESTED or APPROVED)
    if (!['REQUESTED', 'APPROVED'].includes(admission.status)) {
      throw new Error("Cannot change bed after admission – use transfer");
    }

    // Check new bed availability
    const newBed = await prisma.bed.findFirst({
      where: {
        id: data.bedId,
        hospitalId,
        isActive: true,
        isOccupied: false
      }
    });
    if (!newBed) {
      throw new Error("Selected bed is not available");
    }

    // Perform bed update in transaction
    return await prisma.$transaction(async (tx) => {
      // Free old bed if it exists
      if (admission.bedId) {
        await tx.bed.update({
          where: { id: admission.bedId },
          data: { isOccupied: false }
        });
        await tx.ward.update({
          where: { id: admission.bed.wardId },
          data: {
            occupiedBeds: { decrement: 1 },
            availableBeds: { increment: 1 }
          }
        });
      }

      // Occupy new bed
      await tx.bed.update({
        where: { id: data.bedId },
        data: { isOccupied: true }
      });
      await tx.ward.update({
        where: { id: newBed.wardId },
        data: {
          occupiedBeds: { increment: 1 },
          availableBeds: { decrement: 1 }
        }
      });

      // Update other fields
      const updateData = {
        bedId: data.bedId,
        ...(data.expectedDischarge && { expectedDischarge: new Date(data.expectedDischarge) }),
        ...(data.diagnosis && { diagnosis: data.diagnosis }),
        ...(data.notes && { treatmentNotes: data.notes })
      };

      return tx.admission.update({
        where: { id },
        data: updateData,
        include: {
          patient: true,
          doctor: true,
          bed: { include: { ward: true } }
        }
        
      }, { timeout: 10000 });
    });
  } else {
    // No bed change – update other fields
    const updateData = {
      ...(data.expectedDischarge && { expectedDischarge: new Date(data.expectedDischarge) }),
      ...(data.diagnosis && { diagnosis: data.diagnosis }),
      ...(data.notes && { treatmentNotes: data.notes })
    };

    return prisma.admission.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        doctor: true,
        bed: { include: { ward: true } }
      }
    });
  }
}

  /**
   * Get bed occupancy report
   */
  static async getBedOccupancyReport(hospitalId) {
    const wards = await prisma.ward.findMany({
      where: {
        hospitalId,
        isActive: true
      },
      include: {
        beds: {
          where: { isActive: true },
          include: {
            admission: {
              where: {
                status: 'ADMITTED'
              },
              include: {
                patient: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    uhid: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return wards.map(ward => ({
      wardId: ward.id,
      wardName: ward.name,
      wardType: ward.type,
      totalBeds: ward.totalBeds,
      occupiedBeds: ward.occupiedBeds,
      availableBeds: ward.totalBeds - ward.occupiedBeds,
      occupancyRate: calculateOccupancyRate(ward),
      beds: ward.beds.map(bed => ({
        bedId: bed.id,
        bedNumber: bed.bedNumber,
        isOccupied: bed.isOccupied,
        patient: bed.admission ? {
          id: bed.admission.patient.id,
          name: `${bed.admission.patient.firstName} ${bed.admission.patient.lastName}`,
          uhid: bed.admission.patient.uhid,
          admissionId: bed.admission.id,
          admissionDate: bed.admission.admissionDate,
          diagnosis: bed.admission.diagnosis
        } : null
      }))
    }));
  }

  // ==================== ADMISSION MANAGEMENT ====================

  /**
   * Request admission
   */
  static async requestAdmission(data, hospitalId, hospitalCode, userId, role, currentDoctorId) {
    const {
      patientId,
      admittingDoctorId,
      bedId,
      expectedDischarge,
      diagnosis,
      notes
    } = data;
    
    // Validate dates
    const dateValidation = validateAdmissionDates(new Date(), expectedDischarge);
    if (!dateValidation.valid) {
      throw new Error(dateValidation.error);
    }
    
    // Check if bed is available
    if (bedId) {
      const bed = await prisma.bed.findFirst({
        where: {
          id: bedId,
          hospitalId,
          isActive: true,
          isOccupied: false
        }
      });
      
      if (!bed) {
        throw new Error("Selected bed is not available");
      }
    }
    
    // Permission: if user is a doctor, they can only request for themselves
    if (role === 'DOCTOR' && admittingDoctorId !== currentDoctorId) {
      throw new Error("You can only request admission for yourself as the admitting doctor");
    }
    
    // Generate admission number
    const admissionNumber = generateAdmissionNumber(hospitalCode);
    
    return prisma.admission.create({
      data: {
        admissionNumber,
        patientId,
        admittingDoctorId,
        bedId,
        expectedDischarge: expectedDischarge ? new Date(expectedDischarge) : null,
        diagnosis,
        treatmentNotes: notes,
        status: 'REQUESTED',
        admissionDate: new Date(),
        hospitalId,
        admittedBy: userId
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            uhid: true,
            dob: true,
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
        },
        bed: {
          include: {
            ward: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Approve admission
   */
  static async approveAdmission(id, hospitalId, userId, role, currentDoctorId) {
    return prisma.$transaction(async (tx) => {
      const admission = await tx.admission.findFirst({
        where: {
          id,
          hospitalId,
          status: 'REQUESTED'
        },
        include: {
          bed: true
        }
      });
      
      if (!admission) {
        throw new Error("Admission request not found");
      }
      
      // Permission: doctors can only approve their own admissions
      if (role === 'DOCTOR' && admission.admittingDoctorId !== currentDoctorId) {
        throw new Error("You are not allowed to approve this admission");
      }
      
      if (admission.bed) {
        // Update bed occupancy
        await tx.bed.update({
          where: { id: admission.bedId },
          data: { isOccupied: true }
        });
        
        // Update ward occupancy
        await tx.ward.update({
          where: { id: admission.bed.wardId },
          data: {
            occupiedBeds: {
              increment: 1
            },
            availableBeds: {
              decrement: 1
            }
          }
        });
      }
      
      // Update admission status
      return tx.admission.update({
        where: { id },
        data: {
          status: 'APPROVED'
        }
      });
    });
  }

  /**
   * Admit patient
   */
  static async admitPatient(id, hospitalId, userId, role, currentDoctorId) {
    return prisma.$transaction(async (tx) => {
      const admission = await tx.admission.findFirst({
        where: {
          id,
          hospitalId,
          status: 'APPROVED'
        },
        include: {
          bed: true
        }
      });
      
      if (!admission) {
        throw new Error("Approved admission not found");
      }
      
      // Permission: doctors can only admit their own patients
      if (role === 'DOCTOR' && admission.admittingDoctorId !== currentDoctorId) {
        throw new Error("You are not allowed to admit this patient");
      }
      
      return tx.admission.update({
        where: { id },
        data: {
          status: 'ADMITTED'
        }
      });
    });
  }

  /**
   * Transfer patient to another bed
   */
  static async transferPatient(id, hospitalId, newBedId, reason, userId, role, currentDoctorId) {
    return prisma.$transaction(async (tx) => {
      const admission = await tx.admission.findFirst({
        where: {
          id,
          hospitalId,
          status: 'ADMITTED'
        },
        include: {
          bed: {
            include: {
              ward: true
            }
          }
        }
      });
      
      if (!admission) {
        throw new Error("Active admission not found");
      }
      
      // Permission: doctors can only transfer their own patients
      if (role === 'DOCTOR' && admission.admittingDoctorId !== currentDoctorId) {
        throw new Error("You are not allowed to transfer this patient");
      }
      
      // Check if new bed is available
      const newBed = await tx.bed.findFirst({
        where: {
          id: newBedId,
          hospitalId,
          isActive: true,
          isOccupied: false
        },
        include: {
          ward: true
        }
      });
      
      if (!newBed) {
        throw new Error("New bed is not available");
      }
      
      // Update old bed
      await tx.bed.update({
        where: { id: admission.bedId },
        data: { isOccupied: false }
      });
      
      // Update old ward
      await tx.ward.update({
        where: { id: admission.bed.wardId },
        data: {
          occupiedBeds: {
            decrement: 1
          },
          availableBeds: {
            increment: 1
          }
        }
      });
      
      // Update new bed
      await tx.bed.update({
        where: { id: newBedId },
        data: { isOccupied: true }
      });
      
      // Update new ward
      await tx.ward.update({
        where: { id: newBed.wardId },
        data: {
          occupiedBeds: {
            increment: 1
          },
          availableBeds: {
            decrement: 1
          }
        }
      });
      
      // Update admission
      return tx.admission.update({
        where: { id },
        data: {
          bedId: newBedId,
          status: 'TRANSFERRED',
          treatmentNotes: admission.treatmentNotes 
            ? `${admission.treatmentNotes}\nTransferred: ${reason}`
            : `Transferred: ${reason}`
        }
      });
    });
  }

  /**
   * Discharge patient
   */
  static async dischargePatient(id, hospitalId, data, userId, role, currentDoctorId) {
    const {
      dischargeNotes,
      dischargeInstructions,
      diagnosis
    } = data;
    
    return prisma.$transaction(async (tx) => {
      const admission = await tx.admission.findFirst({
        where: {
          id,
          hospitalId,
          status: 'ADMITTED'
        },
        include: {
          bed: {
            include: {
              ward: true
            }
          }
        }
      });
      
      if (!admission) {
        throw new Error("Active admission not found");
      }
      
      // Permission: doctors can only discharge their own patients
      if (role === 'DOCTOR' && admission.admittingDoctorId !== currentDoctorId) {
        throw new Error("You are not allowed to discharge this patient");
      }
      
      // Free up bed
      if (admission.bed) {
        await tx.bed.update({
          where: { id: admission.bedId },
          data: { isOccupied: false }
        });
        
        await tx.ward.update({
          where: { id: admission.bed.wardId },
          data: {
            occupiedBeds: {
              decrement: 1
            },
            availableBeds: {
              increment: 1
            }
          }
        });
      }
      
      // Create bill for stay
      if (admission.bed) {
        const lengthOfStay = calculateLengthOfStay(admission.admissionDate);
        const dailyRate = admission.bed.dailyRate || 0;
        const stayCost = lengthOfStay * dailyRate;
        
        if (stayCost > 0) {
          await tx.bill.create({
            data: {
              patientId: admission.patientId,
              admissionId: admission.id,
              billNumber: `BILL-${Date.now()}`,
              status: 'ISSUED',
              subtotal: stayCost,
              tax: 0,
              discount: 0,
              total: stayCost,
              paid: 0,
              balance: stayCost,
              issuedAt: new Date(),
              hospitalId,
              items: {
                create: [
                  {
                    description: `Ward stay - ${admission.bed.ward.name} (${lengthOfStay} days)`,
                    quantity: lengthOfStay,
                    unitPrice: dailyRate,
                    amount: stayCost,
                    type: 'BED'
                  }
                ]
              }
            }
          });
        }
      }
      
      // Update admission
      return tx.admission.update({
        where: { id },
        data: {
          status: 'DISCHARGED',
          dischargeDate: new Date(),
          dischargeNotes,
          dischargeInstructions,
          diagnosis: diagnosis || admission.diagnosis
        },
        include: {
          patient: true,
          doctor: true,
          bed: {
            include: {
              ward: true
            }
          }
        }
      });
    });
  }

  /**
   * Cancel admission
   */
  static async cancelAdmission(id, hospitalId, reason, userId, role, currentDoctorId) {
    const admission = await prisma.admission.findFirst({
      where: {
        id,
        hospitalId,
        status: { in: ['REQUESTED', 'APPROVED'] }
      }
    });
    
    if (!admission) {
      throw new Error("Admission request not found");
    }
    
    // Permission: doctors can only cancel their own admissions
    if (role === 'DOCTOR' && admission.admittingDoctorId !== currentDoctorId) {
      throw new Error("You are not allowed to cancel this admission");
    }
    
    return prisma.admission.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        dischargeNotes: reason
      }
    });
  }

  /**
   * Get admission by ID (with role-based filtering)
   */
  static async getAdmissionById(id, hospitalId, role, currentDoctorId) {
    const admission = await prisma.admission.findFirst({
      where: {
        id,
        hospitalId
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            uhid: true,
            dob: true,
            phone: true,
            address: true,
            emergencyContactName: true,
            emergencyContactPhone: true,
            allergies: true,
            chronicConditions: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
            licenseNo: true
          }
        },
        bed: {
          include: {
            ward: {
              select: {
                id: true,
                name: true,
                type: true,
                location: true,
                phone: true
              }
            }
          }
        },
        bills: {
          include: {
            items: true,
            payments: true
          }
        }
      }
    });
    
    if (!admission) return null;
    
    // Apply access control
    if (!this.canAccessAdmission(admission, role, currentDoctorId)) {
      return null; // or throw 403 – handled by controller as 404
    }
    
    return admission;
  }

  /**
   * List admissions (with role-based filtering)
   */
  static async listAdmissions({
    hospitalId,
    role,
    currentDoctorId,
    patientId = null,
    doctorId = null,
    wardId = null,
    status = null,
    fromDate = null,
    toDate = null,
    search = '',
    page = 1,
    limit = 20,
    sortBy = 'admissionDate',
    sortOrder = 'desc'
  }) {
    const skip = (page - 1) * limit;
    
    const where = {
      hospitalId
    };
    
    // Role-based base filter
    if (role === 'DOCTOR') {
      // Doctors see only their own admissions
      where.admittingDoctorId = currentDoctorId;
    }
    // For other roles, no additional filter (they see all within hospital)
    
    if (patientId) where.patientId = patientId;
    if (doctorId) where.admittingDoctorId = doctorId; // overrides doctor filter if set
    if (status) where.status = status;
    
    if (wardId) {
      where.bed = {
        wardId
      };
    }
    
    if (fromDate || toDate) {
      where.admissionDate = {};
      if (fromDate) where.admissionDate.gte = new Date(fromDate);
      if (toDate) where.admissionDate.lte = new Date(toDate);
    }
    
    if (search) {
      where.OR = [
        { admissionNumber: { contains: search } },
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
        { patient: { uhid: { contains: search } } }
      ];
    }
    
    const total = await prisma.admission.count({ where });
    
    const admissions = await prisma.admission.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
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
        },
        bed: {
          include: {
            ward: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    // Add length of stay
    const admissionsWithLOS = admissions.map(adm => ({
      ...adm,
      lengthOfStay: adm.dischargeDate 
        ? calculateLengthOfStay(adm.admissionDate, adm.dischargeDate)
        : calculateLengthOfStay(adm.admissionDate)
    }));
    
    return {
      admissions: admissionsWithLOS,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get current admissions (with role-based filtering)
   */
  static async getCurrentAdmissions(hospitalId, role, currentDoctorId) {
    const where = {
      hospitalId,
      status: 'ADMITTED'
    };
    
    if (role === 'DOCTOR') {
      where.admittingDoctorId = currentDoctorId;
    }
    
    return prisma.admission.findMany({
      where,
      orderBy: {
        admissionDate: 'asc'
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
        },
        bed: {
          include: {
            ward: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Get admissions statistics (role‑based)
   */

static async getAdmissionsStats(hospitalId, role, currentDoctorId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const where = { hospitalId };
  if (role === 'DOCTOR' && currentDoctorId) {
    where.admittingDoctorId = currentDoctorId;
  }

  const [
    totalAdmissions,
    currentAdmissions,
    admittedToday,
    dischargedToday,
    byStatus,
    dischargedAdmissions,
    currentAdmissionsList
  ] = await Promise.all([
    prisma.admission.count({ where }),
    prisma.admission.count({ where: { ...where, status: 'ADMITTED' } }),
    prisma.admission.count({ where: { ...where, admissionDate: { gte: today } } }),
    prisma.admission.count({ where: { ...where, dischargeDate: { gte: today } } }),
    prisma.admission.groupBy({ by: ['status'], where, _count: true }),
    // Fetch discharged admissions to compute average length of stay
    prisma.admission.findMany({
      where: { ...where, status: 'DISCHARGED', dischargeDate: { not: null } },
      select: { admissionDate: true, dischargeDate: true }
    }),
    prisma.admission.findMany({
      where: { ...where, status: 'ADMITTED' },
      include: {
        bed: {
          include: {
            ward: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })
  ]);

  // Calculate average length of stay in days
  let avgLOS = 0;
  if (dischargedAdmissions.length > 0) {
    const totalDays = dischargedAdmissions.reduce((sum, adm) => {
      const days = (new Date(adm.dischargeDate) - new Date(adm.admissionDate)) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    avgLOS = Math.round((totalDays / dischargedAdmissions.length) * 10) / 10;
  }

  // Group current admissions by ward
  const byWard = {};
  currentAdmissionsList.forEach(adm => {
    const wardId = adm.bed?.ward?.id;
    const wardName = adm.bed?.ward?.name || 'Unknown';
    if (wardId) {
      if (!byWard[wardId]) {
        byWard[wardId] = { wardId, wardName, count: 0 };
      }
      byWard[wardId].count++;
    }
  });

  return {
    totalAdmissions,
    currentAdmissions,
    admittedToday,
    dischargedToday,
    byStatus,
    byWard: Object.values(byWard),
    averageLOS: avgLOS,
    bedOccupancyRate: await this.getBedOccupancyRate(hospitalId)
  };
}

  /**
   * Get bed occupancy rate
   */
  static async getBedOccupancyRate(hospitalId) {
    const wards = await prisma.ward.findMany({
      where: {
        hospitalId,
        isActive: true
      },
      select: {
        totalBeds: true,
        occupiedBeds: true
      }
    });
    
    const totalBeds = wards.reduce((sum, w) => sum + w.totalBeds, 0);
    const occupiedBeds = wards.reduce((sum, w) => sum + w.occupiedBeds, 0);
    
    return {
      totalBeds,
      occupiedBeds,
      availableBeds: totalBeds - occupiedBeds,
      occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
    };
  }

  /**
   * Get patient admission history (with role-based filtering)
   */
  static async getPatientAdmissionHistory(patientId, hospitalId, role, currentDoctorId) {
    const where = {
      patientId,
      hospitalId
    };
    
    // If doctor, only show admissions where they were the admitting doctor
    if (role === 'DOCTOR') {
      where.admittingDoctorId = currentDoctorId;
    }
    
    return prisma.admission.findMany({
      where,
      orderBy: {
        admissionDate: 'desc'
      },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true
          }
        },
        bed: {
          include: {
            ward: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        },
        bills: true
      }
    });
  }

  /**
   * Sync offline data
   */
  static async syncOffline(data, hospitalId, userId, role, currentDoctorId) {
    const results = [];
    
    for (const item of data) {
      try {
        if (item.type === 'admission') {
          const hospital = await prisma.hospital.findUnique({
            where: { id: hospitalId }
          });
          
          const admission = await this.requestAdmission(
            item.data,
            hospitalId,
            hospital.code,
            userId,
            role,
            currentDoctorId
          );
          results.push({ ...admission, syncStatus: 'SYNCED' });
        }
      } catch (error) {
        results.push({
          offlineId: item.offlineId,
          error: error.message,
          syncStatus: 'FAILED'
        });
      }
    }
    
    return results;
  }
}