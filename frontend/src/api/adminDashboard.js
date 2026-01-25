import api from './axiosClient'

export async function fetchAdminStats(tenantId) {
  try {
    const params = {}
    if (tenantId) params.tenant_id = tenantId
    const res = await api.get('/admin/stats', { params })
    return res.data
  } catch (e) {
    if (e.response && e.response.status === 401) throw new Error('Unauthorized')
    return null
  }
}
