import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
// Use main CSS (Tailwind + project styles)
import './index.css'
// Ensure Authorization header is injected for platform API calls
import './lib/fetchAuth'
// Dev helper: if VITE_DEV_TOKEN is provided at build/runtime, store it in localStorage if none exists
try {
  const devToken = import.meta.env.VITE_DEV_TOKEN
  if (devToken && !localStorage.getItem('auth_token')) {
    try {
      localStorage.setItem('auth_token', devToken)
      localStorage.setItem('tenant_id', '00000000-0000-0000-0000-000000000000')
      console.info('Dev token and tenant injected into localStorage')
    } catch (e) {
      // ignore storage errors
    }
  }
} catch (e) {
  // import.meta may not be available in some test runners; ignore
}
import { LiveAnnouncerProvider } from './components/LiveAnnouncer'
import { ToastProvider } from './components/ToastProvider'
import { TenantProvider } from './lib/TenantContext'
import DevPersonaSwitcher from './components/DevPersonaSwitcher'

const queryClient = new QueryClient()

const container = document.getElementById('root')
if (!container) throw new Error('Root element not found')
const root = createRoot(container)

root.render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <QueryClientProvider client={queryClient}>
        <LiveAnnouncerProvider>
          <ToastProvider>
            <TenantProvider>
              <App />
            </TenantProvider>
          </ToastProvider>
        </LiveAnnouncerProvider>
        <DevPersonaSwitcher />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
)
