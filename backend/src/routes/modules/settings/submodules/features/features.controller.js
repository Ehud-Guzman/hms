// backend/src/modules/settings/submodules/features/features.controller.js

import { SettingsService } from "../../settings.service.js";
import { logAudit } from "../../../../../utils/audit.js";

export class FeaturesController {
  
  /**
   * Get all feature flags
   */
  static async getFeatures(req, res) {
    try {
      const hospitalId = req.hospitalId;
      
      const features = await SettingsService.getFeatureFlags(hospitalId);
      
      res.json({ features });
      
    } catch (error) {
      console.error("GET FEATURES ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Update feature flags
   */
  static async updateFeatures(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      
      const features = await SettingsService.updateFeatureFlags(
        hospitalId, 
        req.body, 
        userId
      );
      
      await logAudit({
        req,
        actorId: userId,
        actorRole: req.role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "FEATURE_FLAGS_UPDATED",
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
   * Check if a specific feature is enabled
   */
  static async checkFeature(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const { feature } = req.params;
      
      const isEnabled = await SettingsService.isFeatureEnabled(hospitalId, feature);
      
      res.json({
        feature,
        enabled: isEnabled
      });
      
    } catch (error) {
      console.error("CHECK FEATURE ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}