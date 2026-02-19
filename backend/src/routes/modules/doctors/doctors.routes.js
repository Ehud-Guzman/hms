import { Router } from "express";
import { DoctorController } from "./doctors.controller.js";
import { requireAuth } from "../../../middleware/auth.js";
import { tenantContext } from "../../../middleware/tenant.js";
import { requireTenant } from "../../../middleware/tenant.js";
import { requireRole } from "../../../middleware/auth.js";

const router = Router();

// All doctor routes require auth + tenant context
router.use(requireAuth);
router.use(tenantContext);
router.use(requireTenant);

/**
 * Specialties – all
 */
router.get("/specialties", DoctorController.getSpecialties);

/**
 * Statistics – admins only
 */
router.get("/stats", requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN"), DoctorController.getDoctorStats);

/**
 * Search doctors – all (filtered by hospital)
 */
router.get("/search", DoctorController.searchDoctors);

/**
 * Availability management
 */
router.get("/:id/availability", requireRole("DOCTOR", "HOSPITAL_ADMIN", "SYSTEM_ADMIN", "RECEPTIONIST"), DoctorController.getAvailableSlots);
router.post("/availability", requireRole("DOCTOR", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), DoctorController.setAvailability);

/**
 * Upcoming appointments – doctors (self) and admins
 */
router.get("/:id/appointments", requireRole("DOCTOR", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), DoctorController.getUpcomingAppointments);

/**
 * CRUD Operations
 */
router.post("/", requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN"), DoctorController.createDoctor);
router.get("/", DoctorController.listDoctors); // filtered by hospital
router.get("/:id", DoctorController.getDoctor); // filtered
router.patch("/:id", requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN"), DoctorController.updateDoctor);
router.delete("/:id", requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN"), DoctorController.deleteDoctor);

export default router;