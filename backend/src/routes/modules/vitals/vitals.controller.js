// backend/src/routes/modules/vitals/vitals.controller.js

import { prisma } from "../../../lib/prisma.js";
import { VitalsService } from "./vitals.service.js";
import { 
  validateVitals,
  generateOfflineId,
  isCritical,
  getTriagePriority
} from "./vitals.utils.js";
import { logAudit } from "../../../utils/audit.js";

export class VitalsController {
  
  /**
   * Record vital signs
   */
  static async recordVitals(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      
      if (!hospitalId) {
        return res.status(403).json({ message: "No hospital context" });
      }
      
      const { patientId } = req.body;
      
      if (!patientId) {
        return res.status(400).json({ message: "Patient ID is required" });
      }
      
      // Verify patient exists
      const patient = await prisma.patient.findFirst({
        where: { id: patientId, hospitalId }
      });
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      // Verify appointment if provided
      if (req.body.appointmentId) {
        const appointment = await prisma.appointment.findFirst({
          where: { 
            id: req.body.appointmentId, 
            hospitalId 
          }
        });
        
        if (!appointment) {
          return res.status(404).json({ message: "Appointment not found" });
        }
      }
      
      // Validate vitals
      const validation = validateVitals(req.body);
      if (!validation.isValid) {
        return res.status(400).json({ 
          message: "Invalid vitals", 
          errors: validation.errors 
        });
      }
      
      const vital = await VitalsService.recordVitals(
        req.body,
        hospitalId,
        userId
      );
      
      await logAudit({
        req,
        actorId: userId,
        actorRole: req.role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "VITALS_RECORDED",
        targetType: "VitalRecord",
        targetId: vital.id,
        metadata: {
          patientId,
          isCritical: vital.isCritical,
          triagePriority: vital.triagePriority
        }
      });
      
      // If critical, send alert (in production, trigger notification)
      if (vital.isCritical) {
        console.log("🚨 CRITICAL VITALS ALERT:", {
          patient: `${vital.patient.firstName} ${vital.patient.lastName}`,
          vital
        });
      }
      
      res.status(201).json({
        message: "Vitals recorded successfully",
        vital
      });
      
    } catch (error) {
      console.error("RECORD VITALS ERROR:", error);
      
      if (error.message.includes("Invalid vitals")) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  /**
   * Get vital record by ID
   */
  static async getVital(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      
      const vital = await VitalsService.getVitalById(id, hospitalId);
      
      if (!vital) {
        return res.status(404).json({ message: "Vital record not found" });
      }
      
      res.json({ vital });
      
    } catch (error) {
      console.error("GET VITAL ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get patient vitals history
   */
  static async getPatientVitals(req, res) {
    try {
      const { patientId } = req.params;
      const hospitalId = req.hospitalId;
      const { limit } = req.query;
      
      // Verify patient exists
      const patient = await prisma.patient.findFirst({
        where: { id: patientId, hospitalId }
      });
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      const vitals = await VitalsService.getPatientVitals(
        patientId, 
        hospitalId,
        parseInt(limit) || 20
      );
      
      res.json({
        patient: {
          id: patient.id,
          name: `${patient.firstName} ${patient.lastName}`,
          uhid: patient.uhid
        },
        total: vitals.length,
        vitals
      });
      
    } catch (error) {
      console.error("GET PATIENT VITALS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get appointment vitals
   */
  static async getAppointmentVitals(req, res) {
    try {
      const { appointmentId } = req.params;
      const hospitalId = req.hospitalId;
      
      const vitals = await VitalsService.getAppointmentVitals(appointmentId, hospitalId);
      
      res.json({
        appointmentId,
        total: vitals.length,
        vitals
      });
      
    } catch (error) {
      console.error("GET APPOINTMENT VITALS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get latest vitals for patient
   */
  static async getLatestVitals(req, res) {
    try {
      const { patientId } = req.params;
      const hospitalId = req.hospitalId;
      
      const vital = await VitalsService.getLatestVitals(patientId, hospitalId);
      
      if (!vital) {
        return res.status(404).json({ message: "No vitals found for patient" });
      }
      
      res.json({ vital });
      
    } catch (error) {
      console.error("GET LATEST VITALS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get vitals statistics
   */
static async getVitalsStats(req, res) {
  try {
    const hospitalId = req.hospitalId;
    const role = req.role;
    const doctorId = req.doctorId;
    const { days = 7 } = req.query;

    const stats = await VitalsService.getVitalsStats(hospitalId, role, doctorId, parseInt(days));
    res.json({ stats });
  } catch (error) {
    console.error("VITALS STATS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
}

  /**
   * Get patient vitals trends
   */
  static async getPatientTrends(req, res) {
    try {
      const { patientId } = req.params;
      const hospitalId = req.hospitalId;
      const { days } = req.query;
      
      const trends = await VitalsService.getPatientTrends(
        patientId, 
        hospitalId,
        parseInt(days) || 30
      );
      
      res.json({ trends });
      
    } catch (error) {
      console.error("GET PATIENT TRENDS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Update vital record
   */
  static async updateVital(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      
      const vital = await VitalsService.updateVital(id, hospitalId, req.body, userId);
      
      await logAudit({
        req,
        actorId: userId,
        actorRole: req.role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "VITALS_UPDATED",
        targetType: "VitalRecord",
        targetId: vital.id
      });
      
      res.json({
        message: "Vitals updated successfully",
        vital
      });
      
    } catch (error) {
      console.error("UPDATE VITAL ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Delete vital record
   */
  static async deleteVital(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      
      await VitalsService.deleteVital(id, hospitalId);
      
      await logAudit({
        req,
        actorId: userId,
        actorRole: req.role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "VITALS_DELETED",
        targetType: "VitalRecord",
        targetId: id
      });
      
      res.json({
        message: "Vital record deleted successfully"
      });
      
    } catch (error) {
      console.error("DELETE VITAL ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get triage list (patients waiting with vitals)
   */
  static async getTriageList(req, res) {
    try {
      const hospitalId = req.hospitalId;
      
      // Get today's appointments with latest vitals
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const appointments = await prisma.appointment.findMany({
        where: {
          hospitalId,
          date: {
            gte: today
          },
          status: {
            in: ['SCHEDULED', 'CHECKED_IN', 'WAITING']
          }
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
          vitalRecords: {
            orderBy: {
              recordedAt: 'desc'
            },
            take: 1
          }
        },
        orderBy: [
          { status: 'asc' },
          { startTime: 'asc' }
        ]
      });
      
      // Process each appointment
      const triageList = appointments.map(appt => {
        const latestVitals = appt.vitalRecords[0];
        let triagePriority = 'UNKNOWN';
        let isCriticalFlag = false;
        
        if (latestVitals) {
          const newsScore = latestVitals.newsScore;
          triagePriority = getTriagePriority({ newsScore });
          isCriticalFlag = isCritical(latestVitals);
        }
        
        return {
          appointmentId: appt.id,
          patient: appt.patient,
          status: appt.status,
          startTime: appt.startTime,
          hasVitals: !!latestVitals,
          triagePriority,
          isCritical: isCriticalFlag,
          lastVitals: latestVitals
        };
      });
      
      // Sort by priority
      const priorityOrder = {
        'RESUSCITATION': 1,
        'EMERGENCY': 2,
        'URGENT': 3,
        'SEMI_URGENT': 4,
        'NON_URGENT': 5,
        'UNKNOWN': 6
      };
      
      triageList.sort((a, b) => {
        return (priorityOrder[a.triagePriority] || 99) - (priorityOrder[b.triagePriority] || 99);
      });
      
      res.json({
        total: triageList.length,
        triageList
      });
      
    } catch (error) {
      console.error("GET TRIAGE LIST ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Sync offline vitals
   */
  static async syncOffline(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      
      const vitals = Array.isArray(req.body) ? req.body : [req.body];
      
      const results = await VitalsService.syncOffline(vitals, hospitalId, userId);
      
      res.json({
        message: `${results.length} vitals records synced`,
        results,
        syncStatus: "COMPLETED"
      });
      
    } catch (error) {
      console.error("SYNC VITALS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}