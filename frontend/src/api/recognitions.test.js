import { expect, test, vi, describe, beforeEach } from 'vitest'
import { fetchRecognitions, createRecognition } from './recognitions'
import api from './axiosClient'

// Mock axiosClient
vi.mock('./axiosClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('Recognition API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchRecognitions', () => {
    test('fetches recognitions successfully', async () => {
      const mockRecognitions = [
        { id: '1', nominee: 'John Doe', points: 50 },
        { id: '2', nominee: 'Jane Smith', points: 25 },
      ]

      api.get.mockResolvedValueOnce({
        data: mockRecognitions,
      })

      const result = await fetchRecognitions()

      expect(api.get).toHaveBeenCalledWith('/recognition')
      expect(result).toEqual(mockRecognitions)
    })

    test('returns empty array when fetch fails', async () => {
      api.get.mockRejectedValueOnce(new Error('Network error'))

      const result = await fetchRecognitions()

      expect(result).toEqual([])
    })

    test('returns empty array when response is not ok', async () => {
      api.get.mockRejectedValueOnce({
        response: {
          status: 500,
          statusText: 'Internal Server Error',
        },
      })

      const result = await fetchRecognitions()

      expect(result).toEqual([])
    })
  })

  describe('createRecognition', () => {
    test('creates recognition successfully', async () => {
      const payload = { nominee: 'John Doe', points: 50, message: 'Great work!' }
      const mockResponse = { id: '1', ...payload, status: 'pending' }

      api.post.mockResolvedValueOnce({
        data: mockResponse,
      })

      const result = await createRecognition(payload)

      expect(api.post).toHaveBeenCalledWith('/recognition', payload)
      expect(result).toEqual(mockResponse)
    })

    test('throws error when response is not ok', async () => {
      const payload = { nominee: 'John Doe', points: 50, message: 'Great work!' }

      api.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: 'Invalid data',
        },
      })

      await expect(createRecognition(payload)).rejects.toThrow('Invalid data')
    })

    test('throws error with status text when no response text', async () => {
      const payload = { nominee: 'John Doe', points: 50, message: 'Great work!' }

      api.post.mockRejectedValueOnce({
        message: 'Internal Server Error',
      })

      await expect(createRecognition(payload)).rejects.toThrow('Internal Server Error')
    })

    test('handles network errors', async () => {
      const payload = { nominee: 'John Doe', points: 50, message: 'Great work!' }

      api.post.mockRejectedValueOnce(new Error('Network error'))

      await expect(createRecognition(payload)).rejects.toThrow('Network error')
    })
  })
})