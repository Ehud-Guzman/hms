// backend/src/modules/settings/submodules/branding/branding.routes.js

import { Router } from "express";
import { BrandingController } from "./branding.controller.js";
import { requireAuth } from "../../../../../middleware/auth.js";
import { tenantContext } from "../../../../../middleware/tenant.js";
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/branding/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `logo-${req.hospitalId}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

const router = Router();

router.use(requireAuth);
router.use(tenantContext);

router.get("/", BrandingController.getBranding);
router.patch("/", BrandingController.updateBranding);
router.post("/logo", upload.single('logo'), BrandingController.uploadLogo);
router.delete("/logo", BrandingController.removeLogo);

export default router;