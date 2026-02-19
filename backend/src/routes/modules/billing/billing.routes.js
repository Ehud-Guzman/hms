import { Router } from "express";
import { BillingController } from "./billing.controller.js";
import { requireAuth } from "../../../middleware/auth.js";
import { tenantContext } from "../../../middleware/tenant.js";
import { requireTenant } from "../../../middleware/tenant.js";
import { requireRole } from "../../../middleware/auth.js";

const router = Router();

// All billing routes require auth + tenant context
router.use(requireAuth);
router.use(tenantContext);
router.use(requireTenant);

// ==================== DASHBOARD ====================
router.get("/dashboard",
  requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "ACCOUNTANT"),
  BillingController.getDashboardStats
);

// ==================== REVENUE STATS ====================
router.get("/revenue/stats", BillingController.getRevenueStats);

// ==================== PATIENT BILLING ====================
router.get("/patient/:patientId/summary",
  requireRole("DOCTOR", "NURSE", "RECEPTIONIST", "ACCOUNTANT", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"),
  BillingController.getPatientBillingSummary
);

// ==================== BILL ROUTES ====================
router.post("/bills",
  requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "ACCOUNTANT"),
  BillingController.createBill
);

router.get("/bills", BillingController.listBills);
router.get("/bills/number/:billNumber", BillingController.getBillByNumber);
router.get("/bills/:id", BillingController.getBill);

router.patch("/bills/:id/issue",
  requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "ACCOUNTANT"),
  BillingController.issueBill
);

router.patch("/bills/:id/void",
  requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "ACCOUNTANT"),
  BillingController.voidBill
);

// ==================== PAYMENT ROUTES ====================
router.post("/payments",
  requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "ACCOUNTANT", "RECEPTIONIST"),
  BillingController.recordPayment
);

router.get("/payments", BillingController.listPayments);
router.get("/payments/receipt/:receiptNumber", BillingController.getPaymentByReceipt);
router.get("/payments/:id", BillingController.getPayment);

router.post("/payments/:id/refund",
  requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "ACCOUNTANT"),
  BillingController.refundPayment
);

// ==================== INSURANCE ROUTES ====================
router.post("/insurance/providers",
  requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "ACCOUNTANT"),
  BillingController.createInsuranceProvider
);

router.get("/insurance/providers", BillingController.listInsuranceProviders);

router.post("/insurance/claims",
  requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "ACCOUNTANT"),
  BillingController.createClaim
);

router.patch("/insurance/claims/:id/status",
  requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "ACCOUNTANT"),
  BillingController.updateClaimStatus
);

// ==================== SYNC ROUTES ====================
router.post("/sync",
  requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "ACCOUNTANT", "RECEPTIONIST"),
  BillingController.syncOffline
);

export default router;