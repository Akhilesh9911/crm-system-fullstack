import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('crm_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Only redirect if NOT already on auth pages
      const authPages = ['/login', '/register', '/forgot-password', '/reset-password']
      const currentPath = window.location.pathname
      
      if (!authPages.some(page => currentPath.startsWith(page))) {
        // Clear auth data
        localStorage.removeItem('crm_token')
        localStorage.removeItem('crm_user')
        
        // Redirect to login
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api
