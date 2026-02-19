// backend/src/routes/modules/vitals/vitals.service.js

import { prisma } from "../../../lib/prisma.js";
import { Prisma } from "@prisma/client"; // for Prisma.join
import {
  calculateBMI,
  calculateMAP,
  calculateNEWS,
  getNEWSRiskCategory,
  getTriagePriority,
  isCritical,
  validateVitals,
  getBMICategory,
  getBPCategory
} from "./vitals.utils.js";

export class VitalsService {

  // ==================== HELPER: GET PATIENT IDS FOR DOCTOR ====================

  /**
   * Get all patient IDs that a doctor has access to (appointments or admissions)
   */
  static async getPatientIdsForDoctor(doctorId, hospitalId) {
    const appointments = await prisma.appointment.findMany({
      where: { doctorId, hospitalId },
      select: { patientId: true },
      distinct: ['patientId']
    });
    const admissions = await prisma.admission.findMany({
      where: { admittingDoctorId: doctorId, hospitalId },
      select: { patientId: true },
      distinct: ['patientId']
    });
    const ids = [
      ...appointments.map(a => a.patientId),
      ...admissions.map(a => a.patientId)
    ];
    return [...new Set(ids)];
  }

  // ==================== VITALS RECORDING ====================

  /**
   * Record vital signs
   */
  static async recordVitals(data, hospitalId, userId) {
    const {
      patientId,
      appointmentId,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      heartRate,
      temperature,
      respiratoryRate,
      oxygenSaturation,
      weight,
      height,
      painScore,
      notes,
      recordedAt,
      offlineId
    } = data;

    // Calculate BMI if weight and height provided
    let bmi = null;
    if (weight && height) {
      bmi = calculateBMI(weight, height);
    }

    // Calculate NEWS score
    const vitalsForScore = {
      bloodPressureSystolic,
      heartRate,
      temperature,
      respiratoryRate,
      oxygenSaturation
    };
    const newsScore = calculateNEWS(vitalsForScore);
    const newsRisk = getNEWSRiskCategory(newsScore);

    // Validate vitals
    const validation = validateVitals(data);
    if (!validation.isValid) {
      throw new Error(`Invalid vitals: ${validation.errors.join(', ')}`);
    }

    // Create vital record
    const vital = await prisma.vitalRecord.create({
      data: {
        patientId,
        appointmentId,
        bloodPressureSystolic: bloodPressureSystolic ? parseInt(bloodPressureSystolic) : null,
        bloodPressureDiastolic: bloodPressureDiastolic ? parseInt(bloodPressureDiastolic) : null,
        heartRate: heartRate ? parseInt(heartRate) : null,
        temperature: temperature ? parseFloat(temperature) : null,
        respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : null,
        oxygenSaturation: oxygenSaturation ? parseInt(oxygenSaturation) : null,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        bmi,
        painScore: painScore ? parseInt(painScore) : null,
        notes,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
        recordedBy: userId,
        recordedByNurseId: null,
        hospitalId,
        offlineId: offlineId || null,
        syncStatus: 'SYNCED'
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            uhid: true,
            dob: true,
            gender: true
          }
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
            status: true
          }
        }
      }
    });

    // Add computed fields
    const vitalWithComputed = {
      ...vital,
      bmiCategory: bmi ? getBMICategory(bmi) : null,
      bpCategory: bloodPressureSystolic && bloodPressureDiastolic ?
        getBPCategory(bloodPressureSystolic, bloodPressureDiastolic) : null,
      map: bloodPressureSystolic && bloodPressureDiastolic ?
        calculateMAP(bloodPressureSystolic, bloodPressureDiastolic) : null,
      newsScore,
      newsRisk,
      isCritical: isCritical(vital),
      triagePriority: getTriagePriority(vital)
    };

    return vitalWithComputed;
  }

  /**
   * Get vital record by ID
   */
  static async getVitalById(id, hospitalId) {
    const vital = await prisma.vitalRecord.findFirst({
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
            gender: true
          }
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
            status: true,
            doctor: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        nurse: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!vital) return null;

    // Add computed fields
    const bmi = vital.bmi || (vital.weight && vital.height ?
      calculateBMI(vital.weight, vital.height) : null);

    const newsScore = calculateNEWS(vital);

    return {
      ...vital,
      bmiCategory: bmi ? getBMICategory(bmi) : null,
      bpCategory: vital.bloodPressureSystolic && vital.bloodPressureDiastolic ?
        getBPCategory(vital.bloodPressureSystolic, vital.bloodPressureDiastolic) : null,
      map: vital.bloodPressureSystolic && vital.bloodPressureDiastolic ?
        calculateMAP(vital.bloodPressureSystolic, vital.bloodPressureDiastolic) : null,
      newsScore,
      newsRisk: getNEWSRiskCategory(newsScore),
      isCritical: isCritical(vital),
      triagePriority: getTriagePriority(vital)
    };
  }

  /**
   * Get patient vitals history
   */
  static async getPatientVitals(patientId, hospitalId, limit = 20) {
    const vitals = await prisma.vitalRecord.findMany({
      where: {
        patientId,
        hospitalId
      },
      orderBy: {
        recordedAt: 'desc'
      },
      take: limit,
      include: {
        appointment: {
          select: {
            id: true,
            startTime: true,
            status: true
          }
        },
        nurse: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Add computed fields to each
    return vitals.map(vital => {
      const bmi = vital.bmi || (vital.weight && vital.height ?
        calculateBMI(vital.weight, vital.height) : null);

      const newsScore = calculateNEWS(vital);

      return {
        ...vital,
        bmiCategory: bmi ? getBMICategory(bmi) : null,
        bpCategory: vital.bloodPressureSystolic && vital.bloodPressureDiastolic ?
          getBPCategory(vital.bloodPressureSystolic, vital.bloodPressureDiastolic) : null,
        map: vital.bloodPressureSystolic && vital.bloodPressureDiastolic ?
          calculateMAP(vital.bloodPressureSystolic, vital.bloodPressureDiastolic) : null,
        newsScore,
        newsRisk: getNEWSRiskCategory(newsScore),
        isCritical: isCritical(vital)
      };
    });
  }

  /**
   * Get appointment vitals
   */
  static async getAppointmentVitals(appointmentId, hospitalId) {
    return prisma.vitalRecord.findMany({
      where: {
        appointmentId,
        hospitalId
      },
      orderBy: {
        recordedAt: 'desc'
      },
      include: {
        nurse: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  /**
   * Get latest vitals for patient
   */
  static async getLatestVitals(patientId, hospitalId) {
    const vital = await prisma.vitalRecord.findFirst({
      where: {
        patientId,
        hospitalId
      },
      orderBy: {
        recordedAt: 'desc'
      },
      include: {
        appointment: {
          select: {
            id: true,
            startTime: true
          }
        }
      }
    });

    if (!vital) return null;

    const newsScore = calculateNEWS(vital);

    return {
      ...vital,
      newsScore,
      newsRisk: getNEWSRiskCategory(newsScore),
      isCritical: isCritical(vital)
    };
  }

  // ==================== STATISTICS (ROLE‑AWARE) ====================

  /**
   * Get vitals statistics (filtered by role)
   */
static async getVitalsStats(hospitalId, role, currentDoctorId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const where = {
    hospitalId,
    recordedAt: { gte: startDate }
  };

  let patientIds = [];
  if (role === 'DOCTOR' && currentDoctorId) {
    patientIds = await this.getPatientIdsForDoctor(currentDoctorId, hospitalId);
    if (patientIds.length === 0) {
      return {
        period: `${days} days`,
        totalRecords: 0,
        uniquePatients: 0,
        criticalReadings: 0,
        averageByDay: []
      };
    }
    where.patientId = { in: patientIds };
  }

  const [
    totalRecords,
    patientsWithVitals,
    criticalReadings,
    averageByDay
  ] = await Promise.all([
    prisma.vitalRecord.count({ where }),

    prisma.vitalRecord.groupBy({
      by: ['patientId'],
      where
    }),

    prisma.vitalRecord.count({
      where: {
        ...where,
        OR: [
          { bloodPressureSystolic: { lt: 70 } },
          { bloodPressureSystolic: { gt: 200 } },
          { heartRate: { lt: 40 } },
          { heartRate: { gt: 140 } },
          { temperature: { lt: 32 } },
          { temperature: { gt: 41 } },
          { respiratoryRate: { lt: 8 } },
          { respiratoryRate: { gt: 30 } },
          { oxygenSaturation: { lt: 85 } }
        ]
      }
    }),

    // Raw SQL with quoted identifiers
    role === 'DOCTOR' && currentDoctorId && patientIds.length > 0
      ? prisma.$queryRaw`
          SELECT 
            DATE("recordedAt") as date,
            AVG("bloodPressureSystolic") as avg_systolic,
            AVG("bloodPressureDiastolic") as avg_diastolic,
            AVG("heartRate") as avg_heart_rate,
            AVG("temperature") as avg_temperature,
            AVG("oxygenSaturation") as avg_oxygen,
            COUNT(*) as count
          FROM "VitalRecord"
          WHERE "hospitalId" = ${hospitalId}
            AND "recordedAt" >= ${startDate}
            AND "patientId" IN (${Prisma.join(patientIds)})
          GROUP BY DATE("recordedAt")
          ORDER BY date DESC
        `
      : prisma.$queryRaw`
          SELECT 
            DATE("recordedAt") as date,
            AVG("bloodPressureSystolic") as avg_systolic,
            AVG("bloodPressureDiastolic") as avg_diastolic,
            AVG("heartRate") as avg_heart_rate,
            AVG("temperature") as avg_temperature,
            AVG("oxygenSaturation") as avg_oxygen,
            COUNT(*) as count
          FROM "VitalRecord"
          WHERE "hospitalId" = ${hospitalId}
            AND "recordedAt" >= ${startDate}
          GROUP BY DATE("recordedAt")
          ORDER BY date DESC
        `
  ]);

  return {
    period: `${days} days`,
    totalRecords,
    uniquePatients: patientsWithVitals.length,
    criticalReadings,
    averageByDay
  };
}

  /**
   * Get patient vitals trends
   */
  static async getPatientTrends(patientId, hospitalId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const vitals = await prisma.vitalRecord.findMany({
      where: {
        patientId,
        hospitalId,
        recordedAt: {
          gte: startDate
        }
      },
      orderBy: {
        recordedAt: 'asc'
      }
    });

    // Calculate trends
    const trends = {
      bloodPressure: [],
      heartRate: [],
      temperature: [],
      weight: [],
      bmi: [],
      oxygenSaturation: []
    };

    vitals.forEach(v => {
      const date = v.recordedAt.toISOString().split('T')[0];

      if (v.bloodPressureSystolic && v.bloodPressureDiastolic) {
        trends.bloodPressure.push({
          date,
          systolic: v.bloodPressureSystolic,
          diastolic: v.bloodPressureDiastolic
        });
      }

      if (v.heartRate) {
        trends.heartRate.push({ date, value: v.heartRate });
      }

      if (v.temperature) {
        trends.temperature.push({ date, value: v.temperature });
      }

      if (v.weight) {
        trends.weight.push({ date, value: v.weight });
      }

      if (v.bmi) {
        trends.bmi.push({ date, value: v.bmi });
      }

      if (v.oxygenSaturation) {
        trends.oxygenSaturation.push({ date, value: v.oxygenSaturation });
      }
    });

    return trends;
  }

  /**
   * Update vital record
   */
  static async updateVital(id, hospitalId, data, userId) {
    const {
      bloodPressureSystolic,
      bloodPressureDiastolic,
      heartRate,
      temperature,
      respiratoryRate,
      oxygenSaturation,
      weight,
      height,
      painScore,
      notes
    } = data;

    // Recalculate BMI if weight/height changed
    let bmi = undefined;
    if (weight && height) {
      bmi = calculateBMI(weight, height);
    }

    return prisma.vitalRecord.update({
      where: {
        id,
        hospitalId
      },
      data: {
        bloodPressureSystolic: bloodPressureSystolic ? parseInt(bloodPressureSystolic) : undefined,
        bloodPressureDiastolic: bloodPressureDiastolic ? parseInt(bloodPressureDiastolic) : undefined,
        heartRate: heartRate ? parseInt(heartRate) : undefined,
        temperature: temperature ? parseFloat(temperature) : undefined,
        respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : undefined,
        oxygenSaturation: oxygenSaturation ? parseInt(oxygenSaturation) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
        bmi,
        painScore: painScore ? parseInt(painScore) : undefined,
        notes
      }
    });
  }

  /**
   * Delete vital record
   */
  static async deleteVital(id, hospitalId) {
    return prisma.vitalRecord.delete({
      where: {
        id,
        hospitalId
      }
    });
  }

  /**
   * Sync offline vitals
   */
  static async syncOffline(vitals, hospitalId, userId) {
    const results = [];

    for (const vital of vitals) {
      try {
        if (vital.offlineId) {
          const existing = await prisma.vitalRecord.findFirst({
            where: {
              hospitalId,
              offlineId: vital.offlineId
            }
          });

          if (existing) {
            const updated = await this.updateVital(
              existing.id,
              hospitalId,
              vital,
              userId
            );
            results.push({ ...updated, syncStatus: 'SYNCED' });
            continue;
          }
        }

        const created = await this.recordVitals(
          vital,
          hospitalId,
          userId
        );
        results.push({ ...created, syncStatus: 'SYNCED' });

      } catch (error) {
        results.push({
          offlineId: vital.offlineId,
          error: error.message,
          syncStatus: 'FAILED'
        });
      }
    }

    return results;
  }
}