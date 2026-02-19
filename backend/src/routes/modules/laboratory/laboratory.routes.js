import { Router } from "express";
import { LaboratoryController } from "./laboratory.controller.js";
import { requireAuth } from "../../../middleware/auth.js";
import { tenantContext } from "../../../middleware/tenant.js";
import { requireTenant } from "../../../middleware/tenant.js";
import { requireRole } from "../../../middleware/auth.js";

const router = Router();

// All lab routes require auth + tenant context
router.use(requireAuth);
router.use(tenantContext);
router.use(requireTenant);

// ==================== TEST CATALOG ROUTES ====================

/**
 * Test categories – all
 */
router.get("/tests/categories", LaboratoryController.getCategories);

/**
 * Search tests – all
 */
router.get("/tests/search", LaboratoryController.searchTests);

/**
 * Test CRUD – lab techs and admins
 */
router.post("/tests", requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "LAB_TECHNICIAN"), LaboratoryController.createTest);
router.get("/tests", LaboratoryController.listTests);
router.get("/tests/:id", LaboratoryController.getTest);
router.patch("/tests/:id", requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "LAB_TECHNICIAN"), LaboratoryController.updateTest);
router.delete("/tests/:id", requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN"), LaboratoryController.deleteTest);

// ==================== LAB ORDER ROUTES ====================

/**
 * Statistics and counts – admins/lab techs
 */
router.get("/orders/stats", requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "LAB_TECHNICIAN"), LaboratoryController.getLabStats);
router.get("/orders/pending/counts", requireRole("LAB_TECHNICIAN", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), LaboratoryController.getPendingCounts);

/**
 * Patient history – doctors/nurses/admins/lab techs
 */
router.get("/orders/patient/:patientId", requireRole("DOCTOR", "NURSE", "LAB_TECHNICIAN", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"), LaboratoryController.getPatientLabHistory);

/**
 * Get by order number – all authorized users
 */
router.get("/orders/number/:orderNumber", LaboratoryController.getOrderByNumber); // controller checks access

/**
 * Order CRUD
 */
router.post("/orders", requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "DOCTOR", "LAB_TECHNICIAN"), LaboratoryController.createOrder);
router.get("/orders", LaboratoryController.listOrders); // controller filters
router.get("/orders/:id", LaboratoryController.getOrder); // controller checks access

/**
 * Order status updates – lab techs/admins
 */
router.patch("/orders/:id/status", requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "LAB_TECHNICIAN"), LaboratoryController.updateOrderStatus);

// ==================== RESULTS ROUTES ====================

/**
 * Enter results – lab techs/admins
 */
router.post("/orders/:id/results", requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "LAB_TECHNICIAN"), LaboratoryController.enterResults);

/**
 * Verify results – lab techs/admins
 */
router.patch("/orders/:id/verify", requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "LAB_TECHNICIAN"), LaboratoryController.verifyResults);

// ==================== SYNC ROUTES ====================
router.post("/sync", LaboratoryController.syncOffline);

export default router;