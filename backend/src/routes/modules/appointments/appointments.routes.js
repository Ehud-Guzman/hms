import { Router } from "express";
import { AppointmentController } from "./appointments.controller.js";
import { requireAuth } from "../../../middleware/auth.js";
import { tenantContext } from "../../../middleware/tenant.js";
import { requireTenant } from "../../../middleware/tenant.js";
import { requireRole } from "../../../middleware/auth.js";

const router = Router();

// All appointment routes require auth + tenant context
router.use(requireAuth);
router.use(tenantContext);
router.use(requireTenant);

/**
 * Slot availability (public within tenant)
 */
router.get("/slots", AppointmentController.getAvailableSlots);

/**
 * Statistics – only admins can see full stats
 */
router.get("/stats", AppointmentController.getAppointmentStats);

/**
 * Today's appointments – all authenticated users (controller will filter by role)
 */
router.get("/today", AppointmentController.getTodayAppointments);

/**
 * Waiting list – receptionists, nurses, doctors, admins
 */
router.get("/waiting", requireRole("RECEPTIONIST", "NURSE", "DOCTOR", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), AppointmentController.getWaitingList);

/**
 * Calendar view – all (filtered)
 */
router.get("/calendar", AppointmentController.getCalendar);

/**
 * Sync offline appointments – all
 */
router.post("/sync", AppointmentController.syncOfflineAppointments);

/**
 * Patient appointments – doctors/nurses/admins
 */
router.get("/patient/:patientId", requireRole("DOCTOR", "NURSE", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), AppointmentController.getPatientAppointments);

/**
 * Doctor appointments – that doctor, admins
 */
router.get("/doctor/:doctorId", requireRole("DOCTOR", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), AppointmentController.getDoctorAppointments);

/**
 * CRUD Operations
 */
router.post("/", requireRole("DOCTOR", "RECEPTIONIST", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), AppointmentController.bookAppointment);
router.get("/", AppointmentController.getAllAppointments); // controller filters
router.get("/:id", AppointmentController.getAppointment); // controller checks access

/**
 * Status updates – specific roles
 */
router.patch("/:id/check-in", requireRole("RECEPTIONIST", "NURSE", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), AppointmentController.checkIn);
router.patch("/:id/start", requireRole("DOCTOR", "NURSE", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), AppointmentController.startAppointment);
router.patch("/:id/complete", requireRole("DOCTOR", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), AppointmentController.completeAppointment);
router.patch("/:id/cancel", requireRole("DOCTOR", "RECEPTIONIST", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), AppointmentController.cancelAppointment);
router.patch("/:id/no-show", requireRole("RECEPTIONIST", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), AppointmentController.markNoShow);
router.patch("/:id/reschedule", requireRole("RECEPTIONIST", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), AppointmentController.rescheduleAppointment);

export default router;