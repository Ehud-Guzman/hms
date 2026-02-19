// backend/src/modules/settings/submodules/features/features.routes.js

import { Router } from "express";
import { FeaturesController } from "./features.controller.js";
import { requireAuth } from "../../../../../middleware/auth.js";
import { tenantContext } from "../../../../../middleware/tenant.js";

const router = Router();

router.use(requireAuth);
router.use(tenantContext);

router.get("/", FeaturesController.getFeatures);
router.patch("/", FeaturesController.updateFeatures);
router.get("/:feature", FeaturesController.checkFeature);

export default router;