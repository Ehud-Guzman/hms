import api from '../../services/api'

const pharmacyService = {
  // ==================== INVENTORY ====================
  getInventory: async (params = {}) => {
    try {
      const response = await api.get('/pharmacy/inventory', { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch inventory')
    }
  },

  getInventoryItem: async (id) => {
    try {
      const response = await api.get(`/pharmacy/inventory/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch item')
    }
  },

  createInventoryItem: async (data) => {
    try {
      const response = await api.post('/pharmacy/inventory', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create item')
    }
  },

  updateInventoryItem: async (id, data) => {
    try {
      const response = await api.patch(`/pharmacy/inventory/${id}`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update item')
    }
  },

  deleteInventoryItem: async (id) => {
    try {
      const response = await api.delete(`/pharmacy/inventory/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete item')
    }
  },

  adjustStock: async (id, data) => {
    try {
      const response = await api.post(`/pharmacy/inventory/${id}/adjust`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to adjust stock')
    }
  },

  getLowStockAlerts: async () => {
    try {
      const response = await api.get('/pharmacy/inventory/alerts/low-stock')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch alerts')
    }
  },

  getInventoryStats: async () => {
    try {
      const response = await api.get('/pharmacy/inventory/stats')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch stats')
    }
  },

  // ==================== PRESCRIPTIONS ====================
  getPrescriptions: async (params = {}) => {
    try {
      const response = await api.get('/pharmacy/prescriptions', { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch prescriptions')
    }
  },

  getPrescription: async (id) => {
    try {
      const response = await api.get(`/pharmacy/prescriptions/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch prescription')
    }
  },

  createPrescription: async (data) => {
    try {
      const response = await api.post('/pharmacy/prescriptions', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create prescription')
    }
  },

  updatePrescription: async (id, data) => {
    try {
      const response = await api.patch(`/pharmacy/prescriptions/${id}`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update prescription')
    }
  },

  cancelPrescription: async (id, reason) => {
    try {
      const response = await api.patch(`/pharmacy/prescriptions/${id}/cancel`, { reason })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to cancel prescription')
    }
  },

  dispensePrescription: async (id, data) => {
    try {
      const response = await api.post(`/pharmacy/prescriptions/${id}/dispense`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to dispense prescription')
    }
  },

  getPendingPrescriptions: async () => {
    try {
      const response = await api.get('/pharmacy/prescriptions/pending')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch pending prescriptions')
    }
  }
}

export default pharmacyService