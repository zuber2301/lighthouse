// Recognition API helpers (converted to JS)

import api from './axiosClient'

export async function fetchRecognitions() {
  try {
    const res = await api.get('/recognition')
    return res.data
  } catch (e) {
    if (e.response && e.response.status === 401) throw new Error('Unauthorized')
    return []
  }
}

export async function createRecognition(payload) {
  try {
    const res = await api.post('/recognition', payload)
    return res.data
  } catch (e) {
    if (e.response && e.response.status === 401) throw new Error('Unauthorized')
    const msg = e.response?.data || e.message
    throw new Error(msg)
  }
}
