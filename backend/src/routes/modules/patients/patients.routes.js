import { Router } from "express";
import { PatientController } from "./patients.controller.js";
import { requireAuth } from "../../../middleware/auth.js";
import { tenantContext } from "../../../middleware/tenant.js";
import { requireTenant } from "../../../middleware/tenant.js";
import { requireRole } from "../../../middleware/auth.js";

const router = Router();

// All patient routes require auth + tenant context
router.use(requireAuth);
router.use(tenantContext);
router.use(requireTenant);

/**
 * Patient Statistics – admins only
 */
router.get("/stats", PatientController.getPatientStats);

/**
 * Search patients – all (controller filters by role)
 */
router.get("/search", PatientController.searchPatients);

/**
 * Get patient by UHID – all (filtered)
 */
router.get("/uhid/:uhid", PatientController.getPatientByUHID);

/**
 * Sync offline patients – all
 */
router.post("/sync", PatientController.syncOfflinePatient);

/**
 * CRUD Operations
 */
router.post("/", requireRole("RECEPTIONIST", "DOCTOR", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), PatientController.createPatient);
router.get("/", PatientController.listPatients); // controller filters
router.get("/:id", PatientController.getPatient); // controller checks access
router.patch("/:id", requireRole("RECEPTIONIST", "DOCTOR", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), PatientController.updatePatient);
router.delete("/:id", requireRole("HOSPITAL_ADMIN", "SYSTEM_ADMIN"), PatientController.deletePatient);

/**
 * Reactivate patient – admin only
 */
router.patch("/:id/reactivate", requireRole("HOSPITAL_ADMIN", "SYSTEM_ADMIN"), PatientController.reactivatePatient);

export default router;