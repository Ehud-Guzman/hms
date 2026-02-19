// backend/src/modules/settings/settings.service.js

import { prisma } from '../../../lib/prisma.js';
import { getDefaultSettings, mergeWithDefaults, calculateSettingsHash } from './settings.utils.js';

export class SettingsService {

  /**
   * Get all hospitals accessible to the current user (used in dropdown).
   * @param {string} role - User role (SYSTEM_ADMIN, HOSPITAL_ADMIN, etc.)
   * @param {string|null} hospitalId - User's hospital ID (if any)
   * @returns {Promise<Array>} List of hospitals
   */
  static async getHospitals(role, hospitalId) {
    if (role === 'SYSTEM_ADMIN') {
      // Return all active hospitals
      return prisma.hospital.findMany({
        where: { isActive: true },
        select: { id: true, name: true, code: true, isActive: true },
        orderBy: { name: 'asc' }
      });
    } else {
      // For non‑admin users, return only their assigned hospital
      if (!hospitalId) {
        return [];
      }
      const hospital = await prisma.hospital.findUnique({
        where: { id: hospitalId },
        select: { id: true, name: true, code: true, isActive: true }
      });
      return hospital ? [hospital] : [];
    }
  }

  /**
   * Get settings for a hospital.
   * @param {string} hospitalId - Hospital ID
   * @param {string} role - User role (passed for audit/logging)
   * @returns {Promise<Object>} Settings object
   */
  static async getSettings(hospitalId, role) {
    try {
      console.log(`[SettingsService] Fetching settings for hospital: ${hospitalId}`);

      // Verify hospital exists
      const hospital = await prisma.hospital.findUnique({
        where: { id: hospitalId },
        select: { id: true }
      });
      if (!hospital) {
        throw new Error(`Hospital with ID ${hospitalId} not found`);
      }

      let settings = await prisma.hospitalSettings.findUnique({
        where: { hospitalId }
      });

      if (!settings) {
        console.log(`[SettingsService] No settings found for hospital ${hospitalId}, creating defaults`);
        settings = await this.createDefaultSettings(hospitalId);
      }

      return settings;
    } catch (error) {
      console.error('========== SETTINGS SERVICE ERROR ==========');
      console.error('Hospital ID:', hospitalId);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      if (error.code) console.error('Error code:', error.code);
      if (error.meta) console.error('Error meta:', error.meta);
      console.error('Stack:', error.stack);
      console.error('============================================');
      throw new Error(`Failed to retrieve settings: ${error.message}`);
    }
  }

  /**
   * Create default settings for a hospital.
   * @param {string} hospitalId - Hospital ID
   * @returns {Promise<Object>} Created settings
   */
  static async createDefaultSettings(hospitalId) {
    const defaults = getDefaultSettings();
    return prisma.hospitalSettings.create({
      data: {
        hospitalId,
        defaultSlotDuration: defaults.appointments.defaultSlotDuration,
        allowWalkIns: defaults.appointments.allowWalkIns,
        requirePrepayment: defaults.appointments.requirePrepayment,
        allowOnlineBooking: defaults.appointments.allowOnlineBooking,
        maxAdvanceBooking: defaults.appointments.maxAdvanceBooking,
        businessHours: defaults.businessHours,
        smsNotifications: defaults.notifications.sms.enabled,
        emailNotifications: defaults.notifications.email.enabled,
        brandLogoUrl: defaults.branding.logoUrl,
        brandPrimaryColor: defaults.branding.primaryColor,
        brandSecondaryColor: defaults.branding.secondaryColor,
        themeKey: defaults.branding.theme,
        density: defaults.branding.density,
        radius: defaults.branding.borderRadius,
        printShowLogo: true,
        printHeaderText: null,
        printFooterText: null,
        features: defaults.features || {}
      }
    });
  }

  /**
   * Update hospital settings.
   * @param {string} hospitalId - Hospital ID
   * @param {Object} updates - Updated settings
   * @param {string} userId - ID of user making the change
   * @param {string} role - User role (for logging)
   * @returns {Promise<Object>} Updated settings
   */
  static async updateSettings(hospitalId, updates, userId, role) {
    const current = await this.getSettings(hospitalId, role);
    const changes = this.detectChanges(current, updates);

    const updated = await prisma.hospitalSettings.update({
      where: { hospitalId },
      data: {
        defaultSlotDuration: updates.appointments?.defaultSlotDuration,
        allowWalkIns: updates.appointments?.allowWalkIns,
        requirePrepayment: updates.appointments?.requirePrepayment,
        allowOnlineBooking: updates.appointments?.allowOnlineBooking,
        maxAdvanceBooking: updates.appointments?.maxAdvanceBooking,
        businessHours: updates.businessHours,
        smsNotifications: updates.notifications?.sms?.enabled,
        emailNotifications: updates.notifications?.email?.enabled,
        brandLogoUrl: updates.branding?.logoUrl,
        brandPrimaryColor: updates.branding?.primaryColor,
        brandSecondaryColor: updates.branding?.secondaryColor,
        themeKey: updates.branding?.theme,
        density: updates.branding?.density,
        radius: updates.branding?.borderRadius,
        printShowLogo: updates.branding?.printShowLogo,
        printHeaderText: updates.branding?.printHeaderText,
        printFooterText: updates.branding?.printFooterText,
        features: updates.features || current.features
      }
    });

    await this.logSettingsChange(hospitalId, userId, changes);

    return this.getSettings(hospitalId, role);
  }

