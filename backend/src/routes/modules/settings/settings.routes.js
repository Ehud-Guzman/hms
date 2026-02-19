// backend/src/modules/settings/settings.routes.js

import { Router } from "express";
import { SettingsController } from "./settings.controller.js";
import { requireAuth } from "../../../middleware/auth.js";
import { tenantContext } from "../../../middleware/tenant.js";
import { requireTenant } from "../../../middleware/tenant.js";
import { requireRole } from "../../../middleware/auth.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// All settings routes require auth + tenant context + admin role
router.use(requireAuth);
router.use(tenantContext);
router.use(requireTenant);
router.use(requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN"));

// ==================== MAIN SETTINGS ====================
router.get("/", SettingsController.getSettings);
router.patch("/", SettingsController.updateSettings);
router.post("/reset", SettingsController.resetSettings);
router.get("/hospitals", SettingsController.getHospitals); 

// ==================== FEATURE FLAGS ====================
router.get("/features", SettingsController.getFeatures);
router.patch("/features", SettingsController.updateFeatures);

// ==================== BACKUP & RESTORE ====================
router.get("/export", SettingsController.exportSettings);
router.post("/import", upload.single('backup'), SettingsController.importSettings);

export default router;