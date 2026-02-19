// backend/src/routes/modules/billing/billing.controller.js

import { prisma } from "../../../lib/prisma.js";
import { BillingService } from "./billing.service.js";
import {
  formatCurrency,
  getStatusColor,
  getPaymentMethodName,
  validatePayment,
  generateOfflineId
} from "./billing.utils.js";
import { logAudit } from "../../../utils/audit.js";

export class BillingController {

  // ==================== BILL CONTROLLERS ====================

  /**
   * Create bill
   */
  static async createBill(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const hospital = req.hospital;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId; // for doctors

      if (!hospitalId) {
        return res.status(403).json({ message: "No hospital context" });
      }

      const { patientId, items } = req.body;

      if (!patientId) {
        return res.status(400).json({ message: "Patient ID is required" });
      }

      if (!items || items.length === 0) {
        return res.status(400).json({ message: "Bill must have at least one item" });
      }

      // Verify patient exists
      const patient = await prisma.patient.findFirst({
        where: { id: patientId, hospitalId }
      });

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Permission: doctors can only create bills for patients they have treated?
      // We'll check by seeing if there is an appointment or admission with this doctor.
      // For simplicity, we'll allow doctors to create bills for any patient (since they might treat new patients).
      // If stricter control needed, add a check here.

      const bill = await BillingService.createBill(
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
        action: "BILL_CREATED",
        targetType: "Bill",
        targetId: bill.id,
        metadata: {
          billNumber: bill.billNumber,
          amount: bill.total,
          patientId
        }
      });

