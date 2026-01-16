import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchRecognitions, createRecognition, approveRecognition } from './api'

export function useRecognitions(tenantId) {
  return useInfiniteQuery({
    queryKey: ['recognitions', tenantId || 'default'],
    queryFn: ({ pageParam = 0 }) => fetchRecognitions({ pageParam, tenantId }),
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage || lastPage.length === 0) return undefined
      return pages.length * 20
    },
  })
}

export function useCreateRecognition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createRecognition,
    // optimistic update
    async onMutate(newItem) {
      await qc.cancelQueries({ queryKey: ['recognitions'] })
      const prev = qc.getQueryData(['recognitions'])
      qc.setQueryData(['recognitions'], (old) => {
        if (!old) return old
        const firstPage = old.pages?.[0] ?? []
        const optimistic = { id: `temp-${Date.now()}`, nominee_id: newItem.nominee_id, points: newItem.points, message: newItem.message, status: 'PENDING' }
        const pages = [[optimistic, ...firstPage], ...(old.pages?.slice(1) ?? [])]
        return { ...old, pages }
      })
      return { prev }
    },
    onError(err, variables, context) {
      if (context?.prev) qc.setQueryData(['recognitions'], context.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['recognitions'] }),
  })
}

export function useApproveRecognition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => approveRecognition(id),
    async onMutate(id) {
      await qc.cancelQueries({ queryKey: ['recognitions'] })
      const prev = qc.getQueryData(['recognitions'])
      qc.setQueryData(['recognitions'], (old) => {
        if (!old) return old
        const pages = (old.pages || []).map((page) => page.map((r) => (r.id === id ? { ...r, status: 'APPROVED' } : r)))
        return { ...old, pages }
      })
      return { prev }
    },
    onError(err, variables, context) {
      if (context?.prev) qc.setQueryData(['recognitions'], context.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['recognitions'] }),
  })
}