  /**
   * Detect changes between old and new settings.
   */
static detectChanges(oldSettings = {}, newSettings = {}) {
  if (typeof newSettings !== 'object' || newSettings === null) {
    return [];
  }

  const changes = [];

  try {
    const oldHash = calculateSettingsHash(oldSettings || {});
    const newHash = calculateSettingsHash(newSettings || {});

    if (oldHash !== newHash) {
      Object.keys(newSettings || {}).forEach(category => {
        const newCategory = newSettings[category];
        const oldCategory = oldSettings?.[category];

        if (newCategory && typeof newCategory === 'object') {
          Object.keys(newCategory).forEach(field => {
            if (JSON.stringify(oldCategory?.[field]) !== JSON.stringify(newCategory[field])) {
              changes.push(`${category}.${field}`);
            }
          });
        }
      });
    }
  } catch (err) {
    console.error("detectChanges error:", err);
    return [];
  }

  return changes;
}


  /**
   * Log hospital settings changes.
   */
  static async logSettingsChange(hospitalId, userId, changes) {
    if (!changes || changes.length === 0) return;
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        hospitalId,
        action: 'SETTINGS_UPDATED',
        targetType: 'HospitalSettings',
        targetId: hospitalId,
        metadata: { changes }
      }
    });
  }

  /**
   * Reset hospital settings to defaults.
   */
  static async resetSettings(hospitalId, userId, role) {
    const defaults = getDefaultSettings();
    await prisma.hospitalSettings.update({
      where: { hospitalId },
      data: {
        defaultSlotDuration: defaults.appointments.defaultSlotDuration,
        allowWalkIns: defaults.appointments.allowWalkIns,
        requirePrepayment: defaults.appointments.requirePrepayment,
        allowOnlineBooking: defaults.appointments.allowOnlineBooking,
        maxAdvanceBooking: defaults.appointments.maxAdvanceBooking,
        businessHours: defaults.businessHours,
        smsNotifications: defaults.notifications.sms.enabled,
        emailNotifications: defaults.notifications.email.enabled,
        brandLogoUrl: null,
        brandPrimaryColor: defaults.branding.primaryColor,
        brandSecondaryColor: defaults.branding.secondaryColor,
        themeKey: defaults.branding.theme,
        density: defaults.branding.density,
        radius: defaults.branding.borderRadius,
        features: defaults.features || {}
      }
    });

    await this.logSettingsChange(hospitalId, userId, ['RESET_TO_DEFAULTS']);
    return this.getSettings(hospitalId, role);
  }

  /**
   * Get feature flags.
   */
  static async getFeatureFlags(hospitalId, role) {
    const settings = await this.getSettings(hospitalId, role);
    return settings.features || {};
  }

  /**
   * Update feature flags.
   */
  static async updateFeatureFlags(hospitalId, features, userId, role) {
    const settings = await this.getSettings(hospitalId, role);
    const updatedFeatures = { ...settings.features, ...features };

    await prisma.hospitalSettings.update({
      where: { hospitalId },
      data: { features: updatedFeatures }
    });

    await this.logSettingsChange(hospitalId, userId, ['FEATURE_FLAGS_UPDATED']);
    return updatedFeatures;
  }

  /**
   * Check if a feature is enabled.
   */
  static async isFeatureEnabled(hospitalId, feature, role) {
    const features = await this.getFeatureFlags(hospitalId, role);
    return features[feature] === true;
  }

  /**
   * Export hospital settings (backup).
   */
  static async exportSettings(hospitalId, role) {
    const settings = await this.getSettings(hospitalId, role);
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: { name: true, code: true }
    });

    return {
      hospital,
      settings,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  /**
   * Import hospital settings (restore).
   */
  static async importSettings(hospitalId, data, userId, role) {
    if (!data.settings || !data.version) {
      throw new Error('Invalid backup file');
    }

    await this.updateSettings(hospitalId, data.settings, userId, role);
    await this.logSettingsChange(hospitalId, userId, ['IMPORTED_BACKUP']);
    return { success: true, importedAt: new Date() };
  }
}