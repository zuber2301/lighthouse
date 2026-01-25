import api from './axiosClient'

export async function fetchDashboardStats() {
  try {
    const res = await api.get('/dashboard/stats')
    return res.data
  } catch (e) {
    if (e.response && e.response.status === 401) throw new Error('Unauthorized')
    return null
  }
}
