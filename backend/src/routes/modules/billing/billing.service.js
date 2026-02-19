// backend/src/routes/modules/billing/billing.service.js

import { prisma } from "../../../lib/prisma.js";
import {
  generateBillNumber,
  generateReceiptNumber,
  calculateBillTotals,
  validateBillItems,
  validatePayment,
  calculateDueDate,
  calculateInsuranceCoverage
} from "./billing.utils.js";

export class BillingService {

  // ==================== HELPER: CHECK BILL ACCESS ====================

  /**
   * Check if the current user can access a given bill.
   * @param {Object} bill - Must include patientId and possibly admission/appointment relations.
   * @param {string} role - User role.
   * @param {string} currentDoctorId - Current doctor ID (if user is a doctor).
   * @returns {boolean}
   */
  static async canAccessBill(bill, role, currentDoctorId) {
    if (['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'].includes(role)) {
      return true;
    }
    if (role === 'DOCTOR') {
      // Doctor can only access bills for patients they have treated.
      // We need to check if there is an appointment or admission with this doctor.
      // For simplicity, we check if there is any appointment or admission linking this doctor and patient.
      const hasAccess = await prisma.$transaction(async (tx) => {
        // Check appointments
        const appointment = await tx.appointment.findFirst({
          where: {
            patientId: bill.patientId,
            doctorId: currentDoctorId,
            hospitalId: bill.hospitalId
          }
        });
        if (appointment) return true;

        // Check admissions
        const admission = await tx.admission.findFirst({
          where: {
            patientId: bill.patientId,
            admittingDoctorId: currentDoctorId,
            hospitalId: bill.hospitalId
          }
        });
        if (admission) return true;

        return false;
      });
      return hasAccess;
    }
    // Other roles (NURSE, etc.) – deny by default
    return false;
  }

  // ==================== BILL MANAGEMENT ====================

