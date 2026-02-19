import { Router } from "express";
import { PharmacyController } from "./pharmacy.controller.js";
import { requireAuth } from "../../../middleware/auth.js";
import { tenantContext } from "../../../middleware/tenant.js";
import { requireTenant } from "../../../middleware/tenant.js";
import { requireRole } from "../../../middleware/auth.js";

const router = Router();

// All pharmacy routes require auth + tenant context
router.use(requireAuth);
router.use(tenantContext);
router.use(requireTenant);

// ==================== INVENTORY ROUTES ====================

/**
 * Search medications – all
 */
router.get("/search", PharmacyController.searchMedications);

/**
 * Inventory statistics – admins/pharmacists
 */
router.get("/inventory/stats", requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "PHARMACIST"), PharmacyController.getInventoryStats);

/**
 * Low stock alerts – pharmacists/admins
 */
router.get("/inventory/alerts/low-stock", PharmacyController.getLowStockAlerts);

/**
 * Expiring items – pharmacists/admins
 */
router.get("/inventory/alerts/expiring", requireRole("PHARMACIST", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), PharmacyController.getExpiringItems);

/**
 * Inventory CRUD
 */
router.post("/inventory", requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "PHARMACIST"), PharmacyController.createItem);
router.get("/inventory", PharmacyController.listItems); // all can view inventory items?
router.get("/inventory/:id", PharmacyController.getItem);
router.patch("/inventory/:id", requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "PHARMACIST"), PharmacyController.updateItem);
router.delete("/inventory/:id", requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "PHARMACIST"), PharmacyController.deleteItem);

/**
 * Stock adjustment – pharmacists/admins
 */
router.post("/inventory/:id/adjust", requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "PHARMACIST"), PharmacyController.adjustStock);

// ==================== PRESCRIPTION ROUTES ====================

/**
 * Prescription statistics – admins/pharmacists
 */
router.get("/prescriptions/stats", requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "PHARMACIST"), PharmacyController.getPrescriptionStats);

/**
 * Patient prescriptions – doctors/pharmacists/admins
 */
router.get("/prescriptions/patient/:patientId", requireRole("DOCTOR", "PHARMACIST", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), PharmacyController.getPatientPrescriptions);

/**
 * Prescription CRUD
 */
router.post("/prescriptions", requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "DOCTOR"), PharmacyController.createPrescription);
router.get("/prescriptions", PharmacyController.listPrescriptions); // controller filters
router.get("/prescriptions/:id", PharmacyController.getPrescription); // controller checks access

/**
 * Prescription dispensing – pharmacists/admins
 */
router.post("/prescriptions/:id/dispense", requireRole("PHARMACIST", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), PharmacyController.dispensePrescription);
router.post("/prescriptions/:id/partial", requireRole("PHARMACIST", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), PharmacyController.partiallyDispense);

/**
 * Cancel prescription – doctor (owner) or pharmacist/admin
 */
router.patch("/prescriptions/:id/cancel", requireRole("DOCTOR", "PHARMACIST", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), PharmacyController.cancelPrescription);

// ==================== SYNC ROUTES ====================
router.post("/sync", PharmacyController.syncOffline);

export default router;