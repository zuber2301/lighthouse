import { useState, useEffect } from 'react'
import api from '../lib/api'

export function useMilestones() {
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMilestones = async () => {
    try {
      // Note: Endpoint matching the one created in backend/app/api/milestones.py
      const response = await api.get('/milestones/today')
      setMilestones(response.data || [])
    } catch (error) {
      console.error('Failed to fetch milestones:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMilestones()
  }, [])

  return { milestones, loading, refresh: fetchMilestones }
}
