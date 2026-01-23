import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, test, vi, describe, beforeEach } from 'vitest'
import { useRecognitions } from './useRecognitions'

// Mock the API functions
vi.mock('../api/recognitions', () => ({
  fetchRecognitions: vi.fn(),
  createRecognition: vi.fn(),
}))

// Mock the announcer and toast hooks
vi.mock('../components/LiveAnnouncer', () => ({
  useAnnounce: () => vi.fn(),
}))

vi.mock('../components/ToastProvider', () => ({
  useToast: () => vi.fn(),
}))

import { fetchRecognitions, createRecognition } from '../api/recognitions'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnMount: true,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useRecognitions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns initial empty array', () => {
    fetchRecognitions.mockResolvedValue([])

    const { result } = renderHook(() => useRecognitions(), {
      wrapper: createWrapper(),
    })

    expect(result.current.items).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  test('loads recognitions successfully', async () => {
    const mockRecognitions = [
      { id: '1', nominee: 'John Doe', points: 50, status: 'approved' },
      { id: '2', nominee: 'Jane Smith', points: 25, status: 'pending' },
    ]

    fetchRecognitions.mockResolvedValue(mockRecognitions)

    const { result } = renderHook(() => useRecognitions(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await waitFor(() => {
      expect(result.current.items).toEqual(mockRecognitions)
    })

    expect(result.current.error).toBe(null)
  })

  test('handles fetch error', async () => {
    const mockError = new Error('Failed to fetch recognitions')
    fetchRecognitions.mockRejectedValue(mockError)

    const { result } = renderHook(() => useRecognitions(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await waitFor(() => {
      expect(result.current.error).toEqual(mockError)
    })

    expect(result.current.items).toEqual([])
  })

  test('creates recognition successfully', async () => {
    const mockRecognition = { nominee: 'John Doe', points: 50, message: 'Great work!' }
    const mockResponse = { id: '1', ...mockRecognition, status: 'pending' }

    fetchRecognitions.mockResolvedValue([])
    createRecognition.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useRecognitions(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    result.current.create(mockRecognition)

    await waitFor(() => {
      expect(createRecognition).toHaveBeenCalledWith(mockRecognition)
    })

    expect(fetchRecognitions).toHaveBeenCalledTimes(2)
  })

  test('handles create recognition error', async () => {
    const mockRecognition = { nominee: 'John Doe', points: 50, message: 'Great work!' }
    const mockError = new Error('Failed to create recognition')

    fetchRecognitions.mockResolvedValue([])
    createRecognition.mockRejectedValue(mockError)

    const { result } = renderHook(() => useRecognitions(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    result.current.create(mockRecognition)

    await waitFor(() => {
      expect(createRecognition).toHaveBeenCalledWith(mockRecognition)
    })

    expect(fetchRecognitions).toHaveBeenCalledTimes(2)
  })

  test('optimistic update adds recognition immediately', async () => {
    const mockRecognition = { nominee: 'John Doe', points: 50, message: 'Great work!' }
    const mockResponse = { id: '1', ...mockRecognition, status: 'pending' }

    fetchRecognitions.mockResolvedValue([])
    createRecognition.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockResponse), 100)))

    const { result } = renderHook(() => useRecognitions(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    result.current.create(mockRecognition)

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1)
    })

    expect(result.current.items[0]).toMatchObject({
      ...mockRecognition,
      when: 'just now',
      status: 'Pending'
    })

    await waitFor(() => {
      expect(createRecognition).toHaveBeenCalledWith(mockRecognition)
    })
  })

  test('createAsync returns promise', async () => {
    const mockRecognition = { nominee: 'John Doe', points: 50, message: 'Great work!' }
    const mockResponse = { id: '1', ...mockRecognition, status: 'pending' }

    fetchRecognitions.mockResolvedValue([])
    createRecognition.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useRecognitions(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const promise = result.current.createAsync(mockRecognition)
    expect(promise).toBeInstanceOf(Promise)

    const response = await promise
    expect(response).toEqual(mockResponse)
  })
})
