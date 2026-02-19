import { Router } from "express";
import { SecurityController } from "./security.controller.js";
import { requireAuth } from "../../../../../middleware/auth.js";
import { tenantContext } from "../../../../../middleware/tenant.js";
import { requireRole } from "../../../../../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.use(tenantContext);
router.use(requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN"));

router.get("/", SecurityController.getSettings);
router.patch("/", SecurityController.updateSettings);

export default router;