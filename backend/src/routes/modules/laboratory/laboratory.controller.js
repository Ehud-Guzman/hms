// backend/src/routes/modules/laboratory/laboratory.controller.js

import { prisma } from "../../../lib/prisma.js";
import { LaboratoryService } from "./laboratory.service.js";
import {
  getPriorityColor,
  getStatusColor,
  generateOfflineId,
  validateDateRange
} from "./laboratory.utils.js";
import { logAudit } from "../../../utils/audit.js";

export class LaboratoryController {

  // ==================== TEST CATALOG CONTROLLERS ====================

  /**
   * Create lab test (admin/lab_technician only)
   */
  static async createTest(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;

      if (!hospitalId) {
        return res.status(403).json({ message: "No hospital context" });
      }

      const test = await LaboratoryService.createTest(req.body, hospitalId);

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "LAB_TEST_CREATED",
        targetType: "LabTest",
        targetId: test.id,
        metadata: {
          name: test.name,
          code: test.code,
          category: test.category
        }
      });

      res.status(201).json({
        message: "Lab test created successfully",
        test
      });

    } catch (error) {
      console.error("CREATE TEST ERROR:", error);

      if (error.message.includes("already exists")) {
        return res.status(409).json({ message: error.message });
      }

      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  /**
   * Get test by ID (all authenticated users)
   */
  static async getTest(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const userId = req.user.id; // for future use if needed

      const test = await LaboratoryService.getTestById(id, hospitalId, role, userId);

      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }

      res.json({ test });

    } catch (error) {
      console.error("GET TEST ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Update test (admin/lab_technician only)
   */
  static async updateTest(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;

      const test = await LaboratoryService.updateTest(id, hospitalId, req.body, role, userId);

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "LAB_TEST_UPDATED",
        targetType: "LabTest",
        targetId: test.id,
        metadata: {
          name: test.name,
          changes: Object.keys(req.body)
        }
      });

      res.json({
        message: "Lab test updated successfully",
        test
      });

    } catch (error) {
      console.error("UPDATE TEST ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * List tests (all authenticated users)
   */
  static async listTests(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role;
      const userId = req.user.id; // for future use

      const {
        search,
        category,
        departmentId,
        isActive,
        page,
        limit,
        sortBy,
        sortOrder
      } = req.query;

      const result = await LaboratoryService.listTests({
        hospitalId,
        role,
        userId,
        search,
        category,
        departmentId,
        isActive: isActive !== 'false',
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        sortBy: sortBy || 'name',
        sortOrder: sortOrder || 'asc'
      });

      res.json(result);

    } catch (error) {
      console.error("LIST TESTS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Delete/deactivate test (admin/lab_technician only)
   */
  static async deleteTest(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;

      const test = await prisma.labTest.update({
        where: {
          id,
          hospitalId
        },
        data: { isActive: false }
      });

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "LAB_TEST_DEACTIVATED",
        targetType: "LabTest",
        targetId: test.id,
        metadata: {
          name: test.name,
          code: test.code
        }
      });

      res.json({
        message: "Lab test deactivated successfully"
      });

    } catch (error) {
      console.error("DELETE TEST ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get test categories (all authenticated users)
   */
  static async getCategories(req, res) {
    try {
      const hospitalId = req.hospitalId;

      const categories = await LaboratoryService.getCategories(hospitalId);

      res.json({ categories });

    } catch (error) {
      console.error("GET CATEGORIES ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // ==================== LAB ORDER CONTROLLERS ====================

  /**
   * Create lab order (doctor, lab_technician, admin)
   */
  static async createOrder(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const hospital = req.hospital;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId; // for doctors, this is their ID

      if (!hospitalId) {
        return res.status(403).json({ message: "No hospital context" });
      }

      const { patientId, doctorId: requestDoctorId, testId } = req.body;

      if (!patientId || !requestDoctorId || !testId) {
        return res.status(400).json({
          message: "Patient ID, Doctor ID, and Test ID are required"
        });
      }

      // If user is a doctor, they can only create orders for themselves as the requesting doctor
      if (role === 'DOCTOR' && requestDoctorId !== doctorId) {
        return res.status(403).json({ message: "Doctors can only create orders for themselves as the requesting doctor" });
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

      const order = await LaboratoryService.createOrder(
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
        action: "LAB_ORDER_CREATED",
        targetType: "LabOrder",
        targetId: order.id,
        metadata: {
          orderNumber: order.orderNumber,
          patientId,
          testId
        }
      });

      res.status(201).json({
        message: "Lab order created successfully",
        order
      });

    } catch (error) {
      console.error("CREATE ORDER ERROR:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }

      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  /**
   * Get order by ID (with RBAC)
   */
  static async getOrder(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId; // for doctors
      const userId = req.user.id; // for lab techs

      const order = await LaboratoryService.getOrderById(id, hospitalId, role, doctorId, userId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json({ order });

    } catch (error) {
      console.error("GET ORDER ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get order by number (with RBAC)
   */
  static async getOrderByNumber(req, res) {
    try {
      const { orderNumber } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;
      const userId = req.user.id;

      const order = await LaboratoryService.getOrderByNumber(orderNumber, hospitalId, role, doctorId, userId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json({ order });

    } catch (error) {
      console.error("GET ORDER BY NUMBER ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * List orders (with RBAC)
   */
  static async listOrders(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId; // for doctors
      const userId = req.user.id; // for lab techs

      const {
        patientId,
        doctorId: queryDoctorId,
        testId,
        status,
        priority,
        fromDate,
        toDate,
        search,
        page,
        limit,
        sortBy,
        sortOrder
      } = req.query;

      // Validate date range if provided
      if (fromDate && toDate) {
        const rangeCheck = validateDateRange(fromDate, toDate);
        if (!rangeCheck.valid) {
          return res.status(400).json({ message: rangeCheck.message });
        }
      }

      const result = await LaboratoryService.listOrders({
        hospitalId,
        role,
        currentDoctorId: doctorId,
        currentUserId: userId,
        patientId,
        doctorId: queryDoctorId,
        testId,
        status,
        priority,
        fromDate,
        toDate,
        search,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc'
      });

      res.json(result);

    } catch (error) {
      console.error("LIST ORDERS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Update order status (lab_technician/admin only)
   */
  static async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, ...data } = req.body;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const validStatuses = ['ORDERED', 'COLLECTED', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REJECTED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const order = await LaboratoryService.updateOrderStatus(
        id,
        hospitalId,
        status,
        userId,
        role,
        data
      );

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: `LAB_ORDER_${status}`,
        targetType: "LabOrder",
        targetId: order.id,
        metadata: {
          orderNumber: order.orderNumber,
          status
        }
      });

      res.json({
        message: `Order status updated to ${status}`,
        order
      });

    } catch (error) {
      console.error("UPDATE ORDER STATUS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get pending counts (all authenticated users)
   */
  static async getPendingCounts(req, res) {
    try {
      const hospitalId = req.hospitalId;

      const counts = await LaboratoryService.getPendingCounts(hospitalId);

      res.json({ counts });

    } catch (error) {
      console.error("GET PENDING COUNTS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // ==================== RESULTS CONTROLLERS ====================

  /**
   * Enter results (lab_technician/admin only)
   */
  static async enterResults(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;

      const { resultData, reportFile, notes, verifiedBy, verifiedAt } = req.body;

      if (!resultData) {
        return res.status(400).json({ message: "Result data is required" });
      }

      const result = await LaboratoryService.enterResults(
        id,
        hospitalId,
        { resultData, reportFile, notes, verifiedBy, verifiedAt },
        userId,
        role
      );

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "LAB_RESULTS_ENTERED",
        targetType: "LabOrder",
        targetId: id,
        metadata: {
          orderId: id,
          isAbnormal: result.result?.isAbnormal
        }
      });

      res.json({
        message: "Results entered successfully",
        ...result
      });

    } catch (error) {
      console.error("ENTER RESULTS ERROR:", error);

      if (error.message.includes("already has results")) {
        return res.status(409).json({ message: error.message });
      }

      if (error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }

      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Verify results (lab_technician/admin only – maybe senior tech)
   */
  static async verifyResults(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;

      const order = await LaboratoryService.verifyResults(id, hospitalId, userId, role);

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "LAB_RESULTS_VERIFIED",
        targetType: "LabOrder",
        targetId: order.id,
        metadata: {
          orderNumber: order.orderNumber
        }
      });

      res.json({
        message: "Results verified successfully",
        order
      });

    } catch (error) {
      console.error("VERIFY RESULTS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get patient lab history (with RBAC)
   */
  static async getPatientLabHistory(req, res) {
    try {
      const { patientId } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId; // for doctors
      const { limit } = req.query;

      const orders = await LaboratoryService.getPatientLabHistory(
        patientId,
        hospitalId,
        role,
        doctorId,
        parseInt(limit) || 20
      );

      res.json({ orders });

    } catch (error) {
      console.error("GET PATIENT LAB HISTORY ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get laboratory statistics (admin only – already in route)
   */
  static async getLabStats(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role;

      const stats = await LaboratoryService.getLabStats(hospitalId, role);

      res.json({ stats });

    } catch (error) {
      console.error("LAB STATS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Search tests (quick lookup) – all authenticated users
   */
  static async searchTests(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const { q } = req.query;

      if (!q || q.length < 2) {
        return res.json({ tests: [] });
      }

      const tests = await prisma.labTest.findMany({
        where: {
          hospitalId,
          isActive: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { code: { contains: q, mode: 'insensitive' } },
            { category: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: 10,
        select: {
          id: true,
          name: true,
          code: true,
          category: true,
          price: true,
          preparation: true
        }
      });

      res.json({ tests });

    } catch (error) {
      console.error("SEARCH TESTS ERROR:", error);
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

      const results = await LaboratoryService.syncOffline(data, hospitalId, userId, role, doctorId);

      res.json({
        message: `${results.length} items synced`,
        results,
        syncStatus: "COMPLETED"
      });

    } catch (error) {
      console.error("SYNC LAB ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}