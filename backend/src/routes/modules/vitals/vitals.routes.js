import { Router } from "express";
import { VitalsController } from "./vitals.controller.js";
import { requireAuth } from "../../../middleware/auth.js";
import { tenantContext } from "../../../middleware/tenant.js";
import { requireTenant } from "../../../middleware/tenant.js";
import { requireRole } from "../../../middleware/auth.js";

const router = Router();

// All vitals routes require auth + tenant context
router.use(requireAuth);
router.use(tenantContext);
router.use(requireTenant);

/**
 * Triage list – nurses/doctors/admins
 */
router.get("/triage", requireRole("NURSE", "DOCTOR", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), VitalsController.getTriageList);

/**
 * Statistics – admins only
 */
router.get("/stats", VitalsController.getVitalsStats);

/**
 * Patient vitals – nurses/doctors/admins
 */
router.get("/patient/:patientId", requireRole("NURSE", "DOCTOR", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), VitalsController.getPatientVitals);
router.get("/patient/:patientId/latest", requireRole("NURSE", "DOCTOR", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), VitalsController.getLatestVitals);
router.get("/patient/:patientId/trends", requireRole("NURSE", "DOCTOR", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), VitalsController.getPatientTrends);

/**
 * Appointment vitals – nurses/doctors/admins
 */
router.get("/appointment/:appointmentId", requireRole("NURSE", "DOCTOR", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), VitalsController.getAppointmentVitals);

/**
 * Sync offline vitals – all clinical staff
 */
router.post("/sync", requireRole("NURSE", "DOCTOR", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), VitalsController.syncOffline);

/**
 * CRUD Operations
 */
router.post("/", requireRole("NURSE", "DOCTOR", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), VitalsController.recordVitals);
router.get("/:id", requireRole("NURSE", "DOCTOR", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), VitalsController.getVital);
router.patch("/:id", requireRole("NURSE", "DOCTOR", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), VitalsController.updateVital);
router.delete("/:id", requireRole("HOSPITAL_ADMIN", "SYSTEM_ADMIN"), VitalsController.deleteVital);

export default router;