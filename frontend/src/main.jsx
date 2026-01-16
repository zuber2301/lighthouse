import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/tailwind.css'
import { LiveAnnouncerProvider } from './components/LiveAnnouncer'
import { ToastProvider } from './components/ToastProvider'

const queryClient = new QueryClient()

const container = document.getElementById('root')
if (!container) throw new Error('Root element not found')
const root = createRoot(container)

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <LiveAnnouncerProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </LiveAnnouncerProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
)
