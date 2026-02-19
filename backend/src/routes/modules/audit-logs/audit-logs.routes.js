import { Router } from "express";
import { AuditLogsController } from "./audit-logs.controller.js";
import { requireAuth } from "../../../middleware/auth.js";
import { tenantContext } from "../../../middleware/tenant.js";

const router = Router();

router.use(requireAuth);
router.use(tenantContext);

router.get("/", AuditLogsController.list);

export default router;