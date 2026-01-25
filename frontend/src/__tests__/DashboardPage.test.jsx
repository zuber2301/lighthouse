import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import DashboardPage from '../features/dashboard/DashboardPage'

vi.mock('../lib/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'TENANT_ADMIN' } }),
}))

vi.mock('../context/PlatformContext', () => ({
  usePlatform: () => ({ selectedTenant: null, switchTenant: vi.fn() }),
}))

vi.mock('../hooks/useTenantMicroStats', () => ({
  useTenantMicroStats: () => ({ data: null, isLoading: false }),
}))

vi.mock('../hooks/useRecognitions', () => ({
  useRecognitions: () => ({ create: vi.fn() }),
}))

vi.mock('../hooks/useDashboard', () => ({
  useDashboard: () => ({
    data: {
      role: 'TENANT_ADMIN',
      active_users: 42,
      recognitions_30d: 17,
      points_distributed_30d: 400,
      lead_budget: {
        master_balance_paise: 500000,
        leads: [
          { id: 'lead-1', name: 'Lead One', amount_paise: 250000 },
          { id: 'lead-2', name: 'Lead Two', amount_paise: 150000 },
        ],
      },
      time_series: {
        labels: ['2026-01-01', '2026-01-02'],
        recognitions: [4, 7],
      },
    },
    isLoading: false,
  }),
}))

describe('DashboardPage', () => {
  it('renders lead budget and recognition widgets', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )
    expect(screen.getByText(/Lead Budget/i)).toBeDefined()
    expect(screen.getByText(/Recognition Trend/i)).toBeDefined()
    expect(screen.getByText(/Lead One/)).toBeDefined()
    expect(screen.getByText(/Lead Two/)).toBeDefined()
    expect(screen.getByText(/Recognition History/)).toBeDefined()
    expect(screen.getByText(/2026-01-01/)).toBeDefined()
  })
})
