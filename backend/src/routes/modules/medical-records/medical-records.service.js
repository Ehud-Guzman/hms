// backend/src/routes/modules/medical-records/medical-records.service.js

import { prisma } from "../../../lib/prisma.js";
import {
  generateRecordNumber,
  validateMedicalRecord,
  parseAttachments,
  getICD10Category,
  formatICD10Code
} from "./medical-records.utils.js";

export class MedicalRecordsService {

  // ==================== HELPER: CHECK RECORD ACCESS ====================

  /**
   * Check if the current user can access a given medical record.
   * @param {Object} record - The record object (must include patientId, doctorId, isConfidential)
   * @param {string} role - User role
   * @param {string} currentDoctorId - Current doctor ID (if user is a doctor)
   * @param {string} currentPatientId - Current patient ID (if user is a patient)
   * @returns {boolean}
   */
  static canAccessRecord(record, role, currentDoctorId, currentPatientId) {
    // Admins can access all records
    if (['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(role)) {
      return true;
    }
    // Doctors can access records of patients they have treated (if they are the record's doctor)
    if (role === 'DOCTOR') {
      return record.doctorId === currentDoctorId;
    }
    // Nurses might have limited access – for now, allow if not confidential
    if (role === 'NURSE') {
      return !record.isConfidential;
    }
    // Patients can only access their own non-confidential records
    if (role === 'PATIENT') {
      return record.patientId === currentPatientId && !record.isConfidential;
    }
    // Other roles (RECEPTIONIST, etc.) – deny by default
    return false;
  }

  // ==================== RECORD CREATION ====================

  /**
   * Create medical record
   */
  static async createRecord(data, hospitalId, userId, role, currentDoctorId, files = []) {
    const {
      patientId,
      doctorId: requestDoctorId,
      recordType,
      title,
      description,
      icd10Code,
      icd10Description,
      isConfidential = false
    } = data;

    // Validate record
    const validation = validateMedicalRecord(data);
    if (!validation.isValid) {
      throw new Error(`Invalid record: ${validation.errors.join(', ')}`);
    }

    // Parse attachments
    const attachments = files.length > 0 ? parseAttachments(files) : null;

    // Get ICD-10 category if code provided
    let icd10Category = null;
    if (icd10Code) {
      icd10Category = getICD10Category(icd10Code);
    }

    // Generate record number
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId }
    });

    const recordNumber = generateRecordNumber(hospital?.code || 'HOSP');

    return prisma.medicalRecord.create({
      data: {
        patientId,
        doctorId: requestDoctorId,
        recordType,
        title,
        description,
        icd10Code: formatICD10Code(icd10Code),
        icd10Description,
        isConfidential,
        attachments,
        recordedAt: new Date(),
        recordedBy: userId,
        hospitalId
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            uhid: true,
            dob: true
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

  // ==================== RECORD RETRIEVAL ====================

  /**
   * Get record by ID (with RBAC)
   */
  static async getRecordById(id, hospitalId, role, currentDoctorId, currentPatientId) {
    const record = await prisma.medicalRecord.findFirst({
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
            email: true,
            gender: true
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
        }
      }
    });

    if (!record) return null;

    // Apply access control
    if (!this.canAccessRecord(record, role, currentDoctorId, currentPatientId)) {
      throw new Error("Access denied");
    }

    return record;
  }

  /**
   * Get patient records (with RBAC)
   */
  static async getPatientRecords({
    patientId,
    hospitalId,
    role,
    currentDoctorId,
    currentPatientId,
    recordType = null,
    fromDate = null,
    toDate = null,
    search = '',
    page = 1,
    limit = 20,
    sortBy = 'recordedAt',
    sortOrder = 'desc'
  }) {
    const skip = (page - 1) * limit;

    const where = {
      patientId,
      hospitalId
    };

    // Apply role-based filters
    if (role === 'DOCTOR') {
      // Doctors see only records they authored
      where.doctorId = currentDoctorId;
    } else if (role === 'PATIENT') {
      // Patients see only their own non-confidential records
      if (currentPatientId !== patientId) {
        return { records: [], pagination: { page, limit, total: 0, pages: 0 } };
      }
      where.isConfidential = false;
    } else if (role === 'NURSE') {
      // Nurses see non-confidential records of any patient in hospital
      where.isConfidential = false;
    }
    // Admins see all

    if (recordType) {
      where.recordType = recordType;
    }

    if (fromDate || toDate) {
      where.recordedAt = {};
      if (fromDate) where.recordedAt.gte = new Date(fromDate);
      if (toDate) where.recordedAt.lte = new Date(toDate);
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { icd10Code: { contains: search, mode: 'insensitive' } },
        { icd10Description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const total = await prisma.medicalRecord.count({ where });

    const records = await prisma.medicalRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
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

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get patient summary (with RBAC)
   */
  static async getPatientSummary(patientId, hospitalId, role, currentDoctorId) {
    // First check access: doctors can only see summary if they have treated this patient
    if (role === 'DOCTOR') {
      const hasAccess = await prisma.medicalRecord.findFirst({
        where: {
          patientId,
          hospitalId,
          doctorId: currentDoctorId
        }
      });
      if (!hasAccess) {
        throw new Error("Access denied");
      }
    }
    // For other roles (nurses, patients, admins) – handled by caller

    const records = await prisma.medicalRecord.findMany({
      where: {
        patientId,
        hospitalId,
        ...(role === 'PATIENT' ? { isConfidential: false } : {})
      },
      include: {
        doctor: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        recordedAt: 'desc'
      }
    });

    const summary = {
      diagnoses: [],
      procedures: [],
      allergies: [],
      medications: [],
      immunizations: [],
      labResults: [],
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
            doctor: record.doctor ?
              `${record.doctor.firstName} ${record.doctor.lastName}` : 'Unknown',
            icd10: record.icd10Code
          });
          break;

        case 'PROCEDURE':
          summary.procedures.push({
            date: record.recordedAt,
            procedure: record.title,
            doctor: record.doctor ?
              `${record.doctor.firstName} ${record.doctor.lastName}` : 'Unknown'
          });
          break;

        case 'ALLERGY':
          summary.allergies.push({
            date: record.recordedAt,
            allergy: record.title,
            reaction: record.description
          });
          break;

        case 'PRESCRIPTION':
          summary.medications.push({
            date: record.recordedAt,
            medication: record.title,
            instructions: record.description,
            doctor: record.doctor ?
              `${record.doctor.firstName} ${record.doctor.lastName}` : 'Unknown'
          });
          break;

        case 'VACCINATION':
          summary.immunizations.push({
            date: record.recordedAt,
            vaccine: record.title,
            doctor: record.doctor ?
              `${record.doctor.firstName} ${record.doctor.lastName}` : 'Unknown'
          });
          break;

        case 'LAB_RESULT':
          summary.labResults.push({
            date: record.recordedAt,
            test: record.title,
            result: record.description
          });
          break;
      }

      summary.visits++;
      if (!summary.lastVisit || record.recordedAt > summary.lastVisit) {
        summary.lastVisit = record.recordedAt;
      }
    });

    // Get patient info
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        firstName: true,
        lastName: true,
        uhid: true,
        dob: true,
        gender: true,
        bloodGroup: true,
        allergies: true,
        chronicConditions: true
      }
    });

    return {
      patient,
      summary
    };
  }

  /**
   * Get patient timeline (with RBAC)
   */
  static async getPatientTimeline(patientId, hospitalId, role, currentDoctorId) {
    const where = {
      patientId,
      hospitalId
    };

    if (role === 'DOCTOR') {
      where.doctorId = currentDoctorId;
    } else if (role === 'PATIENT') {
      where.isConfidential = false;
    } else if (role === 'NURSE') {
      where.isConfidential = false;
    }
    // Admins see all

    const records = await prisma.medicalRecord.findMany({
      where,
      include: {
        doctor: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        recordedAt: 'desc'
      }
    });

    return records.map(record => ({
      id: record.id,
      date: record.recordedAt,
      type: record.recordType,
      title: record.title,
      description: record.description,
      doctor: record.doctor ?
        `${record.doctor.firstName} ${record.doctor.lastName}` : 'Unknown',
      hasAttachments: !!(record.attachments && record.attachments.length > 0),
      isConfidential: record.isConfidential
    }));
  }

  // ==================== RECORD UPDATES ====================

  /**
   * Update record (only creator or admin)
   */
  static async updateRecord(id, hospitalId, data, userId, role, currentDoctorId, files = []) {
    const record = await prisma.medicalRecord.findFirst({
      where: {
        id,
        hospitalId
      }
    });

    if (!record) {
      throw new Error("Record not found");
    }

    // Permission: only the creator (recordedBy) or admin can update
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(role) && record.recordedBy !== userId) {
      throw new Error("Access denied: You can only update records you created");
    }

    // Parse new attachments
    let attachments = record.attachments;
    if (files.length > 0) {
      const newAttachments = parseAttachments(files);
      attachments = record.attachments
        ? [...record.attachments, ...newAttachments]
        : newAttachments;
    }

    // Update ICD-10 category if code changed
    let icd10Category = record.icd10Category;
    if (data.icd10Code && data.icd10Code !== record.icd10Code) {
      icd10Category = getICD10Category(data.icd10Code);
    }

    return prisma.medicalRecord.update({
      where: { id },
      data: {
        recordType: data.recordType,
        title: data.title,
        description: data.description,
        icd10Code: data.icd10Code ? formatICD10Code(data.icd10Code) : undefined,
        icd10Description: data.icd10Description,
        icd10Category,
        isConfidential: data.isConfidential,
        attachments
      },
      include: {
        patient: true,
        doctor: true
      }
    });
  }

  /**
   * Delete record (admin only)
   */
  static async deleteRecord(id, hospitalId, role, userId) {
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(role)) {
      throw new Error("Access denied: Only admins can delete records");
    }

    return prisma.medicalRecord.delete({
      where: {
        id,
        hospitalId
      }
    });
  }

  // ==================== ATTACHMENT MANAGEMENT ====================

  /**
   * Add attachment to record (with RBAC)
   */
  static async addAttachment(id, hospitalId, file, role, currentDoctorId, userId) {
    const record = await prisma.medicalRecord.findFirst({
      where: {
        id,
        hospitalId
      }
    });

    if (!record) {
      throw new Error("Record not found");
    }

    // Permission: only creator or admin can add attachments
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(role) && record.recordedBy !== userId) {
      throw new Error("Access denied");
    }

    const attachment = {
      filename: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date()
    };

    const attachments = record.attachments
      ? [...record.attachments, attachment]
      : [attachment];

    return prisma.medicalRecord.update({
      where: { id },
      data: { attachments }
    });
  }

  /**
   * Remove attachment from record (with RBAC)
   */
  static async removeAttachment(id, hospitalId, filename, role, currentDoctorId, userId) {
    const record = await prisma.medicalRecord.findFirst({
      where: {
        id,
        hospitalId
      }
    });

    if (!record || !record.attachments) {
      throw new Error("Record or attachment not found");
    }

    // Permission: only creator or admin can remove attachments
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(role) && record.recordedBy !== userId) {
      throw new Error("Access denied");
    }

    const attachments = record.attachments.filter(a => a.filename !== filename);

    return prisma.medicalRecord.update({
      where: { id },
      data: { attachments }
    });
  }

  // ==================== STATISTICS ====================

  /**
   * Get record statistics (admin only)
   */
  static async getRecordStats(hospitalId, role, patientId = null) {
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(role)) {
      throw new Error("Access denied");
    }

    const where = {
      hospitalId
    };

    if (patientId) {
      where.patientId = patientId;
    }

    const [
      totalRecords,
      byType,
      byDoctor,
      recentRecords
    ] = await Promise.all([
      // Total records
      prisma.medicalRecord.count({ where }),

      // By record type
      prisma.medicalRecord.groupBy({
        by: ['recordType'],
        where,
        _count: true
      }),

      // By doctor
      prisma.medicalRecord.groupBy({
        by: ['doctorId'],
        where: {
          ...where,
          doctorId: { not: null }
        },
        _count: true
      }),

      // Recent records
      prisma.medicalRecord.findMany({
        where,
        orderBy: {
          recordedAt: 'desc'
        },
        take: 10,
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              uhid: true
            }
          },
          doctor: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      })
    ]);

    return {
      totalRecords,
      byType,
      byDoctor,
      recentRecords
    };
  }

  // ==================== ICD-10 SEARCH ====================

  /**
   * Search ICD-10 codes (simplified - in production use external API)
   */
  static async searchICD10(query) {
    // This is a mock - in production, integrate with WHO ICD-11 API
    const mockICD10 = [
      { code: 'A09', description: 'Infectious gastroenteritis' },
      { code: 'J00', description: 'Acute nasopharyngitis (common cold)' },
      { code: 'J02', description: 'Acute pharyngitis' },
      { code: 'J03', description: 'Acute tonsillitis' },
      { code: 'J06', description: 'Acute upper respiratory infections' },
      { code: 'J15', description: 'Bacterial pneumonia' },
      { code: 'J18', description: 'Pneumonia' },
      { code: 'I10', description: 'Essential hypertension' },
      { code: 'I25', description: 'Chronic ischemic heart disease' },
      { code: 'E11', description: 'Type 2 diabetes mellitus' },
      { code: 'E78', description: 'Disorders of lipoprotein metabolism' },
      { code: 'F32', description: 'Depressive episode' },
      { code: 'F41', description: 'Anxiety disorders' },
      { code: 'M54', description: 'Dorsalgia (back pain)' },
      { code: 'M17', description: 'Osteoarthritis of knee' }
    ];

    return mockICD10.filter(item =>
      item.code.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
    );
  }

  // ==================== SYNC ====================

  /**
   * Sync offline records (with RBAC)
   */
  static async syncOffline(records, hospitalId, userId, role, currentDoctorId) {
    const results = [];

    for (const record of records) {
      try {
        // Check if exists by offlineId
        if (record.offlineId) {
          const existing = await prisma.medicalRecord.findFirst({
            where: {
              hospitalId,
              offlineId: record.offlineId
            }
          });

          if (existing) {
            // For updates, ensure user has permission
            if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(role) && existing.recordedBy !== userId) {
              throw new Error("Access denied");
            }
            const updated = await prisma.medicalRecord.update({
              where: { id: existing.id },
              data: {
                title: record.title,
                description: record.description,
                icd10Code: record.icd10Code,
                icd10Description: record.icd10Description
              }
            });
            results.push({ ...updated, syncStatus: 'SYNCED' });
            continue;
          }
        }

        // Create new – pass currentDoctorId for role enforcement
        const created = await this.createRecord(
          record,
          hospitalId,
          userId,
          role,
          currentDoctorId,
          [] // files handled separately in real sync
        );
        results.push({ ...created, syncStatus: 'SYNCED' });

      } catch (error) {
        results.push({
          offlineId: record.offlineId,
          error: error.message,
          syncStatus: 'FAILED'
        });
      }
    }

    return results;
  }
}