// backend/src/routes/modules/patients/patients.controller.js

import { prisma } from "../../../lib/prisma.js";
import { PatientService } from "./patients.service.js";
import { sanitizePatientInput, isValidEmail, isValidPhone, generateOfflineId } from "./patients.utils.js";
import { logAudit } from "../../../utils/audit.js";

export class PatientController {

  /**
   * Create new patient (receptionists, doctors, admins)
   */
  static async createPatient(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const hospital = req.hospital;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId; // for doctors

      if (!hospitalId) {
        return res.status(403).json({ message: "No hospital context" });
      }

      const data = sanitizePatientInput(req.body);

      // Validation
      if (!data.firstName || !data.lastName) {
        return res.status(400).json({ message: "First name and last name are required" });
      }

      if (data.email && !isValidEmail(data.email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      if (data.phone && !isValidPhone(data.phone)) {
        return res.status(400).json({ message: "Invalid phone number format" });
      }

      // Check if primary doctor exists and belongs to hospital
      if (data.primaryDoctorId) {
        const doctor = await prisma.doctor.findFirst({
          where: {
            id: data.primaryDoctorId,
            hospitalId
          }
        });

        if (!doctor) {
          return res.status(404).json({ message: "Primary doctor not found in this hospital" });
        }

        // If user is a doctor, they can only set themselves as primary doctor
        if (role === 'DOCTOR' && data.primaryDoctorId !== doctorId) {
          return res.status(403).json({ message: "Doctors can only set themselves as the primary doctor" });
        }
      }

      // Create patient
      const patient = await PatientService.createPatient(
        data,
        hospitalId,
        hospital.code || hospital.name.slice(0, 3).toUpperCase(),
        userId,
        role,
        doctorId
      );

      // Log audit
      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "PATIENTS_REGISTERED",
        targetType: "Patient",
        targetId: patient.id,
        metadata: {
          uhid: patient.uhid,
          name: `${patient.firstName} ${patient.lastName}`
        }
      });

      res.status(201).json({
        message: "Patient registered successfully",
        patient
      });

    } catch (error) {
      console.error("CREATE PATIENT ERROR:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  /**
   * Get patient by ID (with RBAC)
   */
  static async getPatient(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;
      const patientId = req.patientId; // for patients

      const patient = await PatientService.getPatientById(id, hospitalId, role, doctorId, patientId);

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      res.json({ patient });

    } catch (error) {
      console.error("GET PATIENT ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get patient by UHID (with RBAC)
   */
  static async getPatientByUHID(req, res) {
    try {
      const { uhid } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;
      const patientId = req.patientId;

      const patient = await PatientService.getPatientByUHID(uhid, hospitalId, role, doctorId, patientId);

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      res.json({ patient });

    } catch (error) {
      console.error("GET PATIENT BY UHID ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Update patient (receptionists, doctors, admins)
   */
  static async updatePatient(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;

      const data = sanitizePatientInput(req.body);

      // Check if patient exists
      const existing = await prisma.patient.findFirst({
        where: { id, hospitalId }
      });

      if (!existing) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Validate email if provided
      if (data.email && !isValidEmail(data.email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Validate phone if provided
      if (data.phone && !isValidPhone(data.phone)) {
        return res.status(400).json({ message: "Invalid phone number format" });
      }

      // Check primary doctor if changing
      if (data.primaryDoctorId && data.primaryDoctorId !== existing.primaryDoctorId) {
        const doctor = await prisma.doctor.findFirst({
          where: {
            id: data.primaryDoctorId,
            hospitalId
          }
        });

        if (!doctor) {
          return res.status(404).json({ message: "Primary doctor not found in this hospital" });
        }

        // If user is a doctor, they can only set themselves as primary doctor
        if (role === 'DOCTOR' && data.primaryDoctorId !== doctorId) {
          return res.status(403).json({ message: "Doctors can only set themselves as the primary doctor" });
        }
      }

      // Update patient
      const patient = await PatientService.updatePatient(id, hospitalId, data, role, doctorId, userId);

      // Log audit
      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "PATIENTS_UPDATED",
        targetType: "Patient",
        targetId: patient.id,
        metadata: {
          uhid: patient.uhid,
          changes: Object.keys(data)
        }
      });

      res.json({
        message: "Patient updated successfully",
        patient
      });

    } catch (error) {
      console.error("UPDATE PATIENT ERROR:", error);
      if (error.message.includes("Access denied")) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * List patients (with RBAC)
   */
  static async listPatients(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;
      const patientId = req.patientId;

      const {
        search,
        doctorId: queryDoctorId,
        isActive,
        page,
        limit,
        sortBy,
        sortOrder
      } = req.query;

      const result = await PatientService.listPatients({
        hospitalId,
        role,
        currentDoctorId: doctorId,
        currentPatientId: patientId,
        search,
        doctorId: queryDoctorId,
        isActive: isActive === 'false' ? false : true,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc'
      });

      res.json(result);

    } catch (error) {
      console.error("LIST PATIENTS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Delete/deactivate patient (admin only)
   */
  static async deletePatient(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;

      // Soft delete - just deactivate
      const patient = await PatientService.deletePatient(id, hospitalId, role, userId);

      // Log audit
      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "PATIENTS_DEACTIVATED",
        targetType: "Patient",
        targetId: patient.id,
        metadata: {
          uhid: patient.uhid,
          name: `${patient.firstName} ${patient.lastName}`
        }
      });

      res.json({
        message: "Patient deactivated successfully",
        patient
      });

    } catch (error) {
      console.error("DELETE PATIENT ERROR:", error);
      if (error.message.includes("Access denied")) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Reactivate patient (admin only)
   */
  static async reactivatePatient(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;

      const patient = await PatientService.reactivatePatient(id, hospitalId, role, userId);

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "PATIENTS_REACTIVATED",
        targetType: "Patient",
        targetId: patient.id
      });

      res.json({
        message: "Patient reactivated successfully",
        patient
      });

    } catch (error) {
      console.error("REACTIVATE PATIENT ERROR:", error);
      if (error.message.includes("Access denied")) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: "Server error" });
    }
  }

/**
 * Get patient statistics (role‑aware)
 */
static async getPatientStats(req, res) {
  try {
    const hospitalId = req.hospitalId;
    const role = req.role;
    const doctorId = req.doctorId; // add this

    const stats = await PatientService.getPatientStats(hospitalId, role, doctorId); // pass doctorId

    res.json({ stats });
  } catch (error) {
    console.error("PATIENT STATS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
}

  /**
   * Sync offline patient (for PWA) – with RBAC
   */
  static async syncOfflinePatient(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const hospital = req.hospital;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;

      const patients = Array.isArray(req.body) ? req.body : [req.body];
      const results = [];

      for (const patientData of patients) {
        const patient = await PatientService.syncOfflinePatient(
          patientData,
          hospitalId,
          hospital.code || hospital.name.slice(0, 3).toUpperCase(),
          userId,
          role,
          doctorId
        );
        results.push(patient);
      }

      res.json({
        message: `${results.length} patients synced successfully`,
        patients: results,
        syncStatus: "SYNCED"
      });

    } catch (error) {
      console.error("SYNC PATIENT ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Search patients (quick lookup) – with RBAC
   */
  static async searchPatients(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;
      const patientId = req.patientId;
      const { q } = req.query;

      if (!q || q.length < 2) {
        return res.json({ patients: [] });
      }

      // Build where clause with RBAC
      const where = {
        hospitalId,
        isActive: true,
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { uhid: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { email: { contains: q, mode: 'insensitive' } }
        ]
      };

      if (role === 'DOCTOR') {
        // Doctors see only their patients (by primaryDoctorId or appointments)
        where.OR = [
          { primaryDoctorId: doctorId },
          { appointments: { some: { doctorId } } }
        ];
        // Must combine with search OR – need to adjust query structure.
        // Simpler: We'll rely on listPatients method for search, but for quick lookup we can just filter.
        // We'll implement a simplified version here using patient IDs that doctor has access to.
        const accessiblePatientIds = await PatientService.getAccessiblePatientIdsForDoctor(doctorId, hospitalId);
        if (accessiblePatientIds.length === 0) {
          return res.json({ patients: [] });
        }
        where.id = { in: accessiblePatientIds };
      } else if (role === 'PATIENT') {
        // Patients see only themselves
        where.id = patientId;
      }
      // Admins, nurses, receptionists see all

      const patients = await prisma.patient.findMany({
        where,
        take: 10,
        select: {
          id: true,
          uhid: true,
          firstName: true,
          lastName: true,
          phone: true,
          dob: true,
          bloodGroup: true
        }
      });

      res.json({ patients });

    } catch (error) {
      console.error("SEARCH PATIENTS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}