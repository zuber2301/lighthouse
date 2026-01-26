import api from '../../lib/api'

export async function fetchRecognitions({ pageParam = 0, tenantId } = {}) {
  const res = await api.get('/recognition', { params: { offset: pageParam, limit: 20 } })
  return res.data
}

export async function createRecognition(payload) {
  const res = await api.post('/recognition', payload)
  return res.data
}

export async function approveRecognition(id) {
  const res = await api.post(`/recognition/${id}/approve`)
  return res.data
}

export async function highFiveRecognition(id) {
  const res = await api.post(`/recognition/${id}/high-five`)
  return res.data
}
