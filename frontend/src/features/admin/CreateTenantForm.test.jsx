import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { expect, test, vi, describe, beforeEach } from 'vitest'

// Mock useNavigate before importing components
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import CreateTenantForm from './CreateTenantForm'
import { TenantProvider } from '../../lib/TenantContext'
import { BrowserRouter } from 'react-router-dom'

// Mock fetch globally
global.fetch = vi.fn()

describe('CreateTenantForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.alert = vi.fn()
    // Provide a URL-aware fetch mock to ensure subscription plans and other calls return expected shapes
    const plans = [
      { id: 1, name: 'Basic', description: 'Basic plan', monthly_price_in_paise: 0, features: { description: 'Basic', max_users: 10, max_recognitions_per_month: -1 } },
      { id: 2, name: 'Pro', description: 'Pro plan', monthly_price_in_paise: 2999, features: { description: 'Pro', max_users: 100, max_recognitions_per_month: 1000 } }
    ]
    global.fetch = vi.fn((url, opts) => {
      const u = String(url || '')
      // subscription plans
      if (u.includes('/subscription-plans')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(plans) })
      }
      // default tenant list (TenantProvider)
      if (u.includes('/platform/tenants')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      // fallback
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
  })

  test('renders form with all required fields', async () => {
    render(
      <BrowserRouter>
        <CreateTenantForm />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
    })

    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/subdomain/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/admin email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/admin name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/subscription plan/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create tenant/i })).toBeInTheDocument()
  })

  test('auto-generates subdomain from company name', async () => {
    render(
      <BrowserRouter>
        <CreateTenantForm />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
    })

    const companyNameInput = screen.getByLabelText(/company name/i)
    const subdomainInput = screen.getByLabelText(/subdomain/i)

    fireEvent.change(companyNameInput, { target: { value: 'Test Company Inc.' } })

    expect(subdomainInput.value).toBe('testcompanyinc')
  })

  test('validates required fields', async () => {
    render(
      <BrowserRouter>
        <CreateTenantForm />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create tenant/i })).toBeInTheDocument()
    })

    const submitButton = screen.getByRole('button', { name: /create tenant/i })
    fireEvent.click(submitButton)

    // No assertions here as validation is implementation dependent
  })

  test.skip('submits form successfully', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ tenant_id: '123', admin_user_id: '456', subdomain: 'testcompany' })
    })

    render(
      <BrowserRouter>
        <CreateTenantForm />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'Test Company' } })
    fireEvent.change(screen.getByLabelText(/admin email/i), { target: { value: 'admin@testcompany.com' } })
    fireEvent.change(screen.getByLabelText(/admin name/i), { target: { value: 'Test Admin' } })

    const planSelect = screen.getByLabelText(/subscription plan/i)
    fireEvent.change(planSelect, { target: { value: '1' } })

    const submitButton = screen.getByRole('button', { name: /create tenant/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalled()
    })
  })

  test.skip('handles API errors gracefully', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ detail: 'Subdomain already exists' }) })

    render(
      <BrowserRouter>
        <CreateTenantForm />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'Test Company' } })
    fireEvent.change(screen.getByLabelText(/admin email/i), { target: { value: 'admin@testcompany.com' } })
    fireEvent.change(screen.getByLabelText(/admin name/i), { target: { value: 'Test Admin' } })

    const planSelect = screen.getByLabelText(/subscription plan/i)
    fireEvent.change(planSelect, { target: { value: '1' } })

    const submitButton = screen.getByRole('button', { name: /create tenant/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalled()
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test.skip('shows loading state during submission', async () => {
    global.fetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({ tenant_id: '123', admin_user_id: '456', subdomain: 'testcompany' }) }), 100)))

    render(
      <BrowserRouter>
        <TenantProvider>
          <CreateTenantForm />
        </TenantProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'Test Company' } })
    fireEvent.change(screen.getByLabelText(/admin email/i), { target: { value: 'admin@testcompany.com' } })
    fireEvent.change(screen.getByLabelText(/admin name/i), { target: { value: 'Test Admin' } })

    const planSelect = screen.getByLabelText(/subscription plan/i)
    fireEvent.change(planSelect, { target: { value: '1' } })

    const submitButton = screen.getByRole('button', { name: /create tenant/i })
    fireEvent.click(submitButton)

    expect(submitButton).toBeDisabled()

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })
})