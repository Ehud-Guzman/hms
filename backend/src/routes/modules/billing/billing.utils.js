// backend/src/routes/modules/billing/billing.utils.js

const DEFAULT_TAX_RATE = 0.16;
const DEFAULT_CURRENCY = 'KES';

/**
 * Generate bill number
 * Format: HOSP-YYYYMMDD-XXXXX
 */
export function generateBillNumber(hospitalCode = "HOSP") {
  const date = new Date();
  const formatted = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `${hospitalCode}-${formatted}-${random}`;
}

/**
 * Generate receipt number
 */
export function generateReceiptNumber(hospitalCode = "HOSP") {
  const date = new Date();
  const formatted = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `${hospitalCode}-${formatted}-${random}`;
}

/**
 * Safe rounding (2 decimal precision)
 */
function round(amount) {
  return Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate tax amount
 */
export function calculateTax(subtotal, taxRate = DEFAULT_TAX_RATE) {
  return round(subtotal * taxRate);
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(subtotal, discountRate = 0) {
  return round(subtotal * (discountRate / 100));
}

/**
 * Calculate bill totals (financially consistent)
 */
export function calculateBillTotals(items, taxRate = DEFAULT_TAX_RATE, discountRate = 0) {
  if (!Array.isArray(items) || items.length === 0) {
    return { subtotal: 0, discount: 0, tax: 0, total: 0 };
  }

  const subtotal = round(
    items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      return sum + (quantity * unitPrice);
    }, 0)
  );

  const discount = calculateDiscount(subtotal, discountRate);
  const taxable = round(subtotal - discount);
  const tax = calculateTax(taxable, taxRate);
  const total = round(taxable + tax);

  return { subtotal, discount, tax, total };
}

/**
 * Get status color
 */
export function getStatusColor(status) {
  const colors = {
    DRAFT: 'gray',
    ISSUED: 'blue',
    PARTIALLY_PAID: 'orange',
    PAID: 'green',
    VOID: 'red',
    WRITTEN_OFF: 'darkred'
  };
  return colors[status] || 'gray';
}

/**
 * Get payment method display name
 */
export function getPaymentMethodName(method) {
  const methods = {
    CASH: 'Cash',
    CARD: 'Card',
    MPESA: 'M-Pesa',
    BANK_TRANSFER: 'Bank Transfer',
    CHEQUE: 'Cheque',
    INSURANCE: 'Insurance',
    OTHER: 'Other'
  };
  return methods[method] || method;
}

/**
 * Format currency
 */
export function formatCurrency(amount, currency = DEFAULT_CURRENCY) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency
  }).format(round(amount));
}

/**
 * Calculate due date
 */
export function calculateDueDate(issueDate, paymentTerms = 30) {
  const due = new Date(issueDate);
  due.setDate(due.getDate() + Number(paymentTerms));
  return due;
}

/**
 * Validate payment amount
 */
export function validatePayment(amount, balance) {
  const payment = Number(amount);
  const currentBalance = Number(balance);

  if (isNaN(payment) || payment <= 0) {
    return {
      valid: false,
      error: "Payment amount must be greater than 0"
    };
  }

  if (payment > currentBalance) {
    return {
      valid: false,
      error: `Payment amount (${formatCurrency(payment)}) exceeds balance (${formatCurrency(currentBalance)})`
    };
  }

  return { valid: true };
}

/**
 * Group bills by status
 */
export function groupBillsByStatus(bills = []) {
  return bills.reduce((acc, bill) => {
    acc[bill.status] = (acc[bill.status] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Calculate revenue statistics (excludes DRAFT & VOID from totals)
 */
export function calculateRevenueStats(bills = []) {
  const activeBills = bills.filter(b => !['DRAFT', 'VOID'].includes(b.status));

  const total = round(activeBills.reduce((sum, bill) => sum + Number(bill.total || 0), 0));

  const paid = round(
    activeBills
      .filter(b => b.status === 'PAID')
      .reduce((sum, bill) => sum + Number(bill.total || 0), 0)
  );

  const pending = round(
    activeBills
      .filter(b => ['ISSUED', 'PARTIALLY_PAID'].includes(b.status))
      .reduce((sum, bill) => sum + (Number(bill.total || 0) - Number(bill.paid || 0)), 0)
  );

  const overdue = round(
    activeBills
      .filter(b =>
        ['ISSUED', 'PARTIALLY_PAID'].includes(b.status) &&
        new Date(b.dueDate) < new Date()
      )
      .reduce((sum, bill) => sum + (Number(bill.total || 0) - Number(bill.paid || 0)), 0)
  );

  return {
    total,
    paid,
    pending,
    overdue,
    collectionRate: total > 0 ? Math.round((paid / total) * 100) : 0
  };
}

/**
 * Generate invoice PDF data
 */
export function generateInvoiceData(bill, hospital) {
  return {
    invoiceNumber: bill.billNumber,
    date: bill.issuedAt,
    dueDate: bill.dueDate,
    hospital: {
      name: hospital.name,
      address: hospital.address,
      phone: hospital.contactPhone,
      email: hospital.contactEmail,
      logo: hospital.logoUrl
    },
    patient: {
      name: `${bill.patient.firstName} ${bill.patient.lastName}`,
      uhid: bill.patient.uhid,
      address: bill.patient.address,
      phone: bill.patient.phone,
      email: bill.patient.email
    },
    items: bill.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: round(item.unitPrice),
      amount: round(item.amount)
    })),
    subtotal: round(bill.subtotal),
    discount: round(bill.discount),
    tax: round(bill.tax),
    total: round(bill.total),
    paid: round(bill.paid || 0),
    balance: round(bill.balance || 0),
    status: bill.status
  };
}

/**
 * Generate offline ID
 */
export function generateOfflineId() {
  return `offline_bill_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Validate bill items
 */
export function validateBillItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, error: "Bill must have at least one item" };
  }

  for (const item of items) {
    if (!item.description) {
      return { valid: false, error: "Item description is required" };
    }
    if (!item.quantity || item.quantity <= 0) {
      return { valid: false, error: "Item quantity must be greater than 0" };
    }
    if (item.unitPrice == null || item.unitPrice < 0) {
      return { valid: false, error: "Item unit price must be a positive number" };
    }
  }

  return { valid: true };
}

/**
 * Calculate insurance coverage
 */
export function calculateInsuranceCoverage(bill, insurancePolicy) {
  if (!insurancePolicy) return { covered: 0, patientPays: round(bill.total) };

  const coverage = insurancePolicy.coverageTerms || {};
  const coverageRate = Number(coverage.coverageRate) || 0;
  const maxAmount = coverage.maxAmount ?? Infinity;

  const coveredAmount = Math.min(
    round(bill.total * coverageRate),
    maxAmount
  );

  return {
    covered: round(coveredAmount),
    patientPays: round(bill.total - coveredAmount)
  };
}

/**
 * Parse insurance claim status
 */
export function parseClaimStatus(status) {
  const statusMap = {
    SUBMITTED: 'Submitted',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    PAID: 'Paid'
  };
  return statusMap[status] || status;
}