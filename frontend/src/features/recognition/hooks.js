import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchRecognitions, createRecognition, approveRecognition } from './api'

export function useRecognitions(tenantId) {
  return useInfiniteQuery({
    queryKey: [
      'recognitions',
      tenantId || 'default',
    ],
    queryFn: ({ pageParam = 0 }) => fetchRecognitions({ pageParam, tenantId }),
    getNextPageParam: (lastPage, pages) => {
      // primitive paging: request next offset = pages.length * pageSize
      if (!lastPage || lastPage.length === 0) return undefined
      return pages.length * 20
    },
  })
}

export function useCreateRecognition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createRecognition,
    // optimistic update example: invalidate cache and refetch
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recognitions'] }),
  })
}

export function useApproveRecognition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => approveRecognition(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recognitions'] }),
  })
} 
