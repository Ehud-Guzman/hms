import api from '../../../services/api'

const vitalsService = {
  // Record new vital signs
  recordVitals: async (data) => {
    try {
      const response = await api.post('/vitals', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to record vitals')
    }
  },

  // Get vitals by ID
  getVitals: async (id) => {
    try {
      const response = await api.get(`/vitals/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch vitals')
    }
  },

  // Update vital record
  updateVitals: async (id, data) => {
    try {
      const response = await api.patch(`/vitals/${id}`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update vitals')
    }
  },

  // Delete vital record
  deleteVitals: async (id) => {
    try {
      const response = await api.delete(`/vitals/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete vitals')
    }
  },

  // Get patient vitals history
  getPatientVitals: async (patientId, params = {}) => {
    try {
      const response = await api.get(`/vitals/patient/${patientId}`, { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch patient vitals')
    }
  },

  // Get latest vitals for patient
  getLatestVitals: async (patientId) => {
    try {
      const response = await api.get(`/vitals/patient/${patientId}/latest`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch latest vitals')
    }
  },

  // Get vitals trends
  getVitalsTrends: async (patientId, days = 30) => {
    try {
      const response = await api.get(`/vitals/patient/${patientId}/trends`, { params: { days } })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch trends')
    }
  },

  // Get triage list
  getTriageList: async () => {
    try {
      const response = await api.get('/vitals/triage')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch triage list')
    }
  },

  // Get vitals statistics
  getVitalsStats: async (days = 7) => {
    try {
      const response = await api.get('/vitals/stats', { params: { days } })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch stats')
    }
  }
}

export default vitalsService