import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RecognitionPage from '../RecognitionPage'
import { LiveAnnouncerProvider } from '../../../components/LiveAnnouncer'
import { ToastProvider } from '../../../components/ToastProvider'

// Mock fetch for GET and POST
beforeEach(() => {
  global.fetch = vi.fn((input, init) => {
    if (typeof input === 'string' && input.endsWith('/api/recognitions')) {
      if (init && init.method === 'POST') {
        const body = JSON.parse(init.body)
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 1, ...body, when: 'now', status: 'Approved' }) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    }
    return Promise.resolve({ ok: false })
  })
})

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

  // submit the form (default nominee/points)
  const submit = await screen.findByRole('button', { name: /submit recognition/i })
  fireEvent.click(submit)

  // Wait for toast to appear
  await waitFor(() => expect(screen.getByText(/recognition submitted/i)).toBeInTheDocument(), { timeout: 3000 })

  // Check live region status text contains submission message
  const status = screen.getByRole('status')
  await waitFor(() => expect(status.textContent).toMatch(/recognized|queued|submitted/i))
})
