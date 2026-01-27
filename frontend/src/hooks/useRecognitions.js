import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchRecognitions, createRecognition } from '../api/recognitions'
import { useAnnounce } from '../components/LiveAnnouncer'
import { useToast } from '../components/ToastProvider'
import confetti from 'canvas-confetti'

export function useRecognitions() {
  const queryClient = useQueryClient()
  const announce = useAnnounce()
  const showToast = useToast()

  const query = useQuery({
    queryKey: ['recognitions'],
    queryFn: fetchRecognitions,
    // keep placeholder data empty while loading
    initialData: [],
  })

  const mutation = useMutation({
    mutationFn: (data) => createRecognition(data),
    onMutate: async (newRec) => {
      await queryClient.cancelQueries({ queryKey: ['recognitions'] })
      const previous = queryClient.getQueryData(['recognitions'])
      const optimistic = { ...newRec, when: 'just now', status: 'Pending' }
      queryClient.setQueryData(['recognitions'], (old = []) => [optimistic, ...old])
      try {
        const msg = `Recognition queued (${newRec.points} points).`
        announce?.(msg)
        showToast?.('Recognition queued', 'info')
      } catch {}
      return { previous }
    },
    onError: (err, newRec, context) => {
      if (context?.previous) queryClient.setQueryData(['recognitions'], context.previous)
      try {
        const errmsg = `Failed to submit recognition: ${err?.message ?? 'unknown error'}`
        announce?.(errmsg)
        showToast?.(errmsg, 'error')
      } catch {}
    },
    onSuccess: (data) => {
      try {
        const msg = `Recognition submitted for ${data.nominee_name} (${data.points ?? '–'} pts).`
        announce?.(msg)
        showToast?.('Recognition submitted', 'success')
        
        // Trigger celebratory confetti
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366F1', '#4f46e5', '#ff6b6b']
        })
      } catch {}
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['recognitions'] })
    },
  })

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    create: mutation.mutate,
    createAsync: mutation.mutateAsync,
  }
} 
