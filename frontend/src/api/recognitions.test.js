import { expect, test, vi, describe, beforeEach } from 'vitest'
import { fetchRecognitions, createRecognition } from './recognitions'

// Mock fetch globally
global.fetch = vi.fn()

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

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecognitions),
      })

      const result = await fetchRecognitions()

      expect(global.fetch).toHaveBeenCalledWith('/api/recognitions')
      expect(result).toEqual(mockRecognitions)
    })

    test('returns empty array when fetch fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await fetchRecognitions()

      expect(result).toEqual([])
    })

    test('returns empty array when response is not ok', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      })

      const result = await fetchRecognitions()

      expect(result).toEqual([])
    })
  })

  describe('createRecognition', () => {
    test('creates recognition successfully', async () => {
      const payload = { nominee: 'John Doe', points: 50, message: 'Great work!' }
      const mockResponse = { id: '1', ...payload, status: 'pending' }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await createRecognition(payload)

      expect(global.fetch).toHaveBeenCalledWith('/api/recognitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      expect(result).toEqual(mockResponse)
    })

    test('throws error when response is not ok', async () => {
      const payload = { nominee: 'John Doe', points: 50, message: 'Great work!' }

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve('Invalid data'),
      })

      await expect(createRecognition(payload)).rejects.toThrow('Invalid data')
    })

    test('throws error with status text when no response text', async () => {
      const payload = { nominee: 'John Doe', points: 50, message: 'Great work!' }

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve(''),
      })

      await expect(createRecognition(payload)).rejects.toThrow('Internal Server Error')
    })

    test('handles network errors', async () => {
      const payload = { nominee: 'John Doe', points: 50, message: 'Great work!' }

      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(createRecognition(payload)).rejects.toThrow('Network error')
    })
  })
})