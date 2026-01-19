import axios from 'axios'

const base = import.meta.env.VITE_BACKEND_URL || '/api'

const api = axios.create({
  baseURL: base,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('lighthouse_token') || localStorage.getItem('VITE_DEV_TOKEN')
    if (token) config.headers['Authorization'] = `Bearer ${token}`
    const tenant = localStorage.getItem('selected_tenant_id') || localStorage.getItem('tenant_id')
    if (tenant) config.headers['X-Tenant-ID'] = tenant
  } catch (e) {
    // ignore
  }
  return config
}, (err) => Promise.reject(err))

export default api
