// backend/src/routes/modules/pharmacy/pharmacy.controller.js

import { prisma } from "../../../lib/prisma.js";
import { PharmacyService } from "./pharmacy.service.js";
import {
  formatMedicineName,
  getExpiryStatus,
  isLowStock,
  generateOfflineId
} from "./pharmacy.utils.js";
import { logAudit } from "../../../utils/audit.js";

export class PharmacyController {

  // ==================== INVENTORY CONTROLLERS ====================

  /**
   * Create inventory item (pharmacist/admin only)
   */
  static async createItem(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const hospital = req.hospital;
      const userId = req.user.id;
      const role = req.role;

      if (!hospitalId) {
        return res.status(403).json({ message: "No hospital context" });
      }

      const item = await PharmacyService.createItem(req.body, hospitalId, hospital.code, role, userId);

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "PHARMACY_ITEM_CREATED",
        targetType: "PharmacyItem",
        targetId: item.id,
        metadata: {
          drugCode: item.drugCode,
          genericName: item.genericName
        }
      });

      res.status(201).json({
        message: "Inventory item created successfully",
        item
      });

    } catch (error) {
      console.error("CREATE ITEM ERROR:", error);
      if (error.message.includes("Access denied")) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  /**
   * Get item by ID (all authenticated users)
   */
  static async getItem(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const userId = req.user.id;

      const item = await PharmacyService.getItemById(id, hospitalId, role, userId);

      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      res.json({ item });

    } catch (error) {
      console.error("GET ITEM ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Update item (pharmacist/admin only)
   */
  static async updateItem(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;

      const item = await PharmacyService.updateItem(id, hospitalId, req.body, role, userId);

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "PHARMACY_ITEM_UPDATED",
        targetType: "PharmacyItem",
        targetId: item.id,
        metadata: {
          drugCode: item.drugCode,
          changes: Object.keys(req.body)
        }
      });

      res.json({
        message: "Item updated successfully",
        item
      });

    } catch (error) {
      console.error("UPDATE ITEM ERROR:", error);
      if (error.message.includes("Access denied")) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * List inventory (all authenticated users, but filtered by role? – all can view items)
   */
  static async listItems(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role;
      const userId = req.user.id;

      const {
        search,
        category,
        lowStock,
        expiring,
        isActive,
        page,
        limit,
        sortBy,
        sortOrder
      } = req.query;

      const result = await PharmacyService.listItems({
        hospitalId,
        role,
        userId,
        search,
        category,
        lowStock: lowStock === 'true',
        expiring: expiring === 'true',
        isActive: isActive !== 'false',
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        sortBy: sortBy || 'genericName',
        sortOrder: sortOrder || 'asc'
      });

      res.json(result);

    } catch (error) {
      console.error("LIST ITEMS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Delete/deactivate item (pharmacist/admin only)
   */
  static async deleteItem(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;

      const item = await PharmacyService.deleteItem(id, hospitalId, role, userId);

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "PHARMACY_ITEM_DEACTIVATED",
        targetType: "PharmacyItem",
        targetId: item.id,
        metadata: {
          drugCode: item.drugCode,
          genericName: item.genericName
        }
      });

      res.json({
        message: "Item deactivated successfully"
      });

    } catch (error) {
      console.error("DELETE ITEM ERROR:", error);
      if (error.message.includes("Access denied")) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Adjust stock (pharmacist/admin only)
   */
  static async adjustStock(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;

      const { type, quantity, notes, reference, pharmacistId } = req.body;

      if (!type || !quantity) {
        return res.status(400).json({ message: "Type and quantity are required" });
      }

      const result = await PharmacyService.adjustStock(
        id,
        hospitalId,
        { type, quantity, notes, reference, pharmacistId },
        userId,
        role
      );

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: `PHARMACY_STOCK_${type}`,
        targetType: "PharmacyItem",
        targetId: result.item.id,
        metadata: {
          quantity,
          newStock: result.item.quantityInStock
        }
      });

      res.json({
        message: `Stock ${type.toLowerCase()} successfully`,
        ...result
      });

    } catch (error) {
      console.error("ADJUST STOCK ERROR:", error);

      if (error.message.includes("Insufficient stock")) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes("Access denied")) {
        return res.status(403).json({ message: error.message });
      }

      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get low stock alerts (pharmacist/admin only)
   */
  static async getLowStockAlerts(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role;

      const alerts = await PharmacyService.getLowStockAlerts(hospitalId, role);

      res.json({
        total: alerts.length,
        alerts
      });

    } catch (error) {
      console.error("LOW STOCK ALERTS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get expiring items (pharmacist/admin only)
   */
  static async getExpiringItems(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role;
      const { months } = req.query;

      const items = await PharmacyService.getExpiringItems(hospitalId, parseInt(months) || 3, role);

      res.json({
        total: items.length,
        items
      });

    } catch (error) {
      console.error("EXPIRING ITEMS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // ==================== PRESCRIPTION CONTROLLERS ====================

  /**
   * Create prescription (doctor/admin only)
   */
  static async createPrescription(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const hospital = req.hospital;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId; // if user is a doctor

      if (!hospitalId) {
        return res.status(403).json({ message: "No hospital context" });
      }

      const { patientId, doctorId: requestDoctorId, items } = req.body;

      if (!patientId || !requestDoctorId || !items || !items.length) {
        return res.status(400).json({
          message: "Patient ID, Doctor ID, and at least one medication are required"
        });
      }

      // If user is a doctor, they must be the doctor on the prescription
      if (role === 'DOCTOR' && requestDoctorId !== doctorId) {
        return res.status(403).json({ message: "Doctors can only create prescriptions for themselves as the prescribing doctor" });
      }

      // Verify patient exists
      const patient = await prisma.patient.findFirst({
        where: { id: patientId, hospitalId }
      });

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Verify doctor exists
      const doctor = await prisma.doctor.findFirst({
        where: { id: requestDoctorId, hospitalId }
      });

      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      const prescription = await PharmacyService.createPrescription(
        req.body,
        hospitalId,
        hospital.code,
        userId,
        role,
        doctorId
      );

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "PRESCRIPTIONS_CREATED",
        targetType: "Prescription",
        targetId: prescription.id,
        metadata: {
          patientId,
          doctorId: requestDoctorId,
          itemCount: items.length
        }
      });

      res.status(201).json({
        message: "Prescription created successfully",
        prescription
      });

    } catch (error) {
      console.error("CREATE PRESCRIPTION ERROR:", error);

      if (error.message.includes("Insufficient stock")) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes("Access denied")) {
        return res.status(403).json({ message: error.message });
      }

      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  /**
   * Get prescription by ID (with RBAC)
   */
  static async getPrescription(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;
      const patientId = req.patientId;
      const userId = req.user.id; // for pharmacist check

      const prescription = await PharmacyService.getPrescriptionById(id, hospitalId, role, doctorId, patientId, userId);

      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }

      res.json({ prescription });

    } catch (error) {
      console.error("GET PRESCRIPTION ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * List prescriptions (with RBAC)
   */
  static async listPrescriptions(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;
      const patientId = req.patientId;
      const userId = req.user.id;

      const {
        patientId: queryPatientId,
        doctorId: queryDoctorId,
        status,
        fromDate,
        toDate,
        page,
        limit
      } = req.query;

      const result = await PharmacyService.listPrescriptions({
        hospitalId,
        role,
        currentDoctorId: doctorId,
        currentPatientId: patientId,
        currentUserId: userId,
        patientId: queryPatientId,
        doctorId: queryDoctorId,
        status,
        fromDate,
        toDate,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      });

      res.json(result);

    } catch (error) {
      console.error("LIST PRESCRIPTIONS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Dispense prescription (pharmacist/admin only)
   */
  static async dispensePrescription(req, res) {
    try {
      const { id } = req.params;
      const { pharmacistId } = req.body;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;

      if (!pharmacistId) {
        return res.status(400).json({ message: "Pharmacist ID is required" });
      }

      const prescription = await PharmacyService.dispensePrescription(
        id,
        hospitalId,
        pharmacistId,
        userId,
        role
      );

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "PRESCRIPTIONS_DISPENSED",
        targetType: "Prescription",
        targetId: prescription.id,
        metadata: {
          patientId: prescription.patientId,
          pharmacistId
        }
      });

      res.json({
        message: "Prescription dispensed successfully",
        prescription
      });

    } catch (error) {
      console.error("DISPENSE PRESCRIPTION ERROR:", error);

      if (error.message.includes("Insufficient stock")) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("Access denied")) {
        return res.status(403).json({ message: error.message });
      }

      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Partially dispense prescription (pharmacist/admin only)
   */
  static async partiallyDispense(req, res) {
    try {
      const { id } = req.params;
      const { pharmacistId, items } = req.body;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;

      if (!pharmacistId || !items || !items.length) {
        return res.status(400).json({ message: "Pharmacist ID and items are required" });
      }

      const prescription = await PharmacyService.partiallyDispense(
        id,
        hospitalId,
        pharmacistId,
        userId,
        items,
        role
      );

      res.json({
        message: "Prescription partially dispensed",
        prescription
      });

    } catch (error) {
      console.error("PARTIAL DISPENSE ERROR:", error);
      if (error.message.includes("Access denied")) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Cancel prescription (doctor/pharmacist/admin only)
   */
  static async cancelPrescription(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;

      const prescription = await PharmacyService.cancelPrescription(id, hospitalId, reason, role, doctorId, userId);

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "PRESCRIPTIONS_CANCELLED",
        targetType: "Prescription",
        targetId: prescription.id,
        metadata: { reason }
      });

      res.json({
        message: "Prescription cancelled",
        prescription
      });

    } catch (error) {
      console.error("CANCEL PRESCRIPTION ERROR:", error);
      if (error.message.includes("Access denied")) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get patient prescriptions (with RBAC)
   */
  static async getPatientPrescriptions(req, res) {
    try {
      const { patientId } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;
      const currentPatientId = req.patientId;
      const { limit } = req.query;

      const prescriptions = await PharmacyService.getPatientPrescriptions(
        patientId,
        hospitalId,
        role,
        doctorId,
        currentPatientId,
        parseInt(limit) || 10
      );

      res.json({ prescriptions });

    } catch (error) {
      console.error("GET PATIENT PRESCRIPTIONS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get prescription statistics (admin only)
   */
  static async getPrescriptionStats(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role;

      const stats = await PharmacyService.getPrescriptionStats(hospitalId, role);

      res.json({ stats });

    } catch (error) {
      console.error("PRESCRIPTION STATS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get inventory statistics (admin/pharmacist only)
   */
  static async getInventoryStats(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role;

      const stats = await PharmacyService.getInventoryStats(hospitalId, role);

      res.json({ stats });

    } catch (error) {
      console.error("INVENTORY STATS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Search medications (all authenticated users)
   */
  static async searchMedications(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const { q } = req.query;

      if (!q || q.length < 2) {
        return res.json({ medications: [] });
      }

      const medications = await prisma.pharmacyItem.findMany({
        where: {
          hospitalId,
          isActive: true,
          OR: [
            { genericName: { contains: q, mode: 'insensitive' } },
            { brandName: { contains: q, mode: 'insensitive' } },
            { drugCode: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: 10,
        select: {
          id: true,
          drugCode: true,
          genericName: true,
          brandName: true,
          form: true,
          strength: true,
          unit: true,
          quantityInStock: true,
          sellingPrice: true,
          requiresPrescription: true
        }
      });

      res.json({ medications });

    } catch (error) {
      console.error("SEARCH MEDICATIONS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Sync offline data (with RBAC)
   */
  static async syncOffline(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;

      const data = Array.isArray(req.body) ? req.body : [req.body];

      const results = await PharmacyService.syncOffline(data, hospitalId, userId, role, doctorId);

      res.json({
        message: `${results.length} items synced`,
        results,
        syncStatus: "COMPLETED"
      });

    } catch (error) {
      console.error("SYNC PHARMACY ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}