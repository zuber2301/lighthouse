import { useState, useEffect } from 'react'
import api from '../api/axiosClient'

export default function useModuleAccess(tenantId) {
  const [flags, setFlags] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!tenantId) return
    setLoading(true)
    api
      .get(`/platform/tenants/${tenantId}/feature_flags`)
      .then((res) => setFlags(res.data.feature_flags || {}))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [tenantId])

  const canUse = (moduleName) => {
    if (!flags) return true // optimistic allow until known
    return flags[`${moduleName}_enabled`] ?? flags[moduleName] ?? true
  }

  return {
    flags,
    loading,
    error,
    canUse,
    canUseAiCoach: () => canUse('ai_coach'),
    canUseShop: () => canUse('shop'),
  }
}
