import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RecognitionPage from '../RecognitionPage'
import { LiveAnnouncerProvider } from '../../../components/LiveAnnouncer'
import { ToastProvider } from '../../../components/ToastProvider'
import api from '../../../api/axiosClient'

// Mock axiosClient
vi.mock('../../../api/axiosClient', () => ({
  default: {
    get: vi.fn((url) => {
      if (url === '/user/search') return Promise.resolve({ data: [{ id: 'u1', name: 'Test User' }] })
      return Promise.resolve({ data: [] })
    }),
    post: vi.fn((url, body) => Promise.resolve({ data: { id: 1, ...body, when: 'now', status: 'Approved', nominee: 'Test User' } })),
    defaults: { baseURL: '/api' }
  }
}))

afterEach(() => {
  vi.clearAllMocks()
})

test('announces and toasts when nominating', async () => {
  const qc = new QueryClient()

  render(
    <QueryClientProvider client={qc}>
      <LiveAnnouncerProvider>
        <ToastProvider>
          <RecognitionPage />
        </ToastProvider>
      </LiveAnnouncerProvider>
    </QueryClientProvider>
  )

  // open modal
  const nominateBtn = screen.getByRole('button', { name: /nominate/i })
  fireEvent.click(nominateBtn)

  // select a nominee
  const searchInput = screen.getByPlaceholderText(/search teammates/i)
  fireEvent.change(searchInput, { target: { value: 'Test' } })
  
  const userBtn = await screen.findByText(/test user/i)
  fireEvent.click(userBtn)

  // submit the form
  const submit = await screen.findByRole('button', { name: /submit recognition/i })
  fireEvent.click(submit)

  // Wait for toast to appear
  await waitFor(() => expect(screen.getByText(/recognition submitted/i)).toBeInTheDocument(), { timeout: 3000 })

  // Check live region status text contains submission message
  const status = screen.getByRole('status')
  await waitFor(() => expect(status.textContent).toMatch(/recognized|queued|submitted/i))
})
