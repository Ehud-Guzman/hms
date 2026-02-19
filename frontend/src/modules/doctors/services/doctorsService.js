import api from '../../../services/api'

const doctorsService = {
  // Get all doctors with filters
  getDoctors: async (params = {}) => {
    try {
      const response = await api.get('/doctors', { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch doctors')
    }
  },

  // Get single doctor by ID
  getDoctor: async (id) => {
    try {
      const response = await api.get(`/doctors/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch doctor')
    }
  },

  // Create new doctor
  createDoctor: async (data) => {
    try {
      const response = await api.post('/doctors', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create doctor')
    }
  },

  // Update doctor
  updateDoctor: async (id, data) => {
    try {
      const response = await api.patch(`/doctors/${id}`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update doctor')
    }
  },

  // Delete doctor
  deleteDoctor: async (id) => {
    try {
      const response = await api.delete(`/doctors/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete doctor')
    }
  },

  // Get doctor schedule
  getDoctorSchedule: async (id) => {
    try {
      const response = await api.get(`/doctors/${id}/schedule`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch schedule')
    }
  },

  // Update doctor schedule
  updateDoctorSchedule: async (id, schedule) => {
    try {
      const response = await api.patch(`/doctors/${id}/schedule`, { schedule })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update schedule')
    }
  },

  // Get doctor availability
  getDoctorAvailability: async (id, date) => {
    try {
      const response = await api.get(`/doctors/${id}/availability`, { params: { date } })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch availability')
    }
  },

  // Search doctors
  searchDoctors: async (query) => {
    try {
      const response = await api.get('/doctors/search', { params: { q: query } })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to search doctors')
    }
  },

  // Get all specialties
  getSpecialties: async () => {
    try {
      const response = await api.get('/doctors/specialties')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch specialties')
    }
  }
}

export default doctorsService