import api from '../../../services/api'

const billingService = {
  // ==================== INVOICES ====================
  getInvoices: async (params = {}) => {
    try {
      const response = await api.get('/billing/bills', { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch invoices')
    }
  },

  getInvoice: async (id) => {
    try {
      const response = await api.get(`/billing/bills/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch invoice')
    }
  },

  getInvoiceByNumber: async (billNumber) => {
    try {
      const response = await api.get(`/billing/bills/number/${billNumber}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch invoice')
    }
  },

  createInvoice: async (data) => {
    try {
      const response = await api.post('/billing/bills', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create invoice')
    }
  },

  updateInvoice: async (id, data) => {
    try {
      const response = await api.patch(`/billing/bills/${id}`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update invoice')
    }
  },

  issueInvoice: async (id) => {
    try {
      const response = await api.patch(`/billing/bills/${id}/issue`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to issue invoice')
    }
  },

  voidInvoice: async (id, reason) => {
    try {
      const response = await api.patch(`/billing/bills/${id}/void`, { reason })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to void invoice')
    }
  },

  // ==================== PAYMENTS ====================
  getPayments: async (params = {}) => {
    try {
      const response = await api.get('/billing/payments', { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch payments')
    }
  },

  getPayment: async (id) => {
    try {
      const response = await api.get(`/billing/payments/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch payment')
    }
  },

  getPaymentByReceipt: async (receiptNumber) => {
    try {
      const response = await api.get(`/billing/payments/receipt/${receiptNumber}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch payment')
    }
  },

  recordPayment: async (data) => {
    try {
      const response = await api.post('/billing/payments', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to record payment')
    }
  },

  refundPayment: async (id, data) => {
    try {
      const response = await api.post(`/billing/payments/${id}/refund`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to refund payment')
    }
  },

  // ==================== STATISTICS ====================
  getDashboardStats: async () => {
    try {
      const response = await api.get('/billing/dashboard')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard stats')
    }
  },

  getRevenueStats: async (params = {}) => {
    try {
      const response = await api.get('/billing/revenue/stats', { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch revenue stats')
    }
  },

  // ==================== PATIENT BILLING ====================
  getPatientBillingSummary: async (patientId) => {
    try {
      const response = await api.get(`/billing/patient/${patientId}/summary`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch patient billing summary')
    }
  },

  getPatientInvoices: async (patientId, params = {}) => {
    try {
      const response = await api.get(`/billing/patient/${patientId}/invoices`, { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch patient invoices')
    }
  },

  getPatientPayments: async (patientId, params = {}) => {
    try {
      const response = await api.get(`/billing/patient/${patientId}/payments`, { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch patient payments')
    }
  },

  // ==================== INSURANCE ====================
  getInsuranceProviders: async () => {
    try {
      const response = await api.get('/billing/insurance/providers')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch insurance providers')
    }
  },

  createInsuranceProvider: async (data) => {
    try {
      const response = await api.post('/billing/insurance/providers', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create insurance provider')
    }
  },

  getInsuranceClaims: async (params = {}) => {
    try {
      const response = await api.get('/billing/insurance/claims', { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch insurance claims')
    }
  },

  createInsuranceClaim: async (data) => {
    try {
      const response = await api.post('/billing/insurance/claims', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create insurance claim')
    }
  },

  updateClaimStatus: async (id, status, data = {}) => {
    try {
      const response = await api.patch(`/billing/insurance/claims/${id}/status`, { status, ...data })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update claim status')
    }
  }
}

export default billingService