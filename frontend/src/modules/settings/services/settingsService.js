import api from '../../../services/api'

const settingsService = {
  // ==================== GENERAL SETTINGS ====================
  getSettings: async () => {
    try {
      const response = await api.get('/settings')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch settings')
    }
  },

  updateSettings: async (data) => {
    try {
      const response = await api.patch('/settings', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update settings')
    }
  },

  resetSettings: async () => {
    try {
      const response = await api.post('/settings/reset')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to reset settings')
    }
  },

  // ==================== BRANDING ====================
  getBranding: async () => {
    try {
      const response = await api.get('/settings/branding')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch branding')
    }
  },

  updateBranding: async (data) => {
    try {
      const response = await api.patch('/settings/branding', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update branding')
    }
  },

  uploadLogo: async (file) => {
    const formData = new FormData()
    formData.append('logo', file)
    try {
      const response = await api.post('/settings/branding/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to upload logo')
    }
  },

  removeLogo: async () => {
    try {
      const response = await api.delete('/settings/branding/logo')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to remove logo')
    }
  },

  // ==================== BUSINESS HOURS ====================
  getBusinessHours: async () => {
    try {
      const response = await api.get('/settings/hours')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch business hours')
    }
  },

  updateBusinessHours: async (data) => {
    try {
      const response = await api.patch('/settings/hours', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update business hours')
    }
  },

  addHoliday: async (data) => {
    try {
      const response = await api.post('/settings/hours/holidays', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add holiday')
    }
  },

  removeHoliday: async (date) => {
    try {
      const response = await api.delete(`/settings/hours/holidays/${date}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to remove holiday')
    }
  },

  // ==================== NOTIFICATIONS ====================
  getNotificationSettings: async () => {
    try {
      const response = await api.get('/settings/notifications')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch notification settings')
    }
  },

  updateNotificationSettings: async (data) => {
    try {
      const response = await api.patch('/settings/notifications', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update notification settings')
    }
  },

  getTemplates: async () => {
    try {
      const response = await api.get('/settings/notifications/templates')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch templates')
    }
  },

  updateTemplate: async (templateId, data) => {
    try {
      const response = await api.patch(`/settings/notifications/templates/${templateId}`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update template')
    }
  },

  testNotification: async (data) => {
    try {
      const response = await api.post('/settings/notifications/test', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send test notification')
    }
  },

  // ==================== FEATURE FLAGS ====================
  getFeatures: async () => {
    try {
      const response = await api.get('/settings/features')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch features')
    }
  },

  updateFeatures: async (data) => {
    try {
      const response = await api.patch('/settings/features', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update features')
    }
  },

  checkFeature: async (feature) => {
    try {
      const response = await api.get(`/settings/features/${feature}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to check feature')
    }
  },

  // ==================== BACKUP & RESTORE ====================
  exportSettings: async () => {
    try {
      const response = await api.get('/settings/export', { responseType: 'blob' })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to export settings')
    }
  },

  importSettings: async (file) => {
    const formData = new FormData()
    formData.append('backup', file)
    try {
      const response = await api.post('/settings/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to import settings')
    }
  },

  // ==================== AUDIT LOGS ====================
  getAuditLogs: async (params = {}) => {
    try {
      const response = await api.get('/audit-logs', { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch audit logs')
    }
  },

  // ==================== SECURITY (if separate endpoints exist) ====================
  getSecuritySettings: async () => {
    // Placeholder – adjust if you have specific security endpoints
    try {
      const response = await api.get('/settings/security')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch security settings')
    }
  },

  updateSecuritySettings: async (data) => {
    try {
      const response = await api.patch('/settings/security', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update security settings')
    }
  },

  // ==================== INTEGRATIONS ====================
  getIntegrations: async () => {
    try {
      const response = await api.get('/settings/integrations')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch integrations')
    }
  },

  // ==================== HOSPITALS ====================
getHospitals: async () => {
  try {
    const response = await api.get('/settings/hospitals') 
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch hospitals')
  }
},


  updateIntegration: async (id, data) => {
    try {
      const response = await api.patch(`/settings/integrations/${id}`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update integration')
    }
  }
}

export default settingsService