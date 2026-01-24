import React from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axiosClient'
import { useTenant } from '../lib/TenantContext'
import OnboardTenantDrawer from './OnboardTenantDrawer'
import LoadBudgetModal from './LoadBudgetModal'
import confetti from 'canvas-confetti'

const TenantManager = ({ tenants, onRefresh, onAddTenant }) => {
  const navigate = useNavigate()
  const { setSelectedTenantId } = useTenant()
  const [modalOpen, setModalOpen] = React.useState(false)
  const [activeTenant, setActiveTenant] = React.useState(null)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)

  const filteredTenants = React.useMemo(() => {
    if (!searchTerm) return tenants
    const low = searchTerm.toLowerCase()
    return tenants.filter(t => 
      t.name?.toLowerCase().includes(low) || 
      t.subdomain?.toLowerCase().includes(low) ||
      t.admin_email?.toLowerCase().includes(low)
    )
  }, [tenants, searchTerm])

  const handleStatusToggle = async (tenantId, currentStatus) => {
    try {
      if (currentStatus === 'active') {
        const response = await api.post(`/platform/tenants/${tenantId}/suspend`)
        if (response.status === 200) onRefresh()
      } else {
        const response = await api.post(`/platform/tenants/${tenantId}/unsuspend`)
        if (response.status === 200) onRefresh()
      }
    } catch (error) {
      console.error('Failed to update tenant status:', error)
    }
  }

  const handleImpersonate = (tenantId) => {
    try {
      setSelectedTenantId(tenantId)
      navigate('/tenant-dashboard')
    } catch (e) {
      console.error('Failed to impersonate tenant', e)
    }
  }

  const openLoadModal = (tenant) => {
    setActiveTenant(tenant)
    setModalOpen(true)
  }

  const handleLoaded = (data) => {
    onRefresh && onRefresh()
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#a855f7', '#ec4899']
    })
  }

  const renderSparkline = (data = []) => {
    const w = 80
    const h = 24
    const max = Math.max(...data, 1)
    const step = data.length > 1 ? w / (data.length - 1) : w
    const points = data.map((v, i) => `${i * step},${h - (v / max) * h}`).join(' ')
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="inline-block align-middle">
        <polyline points={points} fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  const formatMoney = (v) => {
    if (v == null) return '—'
    if (typeof v === 'number') return `₹${(v / 100).toLocaleString()}`
    return v
  }

  return (
    <>
      <div className="bg-card border border-indigo-500/5 rounded-lg overflow-auto styled-scrollbar max-h-[70vh] shadow-sm transition-colors duration-300">
        <div className="p-8 border-b border-indigo-500/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-normal text-text-main tracking-tight">Tenant Registry</h2>
            <p className="opacity-40 text-text-main mt-1 text-[15px] font-normal uppercase tracking-widest">Global SaaS Control Plane</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <input
                type="text"
                placeholder="Search by company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-indigo-500/10 border border-indigo-500/20 rounded-md px-5 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-indigo-500/20 transition-all pl-12 text-text-main placeholder:text-text-main/50 font-normal"
              />
              <svg className="w-5 h-5 absolute left-4 top-3.5 opacity-30 text-text-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="btn-accent px-8 py-3 rounded-md text-[14px] font-black uppercase tracking-wider shadow-xl hover:scale-[1.02] transition-all whitespace-nowrap active:scale-95"
            >
              + Create Tenant
            </button>
          </div>
        </div>

        <div className="overflow-x-auto styled-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-indigo-500/5 text-text-main text-[16px] font-semibold border-b border-indigo-500/5">
              <tr>
                <th className="px-8 py-6 text-center border-r border-indigo-500/10 last:border-r-0">Company</th>
                <th className="px-8 py-6 text-center border-r border-indigo-500/10 last:border-r-0">Subdomain</th>
                <th className="px-8 py-6 text-center border-r border-indigo-500/10 last:border-r-0">Plan</th>
                <th className="px-8 py-6 text-center border-r border-indigo-500/10 last:border-r-0">Budget Allocated</th>
                <th className="px-8 py-6 text-center border-r border-indigo-500/10 last:border-r-0">Budget Consumed</th>
                <th className="px-8 py-6 text-center border-r border-indigo-500/10 last:border-r-0">Budget left %</th>
                <th className="px-8 py-6 text-center border-r border-indigo-500/10 last:border-r-0">Status</th>
                <th className="px-8 py-6 text-center border-r border-indigo-500/10 last:border-r-0">Activity</th>
                <th className="px-8 py-6 text-center border-r border-indigo-500/10 last:border-r-0">Created</th>
                <th className="px-8 py-6 text-center font-normal">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-500/5">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-indigo-500/5 transition duration-150 group">
                  <td className="px-8 py-6 text-center border-r border-indigo-500/10 last:border-r-0">
                      <div className="font-normal text-[18px] text-text-main tracking-tight group-hover:text-indigo-500 transition-colors text-center">{tenant.name}</div>
                    </td>
                    <td className="px-8 py-6 text-center border-r border-indigo-500/10 last:border-r-0">
                      <span className="text-[14px] font-normal text-indigo-400/90 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-all inline-block">
                        {tenant.subdomain}.lighthouse.com
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center border-r border-indigo-500/10 last:border-r-0">
                      <div className="text-[16px] font-semibold text-text-main tracking-tight italic">{tenant.plan}</div>
                      <div className="text-[13px] opacity-40 text-text-main font-normal mt-1 uppercase tracking-tighter">USERS: {tenant.user_count ?? '—'}</div>
                    </td>
                    <td className="px-8 py-6 text-center border-r border-indigo-500/10 last:border-r-0">
                      <div className="text-[15px] font-normal text-text-main">{formatMoney(tenant.budget_allocated)}</div>
                    </td>
                    <td className="px-8 py-6 text-center border-r border-indigo-500/10 last:border-r-0">
                      <div className="text-[15px] font-normal text-text-main">{formatMoney(tenant.budget_consumed)}</div>
                    </td>
                    <td className="px-8 py-6 text-center border-r border-indigo-500/10 last:border-r-0">
                      <div className="text-[15px] font-normal text-text-main">
                        {(() => {
                          const a = tenant.budget_allocated
                          const c = tenant.budget_consumed
                          if (a == null || typeof a !== 'number' || a === 0) return '—'
                          const percent = Math.round(((a - (c || 0)) / a) * 100)
                          return `${percent}%`
                        })()}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center border-r border-indigo-500/10 last:border-r-0">
                      <div className={`inline-flex px-3.5 py-1.5 rounded-xl text-[12px] font-normal uppercase tracking-[0.1em] ${
                        tenant.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      }`}>
                        {tenant.status}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center border-r border-indigo-500/10 last:border-r-0">
                      <div className="opacity-60 group-hover:opacity-100 transition-opacity inline-block">
                        {renderSparkline(tenant.activity_last_7_days)}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center opacity-80 text-text-main text-[15px] font-normal border-r border-indigo-500/10 last:border-r-0">
                      {new Date(tenant.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleStatusToggle(tenant.id, tenant.status)}
                        className={`text-[12px] font-normal tracking-widest px-4 py-2 rounded-xl border transition-all active:scale-95 ${
                          tenant.status === 'active' 
                            ? 'text-rose-500 border-rose-500/20 hover:bg-rose-500/20' 
                            : 'text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                        }`}
                      >
                        {tenant.status === 'active' ? 'SUSPEND' : 'ACTIVATE'}
                      </button>

                      <button
                        onClick={() => openLoadModal(tenant)}
                        title="Load Master Budget"
                        className="text-[12px] px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/10 text-text-main font-normal tracking-widest hover:bg-indigo-500/20 transition-all active:scale-95"
                      >
                        BUDGET
                      </button>

                      <button
                        onClick={() => handleImpersonate(tenant.id)}
                        title="Impersonate tenant"
                        className="text-[12px] px-4 py-2 rounded-xl btn-accent font-normal tracking-widest hover:brightness-95 transition-all shadow-lg active:scale-95"
                      >
                        ENTER
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <LoadBudgetModal open={modalOpen} onClose={() => setModalOpen(false)} tenant={activeTenant} onLoaded={handleLoaded} />
      <OnboardTenantDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} onRefresh={onRefresh} />
    </>
  )
}

export default TenantManager
