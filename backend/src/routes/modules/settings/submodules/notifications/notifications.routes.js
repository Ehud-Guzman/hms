// backend/src/modules/settings/submodules/notifications/notifications.routes.js

import { Router } from "express";
import { NotificationsController } from "./notifications.controller.js";
import { requireAuth } from "../../../../../middleware/auth.js";
import { tenantContext } from "../../../../../middleware/tenant.js";

const router = Router();

router.use(requireAuth);
router.use(tenantContext);

router.get("/", NotificationsController.getSettings);
router.patch("/", NotificationsController.updateSettings);
router.get("/templates", NotificationsController.getTemplates);
router.patch("/templates/:templateId", NotificationsController.updateTemplate);
router.post("/test", NotificationsController.testNotification);

export default router;