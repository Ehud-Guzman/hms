import api from '../../../services/api'

const admissionsService = {
  // ==================== WARDS ====================
  getWards: async (params = {}) => {
    try {
      const response = await api.get('/admissions/wards', { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch wards')
    }
  },

  getWard: async (id) => {
    try {
      const response = await api.get(`/admissions/wards/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch ward')
    }
  },

  createWard: async (data) => {
    try {
      const response = await api.post('/admissions/wards', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create ward')
    }
  },

  updateWard: async (id, data) => {
    try {
      const response = await api.patch(`/admissions/wards/${id}`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update ward')
    }
  },

  deleteWard: async (id) => {
    try {
      const response = await api.delete(`/admissions/wards/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete ward')
    }
  },

  // ==================== BEDS ====================
  getAvailableBeds: async (wardId = null) => {
    try {
      const params = wardId ? { wardId } : {}
      const response = await api.get('/admissions/wards/available-beds', { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch available beds')
    }
  },

  createBed: async (data) => {
    try {
      const response = await api.post('/admissions/beds', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create bed')
    }
  },

  updateBed: async (id, data) => {
    try {
      const response = await api.patch(`/admissions/beds/${id}`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update bed')
    }
  },

  deleteBed: async (id) => {
    try {
      const response = await api.delete(`/admissions/beds/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete bed')
    }
  },

  // ==================== ADMISSIONS ====================
  getAdmissions: async (params = {}) => {
    try {
      const response = await api.get('/admissions', { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch admissions')
    }
  },

  getAdmission: async (id) => {
    try {
      const response = await api.get(`/admissions/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch admission')
    }
  },

  getCurrentAdmissions: async () => {
    try {
      const response = await api.get('/admissions/current')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch current admissions')
    }
  },

  createAdmission: async (data) => {
    try {
      const response = await api.post('/admissions', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create admission')
    }
  },

  updateAdmission: async (id, data) => {
    try {
      const response = await api.patch(`/admissions/${id}`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update admission')
    }
  },

  dischargePatient: async (id, data) => {
    try {
      const response = await api.patch(`/admissions/${id}/discharge`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to discharge patient')
    }
  },

  transferPatient: async (id, data) => {
    try {
      const response = await api.patch(`/admissions/${id}/transfer`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to transfer patient')
    }
  },

  cancelAdmission: async (id, reason) => {
    try {
      const response = await api.patch(`/admissions/${id}/cancel`, { reason })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to cancel admission')
    }
  },

  // ==================== STATISTICS ====================
  getAdmissionsStats: async () => {
    try {
      const response = await api.get('/admissions/stats')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch stats')
    }
  },

  getBedOccupancyReport: async () => {
    try {
      const response = await api.get('/admissions/wards/occupancy-report')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch occupancy report')
    }
  }
}

export default admissionsService