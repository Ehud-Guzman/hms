// backend/src/modules/settings/settings.controller.js

import { prisma } from "../../../lib/prisma.js";
import { SettingsService } from "./settings.service.js";
import { sanitizeSettings } from "./settings.utils.js";
import { logAudit } from "../../../utils/audit.js";

export class SettingsController {

  /**
   * Get all settings for the current hospital.
   */
  static async getSettings(req, res) {
    try {
      const hospitalId = req.hospitalId; // guaranteed by requireTenant (except SYSTEM_ADMIN without tenant – but that's blocked)
      const userRole = req.role;

      // hospitalId is required – if missing, requireTenant would have blocked, but double-check
      if (!hospitalId) {
        return res.status(403).json({ message: "Hospital context required" });
      }

      const settings = await SettingsService.getSettings(hospitalId, userRole);
      const sanitized = sanitizeSettings(settings, userRole);

      res.json({
        settings: sanitized,
        version: '1.0'
      });

    } catch (error) {
      console.error("GET SETTINGS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Update settings for the current hospital.
   */
  static async updateSettings(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const userRole = req.role;

      if (!hospitalId) {
        return res.status(403).json({ message: "Hospital context required" });
      }

      const settings = await SettingsService.updateSettings(
        hospitalId,
        req.body,
        userId,
        userRole
      );

      await logAudit({
        req,
        actorId: userId,
        actorRole: userRole,
        actorEmail: req.userEmail,
        hospitalId,
        action: "SETTINGS_UPDATED",
        targetType: "HospitalSettings",
        targetId: hospitalId
      });

      res.json({
        message: "Settings updated successfully",
        settings
      });

    } catch (error) {
      console.error("UPDATE SETTINGS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get list of hospitals accessible to the current user.
   * - SYSTEM_ADMIN: all active hospitals.
   * - Other roles: only the hospital they belong to (if any).
   */
  static async getHospitals(req, res) {
    try {
      const userRole = req.role;
      const hospitalId = req.hospitalId; // may be null for SYSTEM_ADMIN

      // Use the service to keep logic centralized
      const hospitals = await SettingsService.getHospitals(userRole, hospitalId);

      res.json({ hospitals });
    } catch (error) {
      console.error("GET HOSPITALS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Reset settings to defaults.
   */
  static async resetSettings(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const userRole = req.role;

      if (!hospitalId) {
        return res.status(403).json({ message: "Hospital context required" });
      }

      const settings = await SettingsService.resetSettings(hospitalId, userId, userRole);

      await logAudit({
        req,
        actorId: userId,
        actorRole: userRole,
        actorEmail: req.userEmail,
        hospitalId,
        action: "SETTINGS_RESET",
        targetType: "HospitalSettings",
        targetId: hospitalId
      });

      res.json({
        message: "Settings reset to defaults",
        settings
      });

    } catch (error) {
      console.error("RESET SETTINGS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get feature flags.
   */
  static async getFeatures(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userRole = req.role;

      if (!hospitalId) {
        return res.status(403).json({ message: "Hospital context required" });
      }

      const features = await SettingsService.getFeatureFlags(hospitalId, userRole);

      res.json({ features });

    } catch (error) {
      console.error("GET FEATURES ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Update feature flags.
   */
  static async updateFeatures(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const userRole = req.role;

      if (!hospitalId) {
        return res.status(403).json({ message: "Hospital context required" });
      }

      const features = await SettingsService.updateFeatureFlags(
        hospitalId,
        req.body,
        userId,
        userRole
      );

      await logAudit({
        req,
        actorId: userId,
        actorRole: userRole,
        actorEmail: req.userEmail,
        hospitalId,
        action: "FEATURES_UPDATED",
        targetType: "HospitalSettings",
        targetId: hospitalId,
        metadata: { features: req.body }
      });

      res.json({
        message: "Feature flags updated",
        features
      });

    } catch (error) {
      console.error("UPDATE FEATURES ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Export settings (backup).
   */
  static async exportSettings(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userRole = req.role;

      if (!hospitalId) {
        return res.status(403).json({ message: "Hospital context required" });
      }

      const exportData = await SettingsService.exportSettings(hospitalId, userRole);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=settings-${hospitalId}.json`);

      res.json(exportData);

    } catch (error) {
      console.error("EXPORT SETTINGS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Import settings (restore from backup).
   */
  static async importSettings(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const userRole = req.role;

      if (!hospitalId) {
        return res.status(403).json({ message: "Hospital context required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No backup file uploaded" });
      }

      const backupData = JSON.parse(req.file.buffer.toString());

      await SettingsService.importSettings(hospitalId, backupData, userId, userRole);

      await logAudit({
        req,
        actorId: userId,
        actorRole: userRole,
        actorEmail: req.userEmail,
        hospitalId,
        action: "SETTINGS_IMPORTED",
        targetType: "HospitalSettings",
        targetId: hospitalId
      });

      res.json({
        message: "Settings imported successfully"
      });

    } catch (error) {
      console.error("IMPORT SETTINGS ERROR:", error);

      if (error.message.includes("Invalid backup")) {
        return res.status(400).json({ message: error.message });
      }

      res.status(500).json({ message: "Server error" });
    }
  }
}