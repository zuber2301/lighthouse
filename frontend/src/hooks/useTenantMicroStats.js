import { useQuery } from '@tanstack/react-query'
import { fetchAdminStats } from '../api/adminDashboard'

export function useTenantMicroStats(tenantId) {
  return useQuery({
    queryKey: ['tenant', tenantId, 'stats'],
    queryFn: () => fetchAdminStats(tenantId),
    enabled: Boolean(tenantId),
    staleTime: 1000 * 60 * 2,
  })
}
