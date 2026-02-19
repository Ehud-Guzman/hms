// backend/src/modules/settings/submodules/branding/branding.controller.js

import { prisma } from "../../../../../lib/prisma.js";
import { isValidColor } from "../../settings.utils.js";
import { logAudit } from "../../../../../utils/audit.js";
import fs from "fs/promises";
import path from "path";

export class BrandingController {
  
  /**
   * Get branding settings
   */
  static async getBranding(req, res) {
    try {
      const hospitalId = req.hospitalId;
      
      const settings = await prisma.hospitalSettings.findUnique({
        where: { hospitalId },
        select: {
          brandLogoUrl: true,
          brandPrimaryColor: true,
          brandSecondaryColor: true,
          themeKey: true,
          mode: true,
          density: true,
          radius: true,
          printShowLogo: true,
          printHeaderText: true,
          printFooterText: true
        }
      });
      
      res.json({ branding: settings });
      
    } catch (error) {
      console.error("GET BRANDING ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Update branding
   */
  static async updateBranding(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      
      const { primaryColor, secondaryColor, theme, ...rest } = req.body;
      
      // Validate colors
      if (primaryColor && !isValidColor(primaryColor)) {
        return res.status(400).json({ message: "Invalid primary color format" });
      }
      
      if (secondaryColor && !isValidColor(secondaryColor)) {
        return res.status(400).json({ message: "Invalid secondary color format" });
      }
      
      const settings = await prisma.hospitalSettings.update({
        where: { hospitalId },
        data: {
          brandPrimaryColor: primaryColor,
          brandSecondaryColor: secondaryColor,
          themeKey: theme,
          mode: rest.mode,
          density: rest.density,
          radius: rest.radius,
          printShowLogo: rest.printShowLogo,
          printHeaderText: rest.printHeaderText,
          printFooterText: rest.printFooterText
        }
      });
      
      await logAudit({
        req,
        actorId: userId,
        actorRole: req.role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "BRANDING_UPDATED",
        targetType: "HospitalSettings",
        targetId: hospitalId
      });
      
      res.json({
        message: "Branding updated successfully",
        branding: settings
      });
      
    } catch (error) {
      console.error("UPDATE BRANDING ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Upload logo
   */
  static async uploadLogo(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      
      if (!req.file) {
        return res.status(400).json({ message: "No logo file uploaded" });
      }
      
      // Get old logo URL to delete
      const oldSettings = await prisma.hospitalSettings.findUnique({
        where: { hospitalId },
        select: { brandLogoUrl: true }
      });
      
      // Delete old logo file if exists
      if (oldSettings?.brandLogoUrl) {
        const oldPath = path.join(process.cwd(), 'public', oldSettings.brandLogoUrl);
        try {
          await fs.unlink(oldPath);
        } catch (e) {
          // File might not exist, ignore
        }
      }
      
      // Construct URL for new logo
      const logoUrl = `/uploads/branding/${req.file.filename}`;
      
      const settings = await prisma.hospitalSettings.update({
        where: { hospitalId },
        data: { brandLogoUrl: logoUrl }
      });
      
      await logAudit({
        req,
        actorId: userId,
        actorRole: req.role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "LOGO_UPLOADED",
        targetType: "HospitalSettings",
        targetId: hospitalId
      });
      
      res.json({
        message: "Logo uploaded successfully",
        logoUrl
      });
      
    } catch (error) {
      console.error("UPLOAD LOGO ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Remove logo
   */
  static async removeLogo(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      
      const settings = await prisma.hospitalSettings.findUnique({
        where: { hospitalId },
        select: { brandLogoUrl: true }
      });
      
      if (settings?.brandLogoUrl) {
        // Delete file
        const filePath = path.join(process.cwd(), 'public', settings.brandLogoUrl);
        try {
          await fs.unlink(filePath);
        } catch (e) {
          // File might not exist, ignore
        }
      }
      
      await prisma.hospitalSettings.update({
        where: { hospitalId },
        data: { brandLogoUrl: null }
      });
      
      await logAudit({
        req,
        actorId: userId,
        actorRole: req.role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "LOGO_REMOVED",
        targetType: "HospitalSettings",
        targetId: hospitalId
      });
      
      res.json({
        message: "Logo removed successfully"
      });
      
    } catch (error) {
      console.error("REMOVE LOGO ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}