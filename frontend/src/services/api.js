// src/api/api.js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`

    // Always grab the latest hospitalId from window (set by AppLayout)
    const hospitalId = window.selectedTenantId || localStorage.getItem('hospitalId')
    if (hospitalId) config.headers['x-hospital-id'] = hospitalId

    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('hospitalId')
      localStorage.removeItem('user')
    }

    error.formattedMessage =
      error.response?.data?.message || error.message || 'An error occurred'

    return Promise.reject(error)
  }
)

export default api
