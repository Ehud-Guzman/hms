import { Router } from "express";
import { IntegrationsController } from "./integrations.controller.js";
import { requireAuth } from "../../../../../middleware/auth.js";
import { tenantContext } from "../../../../../middleware/tenant.js";

const router = Router();

router.use(requireAuth);
router.use(tenantContext);

router.get("/", IntegrationsController.list);
router.get("/:id", IntegrationsController.getOne);
router.post("/", IntegrationsController.create);
router.patch("/:id", IntegrationsController.update);
router.delete("/:id", IntegrationsController.delete);

export default router;