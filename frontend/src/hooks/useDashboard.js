import { useQuery } from '@tanstack/react-query'
import { fetchDashboardStats } from '../api/dashboard'

export function useDashboard() {
  const query = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
    initialData: null,
    // don't aggressively refetch by default
    staleTime: 1000 * 60 * 2,
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  }
}
