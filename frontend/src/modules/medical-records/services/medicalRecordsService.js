import api from '../../../services/api'

const medicalRecordsService = {
  // ==================== RECORDS ====================
  getRecords: async (params = {}) => {
    try {
      const response = await api.get('/medical-records', { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch records')
    }
  },

  getRecord: async (id) => {
    try {
      const response = await api.get(`/medical-records/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch record')
    }
  },

  createRecord: async (data) => {
    try {
      const response = await api.post('/medical-records', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create record')
    }
  },

  updateRecord: async (id, data) => {
    try {
      const response = await api.patch(`/medical-records/${id}`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update record')
    }
  },

  deleteRecord: async (id) => {
    try {
      const response = await api.delete(`/medical-records/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete record')
    }
  },

  // ==================== PATIENT RECORDS ====================
  getPatientRecords: async (patientId, params = {}) => {
    try {
      const response = await api.get(`/medical-records/patient/${patientId}`, { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch patient records')
    }
  },

  getPatientSummary: async (patientId) => {
    try {
      const response = await api.get(`/medical-records/patient/${patientId}/summary`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch patient summary')
    }
  },

  getPatientTimeline: async (patientId) => {
    try {
      const response = await api.get(`/medical-records/patient/${patientId}/timeline`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch patient timeline')
    }
  },

  // ==================== STATISTICS ====================
  getRecordStats: async () => {
    try {
      const response = await api.get('/medical-records/stats')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch stats')
    }
  },

  // ==================== ICD-10 ====================
  searchICD10: async (query) => {
    try {
      const response = await api.get('/medical-records/icd10/search', { params: { q: query } })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to search ICD-10')
    }
  },

  // ==================== ATTACHMENTS ====================
  addAttachment: async (recordId, file) => {
    const formData = new FormData()
    formData.append('attachment', file)
    try {
      const response = await api.post(`/medical-records/${recordId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add attachment')
    }
  },

  removeAttachment: async (recordId, filename) => {
    try {
      const response = await api.delete(`/medical-records/${recordId}/attachments`, {
        data: { filename }
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to remove attachment')
    }
  }
}

export default medicalRecordsService