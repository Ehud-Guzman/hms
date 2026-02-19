import api from '../../../services/api'

const patientsService = {
  // Get all patients with filters
  getPatients: async (params = {}) => {
    try {
      const response = await api.get('/patients', { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch patients')
    }
  },

  // Get single patient by ID
  getPatient: async (id) => {
    try {
      const response = await api.get(`/patients/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch patient')
    }
  },

  // Create new patient
  createPatient: async (data) => {
    try {
      const response = await api.post('/patients', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create patient')
    }
  },

  // Update patient
  updatePatient: async (id, data) => {
    try {
      const response = await api.patch(`/patients/${id}`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update patient')
    }
  },

  // Delete patient
  deletePatient: async (id) => {
    try {
      const response = await api.delete(`/patients/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete patient')
    }
  },

  // Search patients
  searchPatients: async (query) => {
    try {
      const response = await api.get('/patients/search', { params: { q: query } })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to search patients')
    }
  },

  // Get patient statistics
  getPatientStats: async () => {
    try {
      const response = await api.get('/patients/stats')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch patient stats')
    }
  }
}

export default patientsService