import { Router } from "express";
import { MedicalRecordsController } from "./medical-records.controller.js";
import { requireAuth } from "../../../middleware/auth.js";
import { tenantContext } from "../../../middleware/tenant.js";
import { requireTenant } from "../../../middleware/tenant.js";
import { requireRole } from "../../../middleware/auth.js";

const router = Router();

// All medical records routes require auth + tenant context
router.use(requireAuth);
router.use(tenantContext);
router.use(requireTenant);

// ==================== ICD-10 ROUTES ====================
router.get("/icd10/search", MedicalRecordsController.searchICD10); // all

// ==================== STATISTICS ====================
router.get("/stats", requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN"), MedicalRecordsController.getRecordStats);

// ==================== PATIENT RECORDS ====================
router.get("/patient/:patientId", requireRole("DOCTOR", "NURSE", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), MedicalRecordsController.getPatientRecords);
router.get("/patient/:patientId/summary", requireRole("DOCTOR", "NURSE", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), MedicalRecordsController.getPatientSummary);
router.get("/patient/:patientId/timeline", requireRole("DOCTOR", "NURSE", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), MedicalRecordsController.getPatientTimeline);

// ==================== RECORD CRUD ====================
router.post("/", requireRole("DOCTOR", "NURSE", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"),
  MedicalRecordsController.uploadMiddleware('attachments'),
  MedicalRecordsController.createRecord
);

router.get("/:id", requireRole("DOCTOR", "NURSE", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), MedicalRecordsController.getRecord);

router.patch("/:id", requireRole("DOCTOR", "NURSE", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"),
  MedicalRecordsController.uploadMiddleware('attachments'),
  MedicalRecordsController.updateRecord
);

router.delete("/:id", requireRole("HOSPITAL_ADMIN", "SYSTEM_ADMIN"), MedicalRecordsController.deleteRecord);

// ==================== ATTACHMENT ROUTES ====================
router.post("/:id/attachments", requireRole("DOCTOR", "NURSE", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"),
  MedicalRecordsController.uploadSingleMiddleware('attachment'),
  MedicalRecordsController.addAttachment
);

router.delete("/:id/attachments", requireRole("DOCTOR", "NURSE", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"),
  MedicalRecordsController.removeAttachment
);

// ==================== SYNC ROUTES ====================
router.post("/sync", requireRole("DOCTOR", "NURSE", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), MedicalRecordsController.syncOffline);

export default router;