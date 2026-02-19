// backend/src/modules/settings/submodules/business-hours/hours.controller.js

import { prisma } from "../../../../../lib/prisma.js";
import { isValidBusinessHours } from "../../settings.utils.js";
import { logAudit } from "../../../../../utils/audit.js";

export class HoursController {
  
  /**
   * Get business hours
   */
  static async getHours(req, res) {
    try {
      const hospitalId = req.hospitalId;
      
      const settings = await prisma.hospitalSettings.findUnique({
        where: { hospitalId },
        select: { businessHours: true }
      });
      
      res.json({ 
        businessHours: settings?.businessHours || null 
      });
      
    } catch (error) {
      console.error("GET HOURS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Update business hours
   */
  static async updateHours(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      
      const hours = req.body;
      
      if (!isValidBusinessHours(hours)) {
        return res.status(400).json({ message: "Invalid business hours format" });
      }
      
      const settings = await prisma.hospitalSettings.update({
        where: { hospitalId },
        data: { businessHours: hours }
      });
      
      await logAudit({
        req,
        actorId: userId,
        actorRole: req.role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "BUSINESS_HOURS_UPDATED",
        targetType: "HospitalSettings",
        targetId: hospitalId
      });
      
      res.json({
        message: "Business hours updated successfully",
        businessHours: settings.businessHours
      });
      
    } catch (error) {
      console.error("UPDATE HOURS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Add holiday
   */
  static async addHoliday(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const { date, name, description } = req.body;
      
      const settings = await prisma.hospitalSettings.findUnique({
        where: { hospitalId },
        select: { businessHours: true }
      });
      
      const businessHours = settings?.businessHours || { holidays: [] };
      const holidays = businessHours.holidays || [];
      
      // Check if holiday already exists
      const exists = holidays.some(h => h.date === date);
      if (exists) {
        return res.status(400).json({ message: "Holiday already exists for this date" });
      }
      
      holidays.push({ date, name, description });
      businessHours.holidays = holidays;
      
      await prisma.hospitalSettings.update({
        where: { hospitalId },
        data: { businessHours }
      });
      
      await logAudit({
        req,
        actorId: userId,
        actorRole: req.role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "HOLIDAY_ADDED",
        targetType: "HospitalSettings",
        targetId: hospitalId,
        metadata: { date, name }
      });
      
      res.json({
        message: "Holiday added successfully",
        holidays
      });
      
    } catch (error) {
      console.error("ADD HOLIDAY ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Remove holiday
   */
  static async removeHoliday(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const { date } = req.params;
      
      const settings = await prisma.hospitalSettings.findUnique({
        where: { hospitalId },
        select: { businessHours: true }
      });
      
      const businessHours = settings?.businessHours || { holidays: [] };
      const holidays = (businessHours.holidays || []).filter(h => h.date !== date);
      businessHours.holidays = holidays;
      
      await prisma.hospitalSettings.update({
        where: { hospitalId },
        data: { businessHours }
      });
      
      await logAudit({
        req,
        actorId: userId,
        actorRole: req.role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "HOLIDAY_REMOVED",
        targetType: "HospitalSettings",
        targetId: hospitalId,
        metadata: { date }
      });
      
      res.json({
        message: "Holiday removed successfully",
        holidays
      });
      
    } catch (error) {
      console.error("REMOVE HOLIDAY ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}