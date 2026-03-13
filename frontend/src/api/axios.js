import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Restore token from localStorage on app load
const stored = localStorage.getItem('insightforge-auth')
if (stored) {
  try {
    const parsed = JSON.parse(stored)
    if (parsed?.state?.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${parsed.state.token}`
    }
  } catch (_) {}
}

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('insightforge-auth')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
