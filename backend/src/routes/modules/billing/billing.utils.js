// backend/src/routes/modules/billing/billing.utils.js

/**
 * Generate bill number
 * Format: INV-YYYYMMDD-XXXXX
 */
export function generateBillNumber(hospitalCode = "HOSP") {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `${hospitalCode}-${year}${month}${day}-${random}`;
}

/**
 * Generate receipt number
 * Format: RCP-YYYYMMDD-XXXXX
 */
export function generateReceiptNumber(hospitalCode = "HOSP") {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `${hospitalCode}-${year}${month}${day}-${random}`;
}

/**
 * Calculate tax amount
 */
export function calculateTax(subtotal, taxRate = 0.16) {
  return Math.round(subtotal * taxRate);
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(subtotal, discountRate) {
  return Math.round(subtotal * (discountRate / 100));
}

/**
 * Calculate bill totals
 */
export function calculateBillTotals(items, taxRate = 0.16, discountRate = 0) {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discount = calculateDiscount(subtotal, discountRate);
  const taxable = subtotal - discount;
  const tax = calculateTax(taxable, taxRate);
  const total = taxable + tax;
  
  return {
    subtotal,
    discount,
    tax,
    total
  };
}

/**
 * Get status color
 */
export function getStatusColor(status) {
  const colors = {
    'DRAFT': 'gray',
    'ISSUED': 'blue',
    'PARTIALLY_PAID': 'orange',
    'PAID': 'green',
    'VOID': 'red',
    'WRITTEN_OFF': 'darkred'
  };
  return colors[status] || 'gray';
}

/**
 * Get payment method display name
 */
export function getPaymentMethodName(method) {
  const methods = {
    'CASH': 'Cash',
    'CARD': 'Card',
    'MPESA': 'M-Pesa',
    'BANK_TRANSFER': 'Bank Transfer',
    'CHEQUE': 'Cheque',
    'INSURANCE': 'Insurance',
    'OTHER': 'Other'
  };
  return methods[method] || method;
}

/**
 * Format currency
 */
export function formatCurrency(amount, currency = 'KES') {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency
  }).format(amount ); 
}

/**
 * Calculate due date
 */
export function calculateDueDate(issueDate, paymentTerms = 30) {
  const due = new Date(issueDate);
  due.setDate(due.getDate() + paymentTerms);
  return due;
}

/**
 * Validate payment amount
 */
export function validatePayment(amount, balance) {
  if (amount <= 0) {
    return {
      valid: false,
      error: "Payment amount must be greater than 0"
    };
  }
  
  if (amount > balance) {
    return {
      valid: false,
      error: `Payment amount (${formatCurrency(amount)}) exceeds balance (${formatCurrency(balance)})`
    };
  }
  
  return { valid: true };
}

/**
 * Group bills by status
 */
export function groupBillsByStatus(bills) {
  return bills.reduce((acc, bill) => {
    acc[bill.status] = (acc[bill.status] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Calculate revenue statistics
 */
export function calculateRevenueStats(bills) {
  const total = bills.reduce((sum, bill) => sum + bill.total, 0);
  const paid = bills
    .filter(b => b.status === 'PAID')
    .reduce((sum, bill) => sum + bill.total, 0);
  const pending = bills
    .filter(b => b.status === 'ISSUED' || b.status === 'PARTIALLY_PAID')
    .reduce((sum, bill) => sum + (bill.total - bill.paid), 0);
  const overdue = bills
    .filter(b => (b.status === 'ISSUED' || b.status === 'PARTIALLY_PAID') && new Date(b.dueDate) < new Date())
    .reduce((sum, bill) => sum + (bill.total - bill.paid), 0);
  
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
      unitPrice: item.unitPrice,
      amount: item.amount
    })),
    subtotal: bill.subtotal,
    discount: bill.discount,
    tax: bill.tax,
    total: bill.total,
    paid: bill.paid,
    balance: bill.balance,
    status: bill.status
  };
}

/**
 * Generate offline ID
 */
export function generateOfflineId() {
  return `offline_bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate bill items
 */
export function validateBillItems(items) {
  if (!items || items.length === 0) {
    return {
      valid: false,
      error: "Bill must have at least one item"
    };
  }
  
  for (const item of items) {
    if (!item.description) {
      return {
        valid: false,
        error: "Item description is required"
      };
    }
    
    if (!item.quantity || item.quantity <= 0) {
      return {
        valid: false,
        error: "Item quantity must be greater than 0"
      };
    }
    
    if (!item.unitPrice || item.unitPrice < 0) {
      return {
        valid: false,
        error: "Item unit price must be a positive number"
      };
    }
  }
  
  return { valid: true };
}

/**
 * Calculate insurance coverage
 */
export function calculateInsuranceCoverage(bill, insurancePolicy) {
  if (!insurancePolicy) return { covered: 0, patientPays: bill.total };
  
  const coverage = insurancePolicy.coverageTerms || {};
  const coveredAmount = Math.min(
    bill.total * (coverage.coverageRate || 0),
    coverage.maxAmount || Infinity
  );
  
  return {
    covered: Math.round(coveredAmount),
    patientPays: bill.total - Math.round(coveredAmount)
  };
}

/**
 * Parse insurance claim status
 */
export function parseClaimStatus(status) {
  const statusMap = {
    'SUBMITTED': 'Submitted',
    'APPROVED': 'Approved',
    'REJECTED': 'Rejected',
    'PAID': 'Paid'
  };
  return statusMap[status] || status;
}