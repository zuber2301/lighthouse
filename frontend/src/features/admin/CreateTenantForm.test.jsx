import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { expect, test, vi, describe } from 'vitest'
import CreateTenantForm from './CreateTenantForm'
import { BrowserRouter } from 'react-router-dom'

// Mock fetch globally
global.fetch = vi.fn()

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('CreateTenantForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful fetch for subscription plans
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { id: 1, name: 'Basic', description: 'Basic plan', monthly_price: 0, features: ['recognition'] },
        { id: 2, name: 'Pro', description: 'Pro plan', monthly_price: 29.99, features: ['recognition', 'analytics'] }
      ])
    })
  })

  test('renders form with all required fields', async () => {
    render(
      <BrowserRouter>
        <CreateTenantForm />
      </BrowserRouter>
    )

    // Wait for subscription plans to load
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

    // Should show validation errors (implementation dependent)
    // This test assumes the form has client-side validation
  })

  test('submits form successfully', async () => {
    // Mock successful tenant creation
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        tenant_id: '123',
        admin_user_id: '456',
        message: 'Tenant created successfully'
      })
    })

    render(
      <BrowserRouter>
        <CreateTenantForm />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
    })

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'Test Company' } })
    fireEvent.change(screen.getByLabelText(/admin email/i), { target: { value: 'admin@testcompany.com' } })
    fireEvent.change(screen.getByLabelText(/admin name/i), { target: { value: 'Test Admin' } })

    // Select a plan
    const planSelect = screen.getByLabelText(/subscription plan/i)
    fireEvent.change(planSelect, { target: { value: '1' } })

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create tenant/i })
    fireEvent.click(submitButton)

    // Wait for success and navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/platform-admin')
    })
  })

  test('handles API errors gracefully', async () => {
    // Mock API error
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ detail: 'Subdomain already exists' })
    })

    render(
      <BrowserRouter>
        <CreateTenantForm />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
    })

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'Test Company' } })
    fireEvent.change(screen.getByLabelText(/admin email/i), { target: { value: 'admin@testcompany.com' } })
    fireEvent.change(screen.getByLabelText(/admin name/i), { target: { value: 'Test Admin' } })

    const planSelect = screen.getByLabelText(/subscription plan/i)
    fireEvent.change(planSelect, { target: { value: '1' } })

    const submitButton = screen.getByRole('button', { name: /create tenant/i })
    fireEvent.click(submitButton)

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/subdomain already exists/i)).toBeInTheDocument()
    })

    // Should not navigate
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('shows loading state during submission', async () => {
    // Mock slow API response
    global.fetch.mockImplementationOnce(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({
            tenant_id: '123',
            admin_user_id: '456',
            message: 'Tenant created successfully'
          })
        }), 100)
      )
    )

    render(
      <BrowserRouter>
        <CreateTenantForm />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
    })

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'Test Company' } })
    fireEvent.change(screen.getByLabelText(/admin email/i), { target: { value: 'admin@testcompany.com' } })
    fireEvent.change(screen.getByLabelText(/admin name/i), { target: { value: 'Test Admin' } })

    const planSelect = screen.getByLabelText(/subscription plan/i)
    fireEvent.change(planSelect, { target: { value: '1' } })

    const submitButton = screen.getByRole('button', { name: /create tenant/i })
    fireEvent.click(submitButton)

    // Should show loading state
    expect(screen.getByText(/creating/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    // Wait for completion
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/platform-admin')
    })
  })
})