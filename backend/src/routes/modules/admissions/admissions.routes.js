import { Router } from "express";
import { AdmissionsController } from "./admissions.controller.js";
import { requireAuth } from "../../../middleware/auth.js";
import { tenantContext } from "../../../middleware/tenant.js";
import { requireTenant } from "../../../middleware/tenant.js";
import { requireRole } from "../../../middleware/auth.js";

const router = Router();

// All admissions routes require auth + tenant context
router.use(requireAuth);
router.use(tenantContext);
router.use(requireTenant);

// ==================== WARD ROUTES ====================
router.get("/wards/types",
  requireRole("DOCTOR", "NURSE", "RECEPTIONIST", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"),
  AdmissionsController.getWardTypes
);

router.get("/wards/available-beds",
  requireRole("DOCTOR", "NURSE", "RECEPTIONIST", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"),
  AdmissionsController.getAvailableBeds
);

router.patch("/:id", 
  requireRole("DOCTOR", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), 
  AdmissionsController.updateAdmission
);

router.get("/wards/occupancy-report",
  requireRole("DOCTOR", "NURSE", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"),
  AdmissionsController.getBedOccupancyReport
);

router.post("/wards",
  requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN"),
  AdmissionsController.createWard
);

router.get("/wards",
  requireRole("DOCTOR", "NURSE", "RECEPTIONIST", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"),
  AdmissionsController.listWards
);

router.get("/wards/:id",
  requireRole("DOCTOR", "NURSE", "RECEPTIONIST", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"),
  AdmissionsController.getWard
);

router.patch("/wards/:id",
  requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN"),
  AdmissionsController.updateWard
);

// ==================== BED ROUTES ====================
router.post("/beds",
  requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN"),
  AdmissionsController.createBed
);

router.patch("/beds/:id",
  requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN"),
  AdmissionsController.updateBed
);

// ==================== ADMISSION ROUTES ====================
router.get("/stats", AdmissionsController.getAdmissionsStats);

router.get("/current",
  requireRole("DOCTOR", "NURSE", "RECEPTIONIST", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"),
  AdmissionsController.getCurrentAdmissions
);

router.get("/patient/:patientId",
  requireRole("DOCTOR", "NURSE", "RECEPTIONIST", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"),
  AdmissionsController.getPatientAdmissionHistory
);

router.post("/",
  requireRole("DOCTOR", "NURSE", "RECEPTIONIST", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"),
  AdmissionsController.requestAdmission
);

router.get("/",
  requireRole("DOCTOR", "NURSE", "RECEPTIONIST", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"),
  AdmissionsController.listAdmissions
);

router.get("/:id",
  requireRole("DOCTOR", "NURSE", "RECEPTIONIST", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"),
  AdmissionsController.getAdmission
);

router.patch("/:id/approve",
  requireRole("DOCTOR", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"),
  AdmissionsController.approveAdmission
);

router.patch("/:id/admit",
  requireRole("DOCTOR", "NURSE", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"),
  AdmissionsController.admitPatient
);

router.patch("/:id/transfer",
  requireRole("DOCTOR", "NURSE", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"),
  AdmissionsController.transferPatient
);

router.patch("/:id/discharge",
  requireRole("DOCTOR", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"),
  AdmissionsController.dischargePatient
);

router.patch("/:id/cancel",
  requireRole("DOCTOR", "NURSE", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"),
  AdmissionsController.cancelAdmission
);

// ==================== SYNC ROUTES ====================
router.post("/sync",
  requireRole("DOCTOR", "NURSE", "RECEPTIONIST", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"),
  AdmissionsController.syncOffline
);

export default router;