  /**
   * Create bill
   */
  static async createBill(data, hospitalId, hospitalCode, userId, role, currentDoctorId) {
    const {
      patientId,
      admissionId,
      appointmentId,
      items,
      taxRate = 0.16,
      discountRate = 0,
      dueDate,
      notes,
      insuranceProviderId,
      insurancePolicyNo
    } = data;

    // Validate items
    const itemsValidation = validateBillItems(items);
    if (!itemsValidation.valid) {
      throw new Error(itemsValidation.error);
    }

    // Calculate totals
    const totals = calculateBillTotals(items, taxRate, discountRate);

    // Generate bill number
    const billNumber = generateBillNumber(hospitalCode);

    // Calculate due date
    const finalDueDate = dueDate ? new Date(dueDate) : calculateDueDate(new Date());

    // Optional: if doctor, ensure they have permission to bill this patient
    if (role === 'DOCTOR') {
      const hasRelation = await prisma.$transaction(async (tx) => {
        const appt = await tx.appointment.findFirst({
          where: { patientId, doctorId: currentDoctorId, hospitalId }
        });
        if (appt) return true;
        const adm = await tx.admission.findFirst({
          where: { patientId, admittingDoctorId: currentDoctorId, hospitalId }
        });
        return !!adm;
      });
      if (!hasRelation) {
        throw new Error("You are not authorized to create a bill for this patient");
      }
    }

    return prisma.$transaction(async (tx) => {
      // Create bill
      const bill = await tx.bill.create({
        data: {
          billNumber,
          patientId,
          admissionId,
          appointmentId,
          status: 'DRAFT',
          subtotal: totals.subtotal,
          tax: totals.tax,
          discount: totals.discount,
          total: totals.total,
          paid: 0,
          balance: totals.total,
          issuedAt: new Date(),
          dueDate: finalDueDate,
          hospitalId,
          items: {
            create: items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.quantity * item.unitPrice,
              type: item.type || 'OTHER',
              referenceId: item.referenceId,
              referenceType: item.referenceType
            }))
          }
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              uhid: true
            }
          },
          items: true
        }
      });

      // Create insurance claim if provider specified
      if (insuranceProviderId) {
        const coverage = calculateInsuranceCoverage(bill, { coverageTerms: {} });

        await tx.insuranceClaim.create({
          data: {
            patientId,
            billId: bill.id,
            providerId: insuranceProviderId,
            claimNumber: `CLM-${billNumber}`,
            status: 'SUBMITTED',
            submittedAmount: coverage.covered,
            submittedAt: new Date(),
            hospitalId
          }
        });
      }

      return bill;
    });
  }

  /**
   * Get bill by ID (with RBAC)
   */
  static async getBillById(id, hospitalId, role, currentDoctorId) {
    const bill = await prisma.bill.findFirst({
      where: {
        id,
        hospitalId
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            uhid: true,
            phone: true,
            email: true,
            address: true,
            insuranceProvider: true,
            insurancePolicyNo: true
          }
        },
        admission: {
          select: {
            id: true,
            admissionNumber: true,
            admissionDate: true,
            dischargeDate: true,
            status: true
          }
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
            doctor: {
              select: {
                firstName: true,
                lastName: true,
                specialty: true
              }
            }
          }
        },
        items: true,
        payments: {
          orderBy: {
            receivedAt: 'desc'
          }
        },
        insuranceClaims: {
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }
      }
    });

    if (!bill) return null;

    // Apply access control
    if (!(await this.canAccessBill(bill, role, currentDoctorId))) {
      return null;
    }

    return bill;
  }

  /**
   * Get bill by number (with RBAC)
   */
  static async getBillByNumber(billNumber, hospitalId, role, currentDoctorId) {
    const bill = await prisma.bill.findFirst({
      where: {
        billNumber,
        hospitalId
      },
      include: {
        patient: true,
        items: true,
        payments: true
      }
    });

    if (!bill) return null;

    if (!(await this.canAccessBill(bill, role, currentDoctorId))) {
      return null;
    }

    return bill;
  }

  /**
   * List bills (with RBAC)
   */
  static async listBills({
    hospitalId,
    role,
    currentDoctorId,
    patientId = null,
    status = null,
    fromDate = null,
    toDate = null,
    search = '',
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  }) {
    const skip = (page - 1) * limit;

    const where = {
      hospitalId
    };

    // Role-based filter
    if (role === 'DOCTOR') {
      // Doctors see bills for patients they have treated.
      // We need to find all patient IDs that have appointments or admissions with this doctor.
      const patientIdsWithAccess = await prisma.$transaction(async (tx) => {
        const appointments = await tx.appointment.findMany({
          where: { doctorId: currentDoctorId, hospitalId },
          select: { patientId: true },
          distinct: ['patientId']
        });
        const admissions = await tx.admission.findMany({
          where: { admittingDoctorId: currentDoctorId, hospitalId },
          select: { patientId: true },
          distinct: ['patientId']
        });
        const ids = [
          ...appointments.map(a => a.patientId),
          ...admissions.map(a => a.patientId)
        ];
        return [...new Set(ids)];
      });
      where.patientId = { in: patientIdsWithAccess };
    }

    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    if (fromDate || toDate) {
      where.issuedAt = {};
      if (fromDate) where.issuedAt.gte = new Date(fromDate);
      if (toDate) where.issuedAt.lte = new Date(toDate);
    }

    if (search) {
      where.OR = [
        { billNumber: { contains: search } },
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
        { patient: { uhid: { contains: search } } }
      ];
    }

    const total = await prisma.bill.count({ where });

    const bills = await prisma.bill.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            uhid: true
          }
        },
        items: true,
        payments: {
          take: 1,
          orderBy: {
            receivedAt: 'desc'
          }
        },
        _count: {
          select: {
            payments: true
          }
        }
      }
    });

    return {
      bills,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Issue bill (change from DRAFT to ISSUED) – with RBAC
   */
  static async issueBill(id, hospitalId, role, currentDoctorId) {
    const bill = await prisma.bill.findFirst({
      where: { id, hospitalId }
    });
    if (!bill) {
      throw new Error("Bill not found");
    }
    if (!(await this.canAccessBill(bill, role, currentDoctorId))) {
      throw new Error("Access denied");
    }
    return prisma.bill.update({
      where: {
        id,
        hospitalId,
        status: 'DRAFT'
      },
      data: {
        status: 'ISSUED'
      }
    });
  }

  /**
   * Void bill – with RBAC
   */
  static async voidBill(id, hospitalId, reason, userId, role, currentDoctorId) {
    const bill = await prisma.bill.findFirst({
      where: { id, hospitalId }
    });
    if (!bill) {
      throw new Error("Bill not found");
    }
    if (!(await this.canAccessBill(bill, role, currentDoctorId))) {
      throw new Error("Access denied");
    }
    return prisma.bill.update({
      where: {
        id,
        hospitalId,
        status: { notIn: ['PAID', 'VOID'] }
      },
      data: {
        status: 'VOID',
        voidedAt: new Date(),
        voidedBy: userId,
        voidReason: reason
      }
    });
  }

  // ==================== PAYMENT MANAGEMENT ====================

  /**
   * Record payment – with RBAC (check bill access)
   */
  static async recordPayment(data, hospitalId, hospitalCode, userId, role, currentDoctorId) {
    const {
      billId,
      amount,
      method,
      reference,
      notes
    } = data;

    return prisma.$transaction(async (tx) => {
      // Get bill
      const bill = await tx.bill.findFirst({
        where: {
          id: billId,
          hospitalId
        }
      });

      if (!bill) {
        throw new Error("Bill not found");
      }

      // Check access
      if (!(await this.canAccessBill(bill, role, currentDoctorId))) {
        throw new Error("Access denied");
      }

      // Validate payment
      const paymentValidation = validatePayment(amount, bill.balance);
      if (!paymentValidation.valid) {
        throw new Error(paymentValidation.error);
      }

      // Generate receipt number
      const receiptNumber = generateReceiptNumber(hospitalCode);

      // Create payment
      const payment = await tx.payment.create({
        data: {
          billId,
          paymentNumber: `PAY-${Date.now()}`,
          amount,
          method,
          reference,
          receivedAt: new Date(),
          receivedBy: userId,
          receiptNumber,
          receiptIssuedAt: new Date(),
          hospitalId
        }
      });

      // Update bill
      const newPaid = bill.paid + amount;
      const newBalance = bill.total - newPaid;
      const newStatus = newBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';

      const updatedBill = await tx.bill.update({
        where: { id: billId },
        data: {
          paid: newPaid,
          balance: newBalance,
          status: newStatus
        }
      });

      return {
        payment,
        bill: updatedBill
      };
    });
  }

  /**
   * Get payment by ID (with RBAC)
   */
  static async getPaymentById(id, hospitalId, role, currentDoctorId) {
    const payment = await prisma.payment.findFirst({
      where: {
        id,
        hospitalId
      },
      include: {
        bill: {
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                uhid: true
              }
            }
          }
        }
      }
    });

    if (!payment) return null;

    // Check bill access
    if (!(await this.canAccessBill(payment.bill, role, currentDoctorId))) {
      return null;
    }

    return payment;
  }

  /**
   * Get payment by receipt number (with RBAC)
   */
  static async getPaymentByReceipt(receiptNumber, hospitalId, role, currentDoctorId) {
    const payment = await prisma.payment.findFirst({
      where: {
        receiptNumber,
        hospitalId
      },
      include: {
        bill: {
          include: {
            patient: true
          }
        }
      }
    });

    if (!payment) return null;

    if (!(await this.canAccessBill(payment.bill, role, currentDoctorId))) {
      return null;
    }

    return payment;
  }

  /**
   * List payments (with RBAC)
   */
  static async listPayments({
    hospitalId,
    role,
    currentDoctorId,
    billId = null,
    method = null,
    fromDate = null,
    toDate = null,
    page = 1,
    limit = 20
  }) {
    const skip = (page - 1) * limit;

    // First, get accessible bill IDs for role=DOCTOR
    let accessibleBillIds = null;
    if (role === 'DOCTOR') {
      const patientIdsWithAccess = await this.getPatientIdsForDoctor(currentDoctorId, hospitalId);
      const bills = await prisma.bill.findMany({
        where: {
          hospitalId,
          patientId: { in: patientIdsWithAccess }
        },
        select: { id: true }
      });
      accessibleBillIds = bills.map(b => b.id);
    }

    const where = {
      hospitalId
    };

    if (accessibleBillIds) {
      where.billId = { in: accessibleBillIds };
    }

    if (billId) where.billId = billId;
    if (method) where.method = method;

    if (fromDate || toDate) {
      where.receivedAt = {};
      if (fromDate) where.receivedAt.gte = new Date(fromDate);
      if (toDate) where.receivedAt.lte = new Date(toDate);
    }

    const total = await prisma.payment.count({ where });

    const payments = await prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        receivedAt: 'desc'
      },
      include: {
        bill: {
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                uhid: true
              }
            }
          }
        }
      }
    });

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Refund payment – with RBAC
   */
  static async refundPayment(id, hospitalId, reason, userId, role, currentDoctorId) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: {
          id,
          hospitalId,
          isRefunded: false
        },
        include: {
          bill: true
        }
      });

      if (!payment) {
        throw new Error("Payment not found or already refunded");
      }

      // Check bill access
      if (!(await this.canAccessBill(payment.bill, role, currentDoctorId))) {
        throw new Error("Access denied");
      }

      // Mark payment as refunded
      await tx.payment.update({
        where: { id },
        data: {
          isRefunded: true,
          refundedAt: new Date(),
          refundedBy: userId,
          refundReason: reason
        }
      });

      // Update bill
      const newPaid = payment.bill.paid - payment.amount;
      const newBalance = payment.bill.total - newPaid;
      const newStatus = newBalance === payment.bill.total ? 'ISSUED' : 'PARTIALLY_PAID';

      const updatedBill = await tx.bill.update({
        where: { id: payment.billId },
        data: {
          paid: newPaid,
          balance: newBalance,
          status: newStatus
        }
      });

      return updatedBill;
    });
  }

  // ==================== INSURANCE MANAGEMENT ====================

  /**
   * Create insurance provider (admin only – already in route)
   */
  static async createInsuranceProvider(data, hospitalId, role) {
    // Role is already checked by route, but we can log it
    const {
      name,
      code,
      contactPhone,
      contactEmail,
      coverageTerms
    } = data;

    return prisma.insuranceProvider.create({
      data: {
        name,
        code: code || `INS-${Date.now()}`,
        contactPhone,
        contactEmail,
        coverageTerms,
        isActive: true,
        hospitalId
      }
    });
  }

  /**
   * List insurance providers (all authenticated users can view)
   */
  static async listInsuranceProviders(hospitalId, isActive = true, role) {
    // No need for role filtering beyond hospital
    return prisma.insuranceProvider.findMany({
      where: {
        hospitalId,
        isActive
      },
      include: {
        _count: {
          select: {
            claims: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  /**
   * Create insurance claim – with RBAC
   */
  static async createClaim(data, hospitalId, role, currentDoctorId) {
    const {
      patientId,
      billId,
      providerId,
      submittedAmount
    } = data;

    const bill = await prisma.bill.findFirst({
      where: {
        id: billId,
        hospitalId
      }
    });

    if (!bill) {
      throw new Error("Bill not found");
    }

    // Check bill access
    if (!(await this.canAccessBill(bill, role, currentDoctorId))) {
      throw new Error("Access denied");
    }

    return prisma.insuranceClaim.create({
      data: {
        patientId,
        billId,
        providerId,
        claimNumber: `CLM-${Date.now()}`,
        status: 'SUBMITTED',
        submittedAmount,
        submittedAt: new Date(),
        hospitalId
      },
      include: {
        provider: true,
        patient: {
          select: {
            firstName: true,
            lastName: true,
            uhid: true
          }
        },
        bill: true
      }
    });
  }

  /**
   * Update claim status – with RBAC (admin only)
   */
  static async updateClaimStatus(id, hospitalId, status, data = {}, role) {
    // Role is already checked in route (SYSTEM_ADMIN, HOSPITAL_ADMIN, ACCOUNTANT)
    const updateData = {
      status,
      ...(status === 'APPROVED' && { approvedAt: new Date(), approvedAmount: data.amount }),
      ...(status === 'REJECTED' && { rejectedAt: new Date(), rejectionReason: data.reason }),
      ...(status === 'PAID' && { paidAmount: data.amount })
    };

    return prisma.insuranceClaim.update({
      where: {
        id,
        hospitalId
      },
      data: updateData,
      include: {
        provider: true,
        bill: true
      }
    });
  }

  // ==================== STATISTICS & REPORTS ====================

  /**
   * Helper to get patient IDs that a doctor has access to
   */
  static async getPatientIdsForDoctor(doctorId, hospitalId) {
    const appointments = await prisma.appointment.findMany({
      where: { doctorId, hospitalId },
      select: { patientId: true },
      distinct: ['patientId']
    });
    const admissions = await prisma.admission.findMany({
      where: { admittingDoctorId: doctorId, hospitalId },
      select: { patientId: true },
      distinct: ['patientId']
    });
    const ids = [
      ...appointments.map(a => a.patientId),
      ...admissions.map(a => a.patientId)
    ];
    return [...new Set(ids)];
  }

/**
 * Get revenue statistics (role‑aware)
 */
static async getRevenueStats(hospitalId, period = 'month', role, currentDoctorId) {
  // Return empty stats for unauthorized roles
  if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT'].includes(role)) {
    return {
      period,
      totalRevenue: 0,
      totalPaid: 0,
      outstanding: 0,
      collectionRate: 0,
      dailyData: {},
      byPaymentMethod: {}
    };
  }

  const today = new Date();
  let startDate;

  switch (period) {
    case 'day':
      startDate = new Date(today.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(today.setDate(today.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(today.setMonth(today.getMonth() - 1));
      break;
    case 'year':
      startDate = new Date(today.setFullYear(today.getFullYear() - 1));
      break;
    default:
      startDate = new Date(today.setMonth(today.getMonth() - 1));
  }

  const where = {
    hospitalId,
    issuedAt: {
      gte: startDate
    },
    status: { notIn: ['DRAFT', 'VOID'] }
  };

  // Apply role filter for doctors – but note: doctors are already filtered out above,
  // so this block is only relevant if we later allow doctors to see limited revenue.
  // Currently, doctors are excluded entirely.
  if (role === 'DOCTOR') {
    const patientIds = await this.getPatientIdsForDoctor(currentDoctorId, hospitalId);
    where.patientId = { in: patientIds };
  }

  const bills = await prisma.bill.findMany({
    where,
    include: {
      payments: true
    }
  });

  // Group by date
  const dailyData = {};
  const byPaymentMethod = {};
  let totalRevenue = 0;
  let totalPaid = 0;

  bills.forEach(bill => {
    const date = bill.issuedAt.toISOString().split('T')[0];

    if (!dailyData[date]) {
      dailyData[date] = {
        billed: 0,
        paid: 0,
        count: 0
      };
    }

    dailyData[date].billed += bill.total;
    dailyData[date].paid += bill.paid;
    dailyData[date].count++;

    totalRevenue += bill.total;
    totalPaid += bill.paid;

    // Payment methods
    bill.payments.forEach(payment => {
      byPaymentMethod[payment.method] = (byPaymentMethod[payment.method] || 0) + payment.amount;
    });
  });

  return {
    period,
    totalRevenue,
    totalPaid,
    outstanding: totalRevenue - totalPaid,
    collectionRate: totalRevenue > 0 ? Math.round((totalPaid / totalRevenue) * 100) : 0,
    dailyData,
    byPaymentMethod
  };
}

  /**
   * Get patient billing summary (with RBAC)
   */
  static async getPatientBillingSummary(patientId, hospitalId, role, currentDoctorId) {
    // First, check if doctor has access to this patient
    if (role === 'DOCTOR') {
      const accessiblePatientIds = await this.getPatientIdsForDoctor(currentDoctorId, hospitalId);
      if (!accessiblePatientIds.includes(patientId)) {
        throw new Error("Access denied");
      }
    }

    const bills = await prisma.bill.findMany({
      where: {
        patientId,
        hospitalId,
        status: { notIn: ['DRAFT', 'VOID'] }
      },
      include: {
        payments: true
      },
      orderBy: {
        issuedAt: 'desc'
      }
    });

    const totalBilled = bills.reduce((sum, b) => sum + b.total, 0);
    const totalPaid = bills.reduce((sum, b) => sum + b.paid, 0);
    const outstanding = bills
      .filter(b => b.status !== 'PAID')
      .reduce((sum, b) => sum + b.balance, 0);

    const lastBill = bills[0];
    const lastPayment = bills
      .flatMap(b => b.payments)
      .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))[0];

    return {
      totalBilled,
      totalPaid,
      outstanding,
      billCount: bills.length,
      paidCount: bills.filter(b => b.status === 'PAID').length,
      lastBillDate: lastBill?.issuedAt,
      lastPaymentDate: lastPayment?.receivedAt,
      lastPaymentAmount: lastPayment?.amount
    };
  }

  /**
   * Get today's revenue (with RBAC)
   */
  static async getTodayRevenue(hospitalId, role, currentDoctorId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where = {
      hospitalId,
      receivedAt: { gte: today }
    };

    if (role === 'DOCTOR') {
      // Only include payments for bills the doctor can access
      const patientIds = await this.getPatientIdsForDoctor(currentDoctorId, hospitalId);
      const bills = await prisma.bill.findMany({
        where: {
          hospitalId,
          patientId: { in: patientIds }
        },
        select: { id: true }
      });
      const billIds = bills.map(b => b.id);
      where.billId = { in: billIds };
    }

    const result = await prisma.payment.aggregate({
      where,
      _sum: {
        amount: true
      }
    });

    return result._sum.amount || 0;
  }

  /**
   * Count pending bills (with RBAC)
   */
  static async countPendingBills(hospitalId, role, currentDoctorId) {
    const where = {
      hospitalId,
      status: { in: ['ISSUED', 'PARTIALLY_PAID'] }
    };

    if (role === 'DOCTOR') {
      const patientIds = await this.getPatientIdsForDoctor(currentDoctorId, hospitalId);
      where.patientId = { in: patientIds };
    }

    return prisma.bill.count({ where });
  }

  /**
   * Count overdue bills (with RBAC)
   */
  static async countOverdueBills(hospitalId, role, currentDoctorId) {
    const where = {
      hospitalId,
      status: { in: ['ISSUED', 'PARTIALLY_PAID'] },
      dueDate: {
        lt: new Date()
      }
    };

    if (role === 'DOCTOR') {
      const patientIds = await this.getPatientIdsForDoctor(currentDoctorId, hospitalId);
      where.patientId = { in: patientIds };
    }

    return prisma.bill.count({ where });
  }

  /**
   * Get recent payments (with RBAC)
   */
  static async getRecentPayments(hospitalId, role, currentDoctorId, limit = 10) {
    const where = {
      hospitalId
    };

    if (role === 'DOCTOR') {
      const patientIds = await this.getPatientIdsForDoctor(currentDoctorId, hospitalId);
      const bills = await prisma.bill.findMany({
        where: {
          hospitalId,
          patientId: { in: patientIds }
        },
        select: { id: true }
      });
      const billIds = bills.map(b => b.id);
      where.billId = { in: billIds };
    }

    return prisma.payment.findMany({
      where,
      orderBy: { receivedAt: 'desc' },
      take: limit,
      include: {
        bill: {
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                uhid: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Sync offline data (with RBAC)
   */
  static async syncOffline(data, hospitalId, userId, role, currentDoctorId) {
    const results = [];

    for (const item of data) {
      try {
        if (item.type === 'payment') {
          const hospital = await prisma.hospital.findUnique({
            where: { id: hospitalId }
          });

          const result = await this.recordPayment(
            item.data,
            hospitalId,
            hospital.code,
            userId,
            role,
            currentDoctorId
          );
          results.push({ ...result, syncStatus: 'SYNCED' });
        }
      } catch (error) {
        results.push({
          offlineId: item.offlineId,
          error: error.message,
          syncStatus: 'FAILED'
        });
      }
    }

    return results;
  }
}