import api from '../../services/api'



const appointmentsService = {
  // Get all appointments with filters
  getAppointments: async (params = {}) => {
    try {
      const response = await api.get('/appointments', { params })
      return response.data
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
      return { appointments: [] }
    }
  },

  // Get single appointment by ID
  getAppointment: async (id) => {
    try {
      const response = await api.get(`/appointments/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch appointment')
    }
  },

  // Create new appointment
  createAppointment: async (data) => {
    try {
      const response = await api.post('/appointments', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create appointment')
    }
  },

  // Update appointment
  updateAppointment: async (id, data) => {
    try {
      const response = await api.patch(`/appointments/${id}`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update appointment')
    }
  },

  // Cancel appointment
  cancelAppointment: async (id, reason) => {
    try {
      const response = await api.patch(`/appointments/${id}/cancel`, { reason })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to cancel appointment')
    }
  },

  // Check in patient
  checkIn: async (id) => {
    try {
      const response = await api.patch(`/appointments/${id}/check-in`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to check in')
    }
  },

  // Start appointment
  startAppointment: async (id) => {
    try {
      const response = await api.patch(`/appointments/${id}/start`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to start appointment')
    }
  },

  // Complete appointment
  completeAppointment: async (id, data) => {
    try {
      const response = await api.patch(`/appointments/${id}/complete`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to complete appointment')
    }
  },

  // Mark as no-show
  markNoShow: async (id) => {
    try {
      const response = await api.patch(`/appointments/${id}/no-show`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to mark no-show')
    }
  },

  // Reschedule appointment
  rescheduleAppointment: async (id, data) => {
    try {
      const response = await api.patch(`/appointments/${id}/reschedule`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to reschedule')
    }
  },

  // Get available slots
  getAvailableSlots: async (doctorId, date) => {
    try {
      const response = await api.get('/appointments/slots', { params: { doctorId, date } })
      return response.data
    } catch (error) {
      console.error('Failed to fetch slots:', error)
      return { slots: [] }
    }
  },

  // Get today's appointments
  getTodayAppointments: async () => {
    try {
      const response = await api.get('/appointments/today')
      return response.data
    } catch (error) {
      console.error('Failed to fetch today\'s appointments:', error)
      return { appointments: [] }
    }
  },

  // Get waiting list
  getWaitingList: async () => {
    try {
      const response = await api.get('/appointments/waiting')
      return response.data
    } catch (error) {
      console.error('Failed to fetch waiting list:', error)
      return { waiting: [] }
    }
  },

  // Get calendar view
  getCalendar: async (startDate, endDate, doctorId = null) => {
    try {
      const params = { startDate, endDate }
      if (doctorId) params.doctorId = doctorId
      const response = await api.get('/appointments/calendar', { params })
      return response.data
    } catch (error) {
      console.error('Failed to fetch calendar:', error)
      return { calendar: {} }
    }
  },

  // Get patient appointments
  getPatientAppointments: async (patientId, limit = 10) => {
    try {
      const response = await api.get(`/appointments/patient/${patientId}`, { params: { limit } })
      return response.data
    } catch (error) {
      console.error('Failed to fetch patient appointments:', error)
      return { appointments: [] }
    }
  },

  // Get doctor appointments
  getDoctorAppointments: async (doctorId, date = null) => {
    try {
      const params = date ? { date } : {}
      const response = await api.get(`/appointments/doctor/${doctorId}`, { params })
      return response.data
    } catch (error) {
      console.error('Failed to fetch doctor appointments:', error)
      return { appointments: [] }
    }
  },

  // Get appointment statistics
  getAppointmentStats: async () => {
    try {
      const response = await api.get('/appointments/stats')
      return response.data
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      return { stats: { today: { total: 0 }, current: { checkedIn: 0, waiting: 0, inProgress: 0 } } }
    }
  }
}

export default appointmentsService