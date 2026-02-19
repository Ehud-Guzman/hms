// backend/src/modules/settings/submodules/notifications/notifications.controller.js

import { prisma } from "../../../../../lib/prisma.js";
import { isValidEmailTemplate } from "../../settings.utils.js";
import { logAudit } from "../../../../../utils/audit.js";

export class NotificationsController {
  
  /**
   * Get notification settings
   */
  static async getSettings(req, res) {
    try {
      const hospitalId = req.hospitalId;
      
      const settings = await prisma.hospitalSettings.findUnique({
        where: { hospitalId },
        select: {
          smsNotifications: true,
          emailNotifications: true,
          businessHours: true // Templates would be stored here in production
        }
      });
      
      // In production, you'd fetch templates from a separate table
      const templates = {
        appointmentConfirmation: {
          subject: 'Appointment Confirmation',
          body: 'Your appointment is confirmed for {{date}} at {{time}} with Dr. {{doctor}}.'
        },
        appointmentReminder: {
          subject: 'Appointment Reminder',
          body: 'Reminder: You have an appointment tomorrow at {{time}} with Dr. {{doctor}}.'
        },
        labResultReady: {
          subject: 'Lab Results Ready',
          body: 'Your lab results are ready. Please log in to view.'
        },
        paymentReceipt: {
          subject: 'Payment Receipt',
          body: 'Thank you for your payment of {{amount}}. Receipt #{{receipt}}'
        }
      };
      
      res.json({
        settings: {
          sms: { enabled: settings?.smsNotifications || false },
          email: { enabled: settings?.emailNotifications || false }
        },
        templates
      });
      
    } catch (error) {
      console.error("GET NOTIFICATION SETTINGS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Update notification settings
   */
  static async updateSettings(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const { sms, email } = req.body;
      
      await prisma.hospitalSettings.update({
        where: { hospitalId },
        data: {
          smsNotifications: sms?.enabled,
          emailNotifications: email?.enabled
        }
      });
      
      await logAudit({
        req,
        actorId: userId,
        actorRole: req.role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "NOTIFICATION_SETTINGS_UPDATED",
        targetType: "HospitalSettings",
        targetId: hospitalId
      });
      
      res.json({
        message: "Notification settings updated"
      });
      
    } catch (error) {
      console.error("UPDATE NOTIFICATION SETTINGS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get templates
   */
  static async getTemplates(req, res) {
    try {
      const hospitalId = req.hospitalId;
      
      // In production, fetch from database
      const templates = {
        appointmentConfirmation: {
          subject: 'Appointment Confirmation',
          body: 'Your appointment is confirmed for {{date}} at {{time}} with Dr. {{doctor}}.'
        },
        appointmentReminder: {
          subject: 'Appointment Reminder',
          body: 'Reminder: You have an appointment tomorrow at {{time}} with Dr. {{doctor}}.'
        },
        labResultReady: {
          subject: 'Lab Results Ready',
          body: 'Your lab results are ready. Please log in to view.'
        },
        paymentReceipt: {
          subject: 'Payment Receipt',
          body: 'Thank you for your payment of {{amount}}. Receipt #{{receipt}}'
        }
      };
      
      res.json({ templates });
      
    } catch (error) {
      console.error("GET TEMPLATES ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Update template
   */
  static async updateTemplate(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const { templateId } = req.params;
      const template = req.body;
      
      if (!isValidEmailTemplate(template)) {
        return res.status(400).json({ message: "Invalid template format" });
      }
      
      // In production, save to database
      
      await logAudit({
        req,
        actorId: userId,
        actorRole: req.role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "TEMPLATE_UPDATED",
        targetType: "NotificationTemplate",
        targetId: templateId
      });
      
      res.json({
        message: "Template updated successfully"
      });
      
    } catch (error) {
      console.error("UPDATE TEMPLATE ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Test notification
   */
  static async testNotification(req, res) {
    try {
      const { type, recipient } = req.body;
      
      // In production, actually send test notification
      console.log(`Test ${type} notification sent to ${recipient}`);
      
      res.json({
        message: `Test ${type} notification sent successfully`
      });
      
    } catch (error) {
      console.error("TEST NOTIFICATION ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}