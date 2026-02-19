// backend/src/modules/settings/submodules/business-hours/hours.routes.js

import { Router } from "express";
import { HoursController } from "./hours.controller.js";
import { requireAuth } from "../../../../../middleware/auth.js";
import { tenantContext } from "../../../../../middleware/tenant.js";

const router = Router();

router.use(requireAuth);
router.use(tenantContext);

router.get("/", HoursController.getHours);
router.patch("/", HoursController.updateHours);
router.post("/holidays", HoursController.addHoliday);
router.delete("/holidays/:date", HoursController.removeHoliday);

export default router;