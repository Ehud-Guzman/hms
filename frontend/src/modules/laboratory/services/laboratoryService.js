import api from '../../../services/api'

const laboratoryService = {
  // ==================== TESTS CATALOG ====================
  getTests: async (params = {}) => {
    try {
      const response = await api.get('/laboratory/tests', { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch tests')
    }
  },

  getTest: async (id) => {
    try {
      const response = await api.get(`/laboratory/tests/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch test')
    }
  },

  createTest: async (data) => {
    try {
      const response = await api.post('/laboratory/tests', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create test')
    }
  },

  updateTest: async (id, data) => {
    try {
      const response = await api.patch(`/laboratory/tests/${id}`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update test')
    }
  },

  deleteTest: async (id) => {
    try {
      const response = await api.delete(`/laboratory/tests/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete test')
    }
  },

  getTestCategories: async () => {
    try {
      const response = await api.get('/laboratory/tests/categories')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch categories')
    }
  },

  // ==================== LAB ORDERS ====================
  getOrders: async (params = {}) => {
    try {
      const response = await api.get('/laboratory/orders', { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch orders')
    }
  },

  getOrder: async (id) => {
    try {
      const response = await api.get(`/laboratory/orders/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch order')
    }
  },

  createOrder: async (data) => {
    try {
      const response = await api.post('/laboratory/orders', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create order')
    }
  },

  updateOrderStatus: async (id, data) => {
    try {
      const response = await api.patch(`/laboratory/orders/${id}/status`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update order status')
    }
  },

  cancelOrder: async (id, reason) => {
    try {
      const response = await api.patch(`/laboratory/orders/${id}/cancel`, { reason })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to cancel order')
    }
  },

  // ==================== RESULTS ====================
  enterResults: async (id, data) => {
    try {
      const response = await api.post(`/laboratory/orders/${id}/results`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to enter results')
    }
  },

  verifyResults: async (id) => {
    try {
      const response = await api.patch(`/laboratory/orders/${id}/verify`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to verify results')
    }
  },

  getPendingOrders: async () => {
    try {
      const response = await api.get('/laboratory/orders/pending')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch pending orders')
    }
  },

  getCompletedOrders: async () => {
    try {
      const response = await api.get('/laboratory/orders/completed')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch completed orders')
    }
  },

  getOrderStats: async () => {
    try {
      const response = await api.get('/laboratory/orders/stats')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch stats')
    }
  }
}

export default laboratoryService