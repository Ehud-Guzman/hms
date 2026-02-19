// backend/src/routes/modules/medical-records/medical-records.controller.js

import { prisma } from "../../../lib/prisma.js";
import { MedicalRecordsService } from "./medical-records.service.js";
import {
  validateMedicalRecord,
  formatRecordDisplay,
  generateOfflineId,
  buildTimeline
} from "./medical-records.utils.js";
import { logAudit } from "../../../utils/audit.js";
import multer from "multer";
import path from "path";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/medical-records/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
  }
});

export class MedicalRecordsController {

  /**
   * Create medical record (doctors, nurses, admins)
   */
  static async createRecord(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId; // for doctors

      if (!hospitalId) {
        return res.status(403).json({ message: "No hospital context" });
      }

      const { patientId, doctorId: requestDoctorId } = req.body;

      if (!patientId) {
        return res.status(400).json({ message: "Patient ID is required" });
      }

      // If user is a doctor, they must be the doctor associated with the record
      if (role === 'DOCTOR' && requestDoctorId !== doctorId) {
        return res.status(403).json({ message: "Doctors can only create records for themselves as the attending doctor" });
      }

      // Verify patient exists
      const patient = await prisma.patient.findFirst({
        where: { id: patientId, hospitalId }
      });

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Verify doctor exists if provided
      if (requestDoctorId) {
        const doctor = await prisma.doctor.findFirst({
          where: { id: requestDoctorId, hospitalId }
        });

        if (!doctor) {
          return res.status(404).json({ message: "Doctor not found" });
        }
      }

      // Validate record
      const validation = validateMedicalRecord(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          message: "Invalid record",
          errors: validation.errors
        });
      }

      // Handle file uploads
      const files = req.files || [];

      const record = await MedicalRecordsService.createRecord(
        req.body,
        hospitalId,
        userId,
        role,
        doctorId,
        files
      );

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "MEDICAL_RECORD_CREATED",
        targetType: "MedicalRecord",
        targetId: record.id,
        metadata: {
          patientId,
          recordType: record.recordType,
          title: record.title
        }
      });

      res.status(201).json({
        message: "Medical record created successfully",
        record: formatRecordDisplay(record)
      });

    } catch (error) {
      console.error("CREATE MEDICAL RECORD ERROR:", error);

      if (error.message.includes("Invalid")) {
        return res.status(400).json({ message: error.message });
      }

      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  /**
   * Get record by ID (with RBAC)
   */
  static async getRecord(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;
      const patientId = req.patientId; // for patients

      const record = await MedicalRecordsService.getRecordById(id, hospitalId, role, doctorId, patientId);

      if (!record) {
        return res.status(404).json({ message: "Record not found" });
      }

      res.json({ record });

    } catch (error) {
      console.error("GET RECORD ERROR:", error);

      if (error.message.includes("Access denied")) {
        return res.status(403).json({ message: error.message });
      }

      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Update record (creator or admin)
   */
  static async updateRecord(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;

      const files = req.files || [];

      const record = await MedicalRecordsService.updateRecord(
        id,
        hospitalId,
        req.body,
        userId,
        role,
        doctorId,
        files
      );

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "MEDICAL_RECORD_UPDATED",
        targetType: "MedicalRecord",
        targetId: record.id,
        metadata: {
          changes: Object.keys(req.body)
        }
      });

      res.json({
        message: "Record updated successfully",
        record
      });

    } catch (error) {
      console.error("UPDATE RECORD ERROR:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("Access denied")) {
        return res.status(403).json({ message: error.message });
      }

      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Delete record (admin only)
   */
  static async deleteRecord(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;

      await MedicalRecordsService.deleteRecord(id, hospitalId, role, userId);

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "MEDICAL_RECORD_DELETED",
        targetType: "MedicalRecord",
        targetId: id
      });

      res.json({
        message: "Record deleted successfully"
      });

    } catch (error) {
      console.error("DELETE RECORD ERROR:", error);
      if (error.message.includes("Access denied")) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get patient records (with RBAC)
   */
  static async getPatientRecords(req, res) {
    try {
      const { patientId } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;
      const currentPatientId = req.patientId; // for patients

      // If user is a patient, they can only access their own records
      if (role === 'PATIENT' && patientId !== currentPatientId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const {
        recordType,
        fromDate,
        toDate,
        search,
        page,
        limit,
        sortBy,
        sortOrder
      } = req.query;

      const result = await MedicalRecordsService.getPatientRecords({
        patientId,
        hospitalId,
        role,
        currentDoctorId: doctorId,
        currentPatientId,
        recordType,
        fromDate,
        toDate,
        search,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        sortBy: sortBy || 'recordedAt',
        sortOrder: sortOrder || 'desc'
      });

      res.json(result);

    } catch (error) {
      console.error("GET PATIENT RECORDS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get patient summary (with RBAC)
   */
  static async getPatientSummary(req, res) {
    try {
      const { patientId } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;
      const currentPatientId = req.patientId;

      if (role === 'PATIENT' && patientId !== currentPatientId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const summary = await MedicalRecordsService.getPatientSummary(patientId, hospitalId, role, doctorId);

      res.json({ summary });

    } catch (error) {
      console.error("GET PATIENT SUMMARY ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get patient timeline (with RBAC)
   */
  static async getPatientTimeline(req, res) {
    try {
      const { patientId } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;
      const currentPatientId = req.patientId;

      if (role === 'PATIENT' && patientId !== currentPatientId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const records = await MedicalRecordsService.getPatientTimeline(patientId, hospitalId, role, doctorId);

      const timeline = buildTimeline(records);

      res.json({ timeline });

    } catch (error) {
      console.error("GET PATIENT TIMELINE ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get record statistics (admin only)
   */
  static async getRecordStats(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role;
      const { patientId } = req.query;

      const stats = await MedicalRecordsService.getRecordStats(hospitalId, role, patientId);

      res.json({ stats });

    } catch (error) {
      console.error("GET RECORD STATS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Search ICD-10 codes (all authenticated users)
   */
  static async searchICD10(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.length < 2) {
        return res.json({ results: [] });
      }

      const results = await MedicalRecordsService.searchICD10(q);

      res.json({ results });

    } catch (error) {
      console.error("SEARCH ICD10 ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Add attachment to record (with RBAC)
   */
  static async addAttachment(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const record = await MedicalRecordsService.addAttachment(id, hospitalId, req.file, role, doctorId, userId);

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "MEDICAL_RECORD_ATTACHMENT_ADDED",
        targetType: "MedicalRecord",
        targetId: record.id
      });

      res.json({
        message: "Attachment added successfully",
        record
      });

    } catch (error) {
      console.error("ADD ATTACHMENT ERROR:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("Access denied")) {
        return res.status(403).json({ message: error.message });
      }

      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Remove attachment from record (with RBAC)
   */
  static async removeAttachment(req, res) {
    try {
      const { id } = req.params;
      const { filename } = req.body;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;

      if (!filename) {
        return res.status(400).json({ message: "Filename is required" });
      }

      const record = await MedicalRecordsService.removeAttachment(id, hospitalId, filename, role, doctorId, userId);

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "MEDICAL_RECORD_ATTACHMENT_REMOVED",
        targetType: "MedicalRecord",
        targetId: record.id
      });

      res.json({
        message: "Attachment removed successfully",
        record
      });

    } catch (error) {
      console.error("REMOVE ATTACHMENT ERROR:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("Access denied")) {
        return res.status(403).json({ message: error.message });
      }

      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Sync offline records (with RBAC)
   */
  static async syncOffline(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;

      const records = Array.isArray(req.body) ? req.body : [req.body];

      const results = await MedicalRecordsService.syncOffline(records, hospitalId, userId, role, doctorId);

      res.json({
        message: `${results.length} records synced`,
        results,
        syncStatus: "COMPLETED"
      });

    } catch (error) {
      console.error("SYNC MEDICAL RECORDS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Middleware for file upload
   */
  static uploadMiddleware(fieldName) {
    return upload.array(fieldName, 5); // Max 5 files
  }

  /**
   * Middleware for single file upload
   */
  static uploadSingleMiddleware(fieldName) {
    return upload.single(fieldName);
  }
}