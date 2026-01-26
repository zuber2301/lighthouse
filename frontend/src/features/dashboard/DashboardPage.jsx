import React, { useState } from 'react'
import { useAuth } from '../../lib/AuthContext'
import CorporateUserDashboard from '../admin/CorporateUserDashboard'
import TenantDashboard from '../tenant/TenantDashboard'
import TenantLeadDashboard from '../admin/TenantLeadDashboard'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
import LeadBudgetTable from '../../components/LeadBudgetTable'
import RecognitionChart from '../../components/RecognitionChart'
import RecognitionFeed from './RecognitionFeed'
import NominateModal from '../recognition/NominateModal'
import { useRecognitions } from '../../hooks/useRecognitions'
import { useDashboard } from '../../hooks/useDashboard'
import { usePlatform } from '../../context/PlatformContext'
import { useTenantMicroStats } from '../../hooks/useTenantMicroStats'
import TenantMicroView from './TenantMicroView'
import ThemeHero from '../../themes/templatemo_602_graph_page/ThemeHero'
import useTemplatemoTheme from '../../themes/templatemo_602_graph_page/useTemplatemoTheme'

export default function DashboardPage() {
  const [open, setOpen] = useState(false)
  const { user, isLoading: isAuthLoading } = useAuth()
  const { selectedTenant: platformSelectedTenant } = usePlatform()

  useTemplatemoTheme()

  const isTenantAdmin = user?.role === 'TENANT_ADMIN' || user?.role === 'TENANT_LEAD'
  const selectedTenant = isTenantAdmin && user?.tenant_id
    ? { id: user.tenant_id, name: user.tenant_name || 'My Tenant' }
    : platformSelectedTenant

  const isTenantMode = Boolean(selectedTenant)
  const isPlatformAdmin = user?.role === 'PLATFORM_OWNER' || user?.role === 'SUPER_ADMIN'

  const { create } = useRecognitions()
  const { data: globalData, isLoading: isGlobalLoading } = useDashboard()
  const { data: tenantStats, isLoading: isTenantLoading } = useTenantMicroStats(
    (isPlatformAdmin && selectedTenant?.id) ? selectedTenant.id : null
  )

  const handleSubmit = (item) => {
    // Use the shared recognitions mutation so Dashboard nominations appear in Recognition list
    create(item)
  }

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tm-teal"></div>
      </div>
    )
  }

  if (user?.role === 'CORPORATE_USER') {
    return <CorporateUserDashboard />
  }

  if (user?.role === 'TENANT_ADMIN') {
    return <TenantDashboard />
  }

  if (user?.role === 'TENANT_LEAD') {
    return <TenantLeadDashboard />
  }

  const subtitle = isTenantMode
    ? `Tenant insights for ${selectedTenant?.name}`
    : "What's happening right now?"

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={subtitle}
        actions={<button onClick={() => setOpen(true)} className="px-4 py-1.5 rounded-full btn-recognition text-xs font-normal transition-all shadow-lg">Nominate</button>}
      />
      <div className="bg-surface p-6 rounded-lg border border-border-soft transition-colors duration-300">
        {isTenantMode ? (
          <TenantMicroView tenant={selectedTenant} stats={tenantStats} loading={isTenantLoading} />
        ) : (
          <>
            <div className="mb-6">
              <ThemeHero />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <div data-theme="graph-stat-card" style={{ transform: 'translateY(20px)', opacity: 0 }} className="group card-base p-4 hover:-translate-y-1 transform transition-all duration-200 hover:shadow-sm-tm-neon focus-within:shadow-sm-tm-neon">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-tm-teal to-tm-teal-2 text-tm-bg-dark">📊</div>
                    <div className="text-sm opacity-70 text-text-main font-normal">{globalData?.role === 'SUPER_ADMIN' || globalData?.role === 'PLATFORM_OWNER' ? 'Total Tenants' : 'Recognitions (30d)'}</div>
                  </div>
                  <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-tm-teal">{isGlobalLoading ? '—' : (globalData?.role === 'SUPER_ADMIN' || globalData?.role === 'PLATFORM_OWNER' ? (globalData?.total_tenants ?? '—') : (globalData?.recognitions_30d ?? '—'))}</div>
                  <div className="text-sm opacity-70 text-text-main">{globalData?.role === 'SUPER_ADMIN' || globalData?.role === 'PLATFORM_OWNER' ? 'Overview across all tenants' : 'Recognitions in the last 30 days for this tenant'}</div>
                  <div className="mt-3 h-14">
                    <canvas className="w-full h-full" id="miniChart1" />
                  </div>
                </div>
              </Card>
              <Card>
                <div data-theme="graph-stat-card" style={{ transform: 'translateY(20px)', opacity: 0 }} className="group card-base p-4 hover:-translate-y-1 transform transition-all duration-200 hover:shadow-sm-tm-neon focus-within:shadow-sm-tm-neon">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-tm-teal to-tm-teal-2 text-tm-bg-dark">👥</div>
                    <div className="text-sm opacity-70 text-text-main font-normal">Active Users</div>
                  </div>
                  <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-tm-teal">{isGlobalLoading ? '—' : (globalData?.active_users ?? globalData?.total_users ?? '—')}</div>
                  <div className="text-sm opacity-70 text-text-main">Real-time analytics showing active users currently engaging with the platform.</div>
                  <div className="mt-3 h-14">
                    <canvas className="w-full h-full" id="miniChart2" />
                  </div>
                </div>
              </Card>

              <Card>
                <div data-theme="graph-stat-card" style={{ transform: 'translateY(20px)', opacity: 0 }} className="group card-base p-4 hover:-translate-y-1 transform transition-all duration-200 hover:shadow-sm-tm-neon focus-within:shadow-sm-tm-neon">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-tm-teal to-tm-teal-2 text-tm-bg-dark">🎯</div>
                    <div className="text-sm opacity-70 text-text-main font-normal">Points Distributed (30d)</div>
                  </div>
                  <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-tm-teal">{isGlobalLoading ? '—' : (globalData?.points_distributed_30d ?? globalData?.points_awarded_total ?? '—')}</div>
                  <div className="text-sm opacity-70 text-text-main">Points distributed on the platform in the last 30 days.</div>
                  <div className="mt-3 h-14">
                    <canvas className="w-full h-full" id="miniChart3" />
                  </div>
                </div>
              </Card>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold">Lead Budget</div>
                    <div className="text-sm opacity-70 text-text-main">Track remaining leader budgets</div>
                  </div>
                  <span className="text-xs uppercase tracking-wide text-text-muted">Live</span>
                </div>
                <LeadBudgetTable budget={globalData?.lead_budget} loading={isGlobalLoading} />
              </Card>
              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold">Recognition Trend</div>
                    <div className="text-sm opacity-70 text-text-main">Daily recognitions (last 14 days)</div>
                  </div>
                  <span className="text-xs uppercase tracking-wide text-text-muted">Insights</span>
                </div>
                <RecognitionChart timeSeries={globalData?.role === 'SUPER_ADMIN' || globalData?.role === 'PLATFORM_OWNER' ? null : globalData?.time_series} loading={isGlobalLoading} />
              </Card>
            </div>

            <Card className="col-span-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">Recent Recognition Feed</div>
                  <div className="text-sm opacity-70 text-text-main">Immutable ledger-backed activity</div>
                </div>
                <div className="text-sm opacity-70 text-text-main">Feed — Redis-backed (live)</div>
              </div>

              <div className="mt-4">
                <RecognitionFeed />
              </div>
            </Card>
          </>
        )}
      </div>

      <NominateModal open={open} onClose={() => setOpen(false)} onSubmit={handleSubmit} />
    </div>
  )
}