      res.status(201).json({
        message: "Bill created successfully",
        bill
      });

    } catch (error) {
      console.error("CREATE BILL ERROR:", error);

      if (error.message.includes("Invalid")) {
        return res.status(400).json({ message: error.message });
      }

      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  /**
   * Get bill by ID
   */
  static async getBill(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;

      const bill = await BillingService.getBillById(id, hospitalId, role, doctorId);

      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }

      res.json({ bill });

    } catch (error) {
      console.error("GET BILL ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get bill by number
   */
  static async getBillByNumber(req, res) {
    try {
      const { billNumber } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;

      const bill = await BillingService.getBillByNumber(billNumber, hospitalId, role, doctorId);

      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }

      res.json({ bill });

    } catch (error) {
      console.error("GET BILL BY NUMBER ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * List bills
   */
  static async listBills(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;

      const {
        patientId,
        status,
        fromDate,
        toDate,
        search,
        page,
        limit,
        sortBy,
        sortOrder
      } = req.query;

      const result = await BillingService.listBills({
        hospitalId,
        role,
        currentDoctorId: doctorId,
        patientId,
        status,
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
      console.error("LIST BILLS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Issue bill
   */
  static async issueBill(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;

      const bill = await BillingService.issueBill(id, hospitalId, role, doctorId);

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "BILL_ISSUED",
        targetType: "Bill",
        targetId: bill.id,
        metadata: {
          billNumber: bill.billNumber
        }
      });

      res.json({
        message: "Bill issued successfully",
        bill
      });

    } catch (error) {
      console.error("ISSUE BILL ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Void bill
   */
  static async voidBill(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;

      const bill = await BillingService.voidBill(id, hospitalId, reason, userId, role, doctorId);

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "BILL_VOIDED",
        targetType: "Bill",
        targetId: bill.id,
        metadata: {
          reason
        }
      });

      res.json({
        message: "Bill voided successfully",
        bill
      });

    } catch (error) {
      console.error("VOID BILL ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // ==================== PAYMENT CONTROLLERS ====================

  /**
   * Record payment
   */
  static async recordPayment(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const hospital = req.hospital;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;

      const { billId, amount } = req.body;

      if (!billId || !amount) {
        return res.status(400).json({ message: "Bill ID and amount are required" });
      }

      // Get bill to validate
      const bill = await prisma.bill.findFirst({
        where: { id: billId, hospitalId }
      });

      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }

      // Validate payment
      const paymentValidation = validatePayment(amount, bill.balance);
      if (!paymentValidation.valid) {
        return res.status(400).json({ message: paymentValidation.error });
      }

      const result = await BillingService.recordPayment(
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
        action: "PAYMENT_RECORDED",
        targetType: "Payment",
        targetId: result.payment.id,
        metadata: {
          billNumber: bill.billNumber,
          amount,
          method: req.body.method
        }
      });

      res.status(201).json({
        message: "Payment recorded successfully",
        payment: result.payment,
        bill: result.bill
      });

    } catch (error) {
      console.error("RECORD PAYMENT ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get payment by ID
   */
  static async getPayment(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;

      const payment = await BillingService.getPaymentById(id, hospitalId, role, doctorId);

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      res.json({ payment });

    } catch (error) {
      console.error("GET PAYMENT ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get payment by receipt
   */
  static async getPaymentByReceipt(req, res) {
    try {
      const { receiptNumber } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;

      const payment = await BillingService.getPaymentByReceipt(receiptNumber, hospitalId, role, doctorId);

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      res.json({ payment });

    } catch (error) {
      console.error("GET PAYMENT BY RECEIPT ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * List payments
   */
  static async listPayments(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;

      const {
        billId,
        method,
        fromDate,
        toDate,
        page,
        limit
      } = req.query;

      const result = await BillingService.listPayments({
        hospitalId,
        role,
        currentDoctorId: doctorId,
        billId,
        method,
        fromDate,
        toDate,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      });

      res.json(result);

    } catch (error) {
      console.error("LIST PAYMENTS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Refund payment
   */
  static async refundPayment(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;

      const bill = await BillingService.refundPayment(id, hospitalId, reason, userId, role, doctorId);

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "PAYMENT_REFUNDED",
        targetType: "Payment",
        targetId: id,
        metadata: {
          reason
        }
      });

      res.json({
        message: "Payment refunded successfully",
        bill
      });

    } catch (error) {
      console.error("REFUND PAYMENT ERROR:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }

      res.status(500).json({ message: "Server error" });
    }
  }

  // ==================== INSURANCE CONTROLLERS ====================

  /**
   * Create insurance provider
   */
  static async createInsuranceProvider(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;

      const provider = await BillingService.createInsuranceProvider(req.body, hospitalId, role);

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "INSURANCE_PROVIDER_CREATED",
        targetType: "InsuranceProvider",
        targetId: provider.id,
        metadata: {
          name: provider.name,
          code: provider.code
        }
      });

      res.status(201).json({
        message: "Insurance provider created successfully",
        provider
      });

    } catch (error) {
      console.error("CREATE INSURANCE PROVIDER ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * List insurance providers
   */
  static async listInsuranceProviders(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const { isActive } = req.query;
      const role = req.role;

      const providers = await BillingService.listInsuranceProviders(
        hospitalId,
        isActive !== 'false',
        role
      );

      res.json({ providers });

    } catch (error) {
      console.error("LIST INSURANCE PROVIDERS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Create insurance claim
   */
  static async createClaim(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;

      const claim = await BillingService.createClaim(req.body, hospitalId, role, doctorId);

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "INSURANCE_CLAIM_CREATED",
        targetType: "InsuranceClaim",
        targetId: claim.id,
        metadata: {
          claimNumber: claim.claimNumber,
          amount: claim.submittedAmount
        }
      });

      res.status(201).json({
        message: "Insurance claim created successfully",
        claim
      });

    } catch (error) {
      console.error("CREATE CLAIM ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Update claim status
   */
  static async updateClaimStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, ...data } = req.body;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;

      const claim = await BillingService.updateClaimStatus(id, hospitalId, status, data, role);

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: `INSURANCE_CLAIM_${status}`,
        targetType: "InsuranceClaim",
        targetId: claim.id
      });

      res.json({
        message: `Claim status updated to ${status}`,
        claim
      });

    } catch (error) {
      console.error("UPDATE CLAIM STATUS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // ==================== STATISTICS CONTROLLERS ====================

  /**
   * Get revenue statistics
   */
  static async getRevenueStats(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;
      const { period } = req.query;

      const stats = await BillingService.getRevenueStats(hospitalId, period, role, doctorId);

      res.json({ stats });

    } catch (error) {
      console.error("REVENUE STATS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get patient billing summary
   */
  static async getPatientBillingSummary(req, res) {
    try {
      const { patientId } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;

      const summary = await BillingService.getPatientBillingSummary(patientId, hospitalId, role, doctorId);

      res.json({ summary });

    } catch (error) {
      console.error("PATIENT BILLING SUMMARY ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get dashboard stats
   */
  static async getDashboardStats(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;

      const [
        todayRevenue,
        pendingBills,
        overdueBills,
        recentPayments
      ] = await Promise.all([
        // Today's revenue – filtered by role
        BillingService.getTodayRevenue(hospitalId, role, doctorId),

        // Pending bills – filtered by role
        BillingService.countPendingBills(hospitalId, role, doctorId),

        // Overdue bills – filtered by role
        BillingService.countOverdueBills(hospitalId, role, doctorId),

        // Recent payments – filtered by role
        BillingService.getRecentPayments(hospitalId, role, doctorId, 10)
      ]);

      res.json({
        todayRevenue,
        pendingBills,
        overdueBills,
        recentPayments
      });

    } catch (error) {
      console.error("DASHBOARD STATS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Sync offline data
   */
  static async syncOffline(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;

      const data = Array.isArray(req.body) ? req.body : [req.body];

      const results = await BillingService.syncOffline(data, hospitalId, userId, role, doctorId);

      res.json({
        message: `${results.length} items synced`,
        results,
        syncStatus: "COMPLETED"
      });

    } catch (error) {
      console.error("SYNC BILLING ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}