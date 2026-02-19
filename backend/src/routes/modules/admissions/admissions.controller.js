// backend/src/routes/modules/admissions/admissions.controller.js

import { prisma } from "../../../lib/prisma.js";
import { AdmissionsService } from "./admissions.service.js";
import { 
  formatAdmissionDisplay,
  generateOfflineId,
  validateBedCapacity
} from "./admissions.utils.js";
import { logAudit } from "../../../utils/audit.js";

export class AdmissionsController {
  
  // ==================== WARD CONTROLLERS ====================

  /**
   * Create ward
   */
  static async createWard(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      
      if (!hospitalId) {
        return res.status(403).json({ message: "No hospital context" });
      }
      
      // Only admins can create wards (already enforced by route)
      const ward = await AdmissionsService.createWard(req.body, hospitalId);
      
      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "WARD_CREATED",
        targetType: "Ward",
        targetId: ward.id,
        metadata: {
          name: ward.name,
          code: ward.code,
          totalBeds: ward.totalBeds
        }
      });
      
      res.status(201).json({
        message: "Ward created successfully",
        ward
      });
      
    } catch (error) {
      console.error("CREATE WARD ERROR:", error);
      
      if (error.message.includes("already exists")) {
        return res.status(409).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  /**
   * Update ward
   */
  static async updateWard(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      
      const ward = await AdmissionsService.updateWard(id, hospitalId, req.body);
      
      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "WARD_UPDATED",
        targetType: "Ward",
        targetId: ward.id,
        metadata: {
          changes: Object.keys(req.body)
        }
      });
      
      res.json({
        message: "Ward updated successfully",
        ward
      });
      
    } catch (error) {
      console.error("UPDATE WARD ERROR:", error);
      
      if (error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get ward by ID
   */
  static async getWard(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId; // may be used by service if needed
      
      const ward = await AdmissionsService.getWardById(id, hospitalId);
      
      if (!ward) {
        return res.status(404).json({ message: "Ward not found" });
      }
      
      res.json({ ward });
      
    } catch (error) {
      console.error("GET WARD ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * List wards
   */
  static async listWards(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role; // passed to service if needed
      
      const {
        type,
        isActive,
        search,
        page,
        limit
      } = req.query;
      
      const result = await AdmissionsService.listWards({
        hospitalId,
        role,                      // added
        type,
        isActive: isActive !== 'false',
        search,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      });
      
      res.json(result);
      
    } catch (error) {
      console.error("LIST WARDS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get ward types
   */
  static async getWardTypes(req, res) {
    try {
      const hospitalId = req.hospitalId;
      
      const types = await AdmissionsService.getWardTypes(hospitalId);
      
      res.json({ types });
      
    } catch (error) {
      console.error("GET WARD TYPES ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // ==================== BED CONTROLLERS ====================

  /**
   * Create bed
   */
  static async createBed(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      
      const bed = await AdmissionsService.createBed(req.body, hospitalId);
      
      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "BED_CREATED",
        targetType: "Bed",
        targetId: bed.id,
        metadata: {
          bedNumber: bed.bedNumber,
          wardId: bed.wardId
        }
      });
      
      res.status(201).json({
        message: "Bed created successfully",
        bed
      });
      
    } catch (error) {
      console.error("CREATE BED ERROR:", error);
      
      if (error.message.includes("not found") || error.message.includes("capacity")) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Update bed
   */
  static async updateBed(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      
      const bed = await AdmissionsService.updateBed(id, hospitalId, req.body);
      
      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "BED_UPDATED",
        targetType: "Bed",
        targetId: bed.id
      });
      
      res.json({
        message: "Bed updated successfully",
        bed
      });
      
    } catch (error) {
      console.error("UPDATE BED ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get available beds
   */
static async getAvailableBeds(req, res) {
  try {
    let hospitalId = req.hospitalId; // default from middleware

    // Allow SYSTEM_ADMIN to override hospital
    if (req.role === "SYSTEM_ADMIN") {
      const headerHospitalId = req.headers["x-hospital-id"] || req.query.hospitalId;
      if (headerHospitalId) hospitalId = headerHospitalId;
    }

    if (!hospitalId) {
      return res.status(400).json({ message: "Hospital ID is required" });
    }

    const { wardId } = req.query;

    const beds = await AdmissionsService.getAvailableBeds(hospitalId, wardId);

    res.json({
      total: beds.length,
      beds
    });

  } catch (error) {
    console.error("GET AVAILABLE BEDS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
}


  /**
   * Get bed occupancy report
   */
  static async getBedOccupancyReport(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role; // if needed
      
      const report = await AdmissionsService.getBedOccupancyReport(hospitalId);
      
      res.json({ report });
      
    } catch (error) {
      console.error("BED OCCUPANCY REPORT ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // ==================== ADMISSION CONTROLLERS ====================

  /**
   * Request admission
   */
static async requestAdmission(req, res) {
  try {
    const hospitalId = req.hospitalId;
    const hospital = req.hospital;
    const userId = req.user.id;
    const role = req.role;
    const doctorId = req.doctorId; // current doctor (if any)

    const { patientId, admittingDoctorId, bedId } = req.body;

    if (!patientId || !admittingDoctorId) {
      return res.status(400).json({ 
        message: "Patient ID and admitting doctor ID are required" 
      });
    }

    // Normalize bedId: if empty string, use null
    const normalizedBedId = bedId && bedId.trim() !== "" ? bedId : null;

    // Verify patient exists
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, hospitalId }
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Verify doctor exists
    const doctor = await prisma.doctor.findFirst({
      where: { id: admittingDoctorId, hospitalId }
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Doctor can only admit for self
    if (role === 'DOCTOR' && admittingDoctorId !== doctorId) {
      return res.status(403).json({ message: "You can only request admission for yourself as the admitting doctor" });
    }

    const admission = await AdmissionsService.requestAdmission(
      {
        ...req.body,
        bedId: normalizedBedId, // pass the normalized bedId
      },
      hospitalId,
      hospital.code,
      userId,
      role,
      doctorId
    );

    await logAudit({
      req,
      actorId: userId,
      actorRole: role,
      actorEmail: req.userEmail,
      hospitalId,
      action: "ADMISSION_REQUESTED",
      targetType: "Admission",
      targetId: admission.id,
      metadata: {
        patientId,
        doctorId: admittingDoctorId
      }
    });

    res.status(201).json({
      message: "Admission requested successfully",
      admission: formatAdmissionDisplay(admission)
    });

  } catch (error) {
    console.error("REQUEST ADMISSION ERROR:", error);

    if (error.message.includes("not available")) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
}


/**
 * Update admission details (diagnosis, notes, expected discharge, etc.)
 */
static async updateAdmission(req, res) {
  try {
    const { id } = req.params;
    const hospitalId = req.hospitalId;
    const userId = req.user.id;
    const role = req.role;
    const doctorId = req.doctorId;

    // Include bedId from the request body
    const { expectedDischarge, diagnosis, notes, bedId } = req.body;

    const admission = await AdmissionsService.updateAdmission(
      id,
      hospitalId,
      { expectedDischarge, diagnosis, notes, bedId }, // now includes bedId
      userId,
      role,
      doctorId
    );

    await logAudit({
      req,
      actorId: userId,
      actorRole: role,
      actorEmail: req.userEmail,
      hospitalId,
      action: "ADMISSION_UPDATED",
      targetType: "Admission",
      targetId: admission.id,
      metadata: { changes: req.body }
    });

    res.json({
      message: "Admission updated successfully",
      admission: formatAdmissionDisplay(admission)
    });
  } catch (error) {
    console.error("UPDATE ADMISSION ERROR:", error);
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("not allowed")) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error" });
  }
}


  /**
   * Approve admission
   */
  static async approveAdmission(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;
      
      // Only doctors and admins can approve (already in route, but double-check)
      const admission = await AdmissionsService.approveAdmission(id, hospitalId, userId, role, doctorId);
      
      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "ADMISSION_APPROVED",
        targetType: "Admission",
        targetId: admission.id
      });
      
      res.json({
        message: "Admission approved successfully",
        admission
      });
      
    } catch (error) {
      console.error("APPROVE ADMISSION ERROR:", error);
      
      if (error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("not allowed")) {
        return res.status(403).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Admit patient
   */
  static async admitPatient(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;
      
      const admission = await AdmissionsService.admitPatient(id, hospitalId, userId, role, doctorId);
      
      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "PATIENT_ADMITTED",
        targetType: "Admission",
        targetId: admission.id
      });
      
      res.json({
        message: "Patient admitted successfully",
        admission
      });
      
    } catch (error) {
      console.error("ADMIT PATIENT ERROR:", error);
      
      if (error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("not allowed")) {
        return res.status(403).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Transfer patient
   */
  static async transferPatient(req, res) {
    try {
      const { id } = req.params;
      const { newBedId, reason } = req.body;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;
      
      if (!newBedId || !reason) {
        return res.status(400).json({ 
          message: "New bed ID and reason are required" 
        });
      }
      
      const admission = await AdmissionsService.transferPatient(
        id, 
        hospitalId, 
        newBedId, 
        reason,
        userId,
        role,
        doctorId
      );
      
      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "PATIENT_TRANSFERRED",
        targetType: "Admission",
        targetId: admission.id,
        metadata: {
          newBedId,
          reason
        }
      });
      
      res.json({
        message: "Patient transferred successfully",
        admission
      });
      
    } catch (error) {
      console.error("TRANSFER PATIENT ERROR:", error);
      
      if (error.message.includes("not found") || error.message.includes("not available")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("not allowed")) {
        return res.status(403).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Discharge patient
   */
  static async dischargePatient(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;
      
      const admission = await AdmissionsService.dischargePatient(
        id, 
        hospitalId, 
        req.body, 
        userId,
        role,
        doctorId
      );
      
      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "PATIENT_DISCHARGED",
        targetType: "Admission",
        targetId: admission.id,
        metadata: {
          lengthOfStay: admission.dischargeDate ? 
            Math.ceil((new Date(admission.dischargeDate) - new Date(admission.admissionDate)) / (1000 * 60 * 60 * 24)) : 0
        }
      });
      
      res.json({
        message: "Patient discharged successfully",
        admission: formatAdmissionDisplay(admission)
      });
      
    } catch (error) {
      console.error("DISCHARGE PATIENT ERROR:", error);
      
      if (error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("not allowed")) {
        return res.status(403).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Cancel admission
   */
  static async cancelAdmission(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;
      
      const admission = await AdmissionsService.cancelAdmission(id, hospitalId, reason, userId, role, doctorId);
      
      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "ADMISSION_CANCELLED",
        targetType: "Admission",
        targetId: admission.id,
        metadata: { reason }
      });
      
      res.json({
        message: "Admission cancelled successfully",
        admission
      });
      
    } catch (error) {
      console.error("CANCEL ADMISSION ERROR:", error);
      
      if (error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("not allowed")) {
        return res.status(403).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get admission by ID
   */
  static async getAdmission(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;

      const admission = await AdmissionsService.getAdmissionById(id, hospitalId, role, doctorId);

      if (!admission) {
        return res.status(404).json({ message: "Admission not found" });
      }

      res.json({ admission });
      
    } catch (error) {
      console.error("GET ADMISSION ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * List admissions
   */
  static async listAdmissions(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;

      const {
        patientId,
        doctorId: queryDoctorId,
        wardId,
        status,
        fromDate,
        toDate,
        search,
        page,
        limit,
        sortBy,
        sortOrder
      } = req.query;
      
      const result = await AdmissionsService.listAdmissions({
        hospitalId,
        role,
        currentDoctorId: doctorId,
        patientId,
        doctorId: queryDoctorId,
        wardId,
        status,
        fromDate,
        toDate,
        search,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        sortBy: sortBy || 'admissionDate',
        sortOrder: sortOrder || 'desc'
      });
      
      res.json(result);
      
    } catch (error) {
      console.error("LIST ADMISSIONS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get current admissions
   */
  static async getCurrentAdmissions(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;

      const admissions = await AdmissionsService.getCurrentAdmissions(hospitalId, role, doctorId);

      res.json({
        total: admissions.length,
        admissions: admissions.map(formatAdmissionDisplay)
      });
      
    } catch (error) {
      console.error("GET CURRENT ADMISSIONS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get admissions statistics
   */

static async getAdmissionsStats(req, res) {
  try {
    const hospitalId = req.hospitalId;
    const role = req.role;
    const doctorId = req.doctorId; // may be undefined for non‑doctors

    const stats = await AdmissionsService.getAdmissionsStats(hospitalId, role, doctorId);

    res.json({ stats });
  } catch (error) {
    console.error("ADMISSIONS STATS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
}

  /**
   * Get patient admission history
   */
  static async getPatientAdmissionHistory(req, res) {
    try {
      const { patientId } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;

      const admissions = await AdmissionsService.getPatientAdmissionHistory(patientId, hospitalId, role, doctorId);

      res.json({
        total: admissions.length,
        admissions
      });
      
    } catch (error) {
      console.error("PATIENT ADMISSION HISTORY ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Sync offline data
   */
  static async syncOffline(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;
      
      const data = Array.isArray(req.body) ? req.body : [req.body];
      
      const results = await AdmissionsService.syncOffline(data, hospitalId, userId, role, doctorId);
      
      res.json({
        message: `${results.length} items synced`,
        results,
        syncStatus: "COMPLETED"
      });
      
    } catch (error) {
      console.error("SYNC ADMISSIONS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}