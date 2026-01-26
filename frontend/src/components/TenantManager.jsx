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
      <div className="bg-card border border-indigo-500/5 rounded-lg shadow-sm transition-colors duration-300 w-full overflow-hidden">
        <div className="p-6 border-b border-indigo-500/5 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <h2 className="text-2xl font-normal text-text-main tracking-tight">Tenant Registry</h2>
            <p className="opacity-40 text-text-main mt-1 text-[13px] font-normal uppercase tracking-widest">Global SaaS Control Plane</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search by company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-indigo-500/5 border border-indigo-500/10 rounded-md px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-indigo-500/10 transition-all pl-10 text-text-main placeholder:text-text-main/30"
              />
              <svg className="w-4 h-4 absolute left-3.5 top-3 opacity-20 text-text-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="w-full sm:w-auto btn-accent px-6 py-2.5 rounded-md text-[13px] font-normal uppercase tracking-wider shadow-lg hover:brightness-105 transition-all whitespace-nowrap active:scale-95"
            >
              + Create Tenant
            </button>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[72vh] styled-scrollbar">
          <table className="w-full text-left table-auto border-separate border-spacing-0">
            <thead className="bg-indigo-500/8 backdrop-blur-md sticky top-0 z-20 border-b border-indigo-500/20">
              <tr className="text-[11px] text-text-main font-semibold uppercase tracking-wider">
                <th className="px-4 py-4 whitespace-nowrap text-left text-indigo-300">Company</th>
                <th className="px-4 py-4 text-center hidden sm:table-cell text-indigo-300">Subdomain</th>
                <th className="px-4 py-4 text-center hidden md:table-cell text-indigo-300">Plan</th>
                <th className="px-4 py-4 text-center hidden lg:table-cell text-indigo-300">Users</th>
                <th className="px-4 py-4 text-center hidden xl:table-cell text-indigo-300">Allocated</th>
                <th className="px-4 py-4 text-center hidden 2xl:table-cell text-indigo-300">Consumed</th>
                <th className="px-4 py-4 text-center hidden lg:table-cell text-indigo-300">Left %</th>
                <th className="px-4 py-4 text-center text-indigo-300">Status</th>
                <th className="px-4 py-4 text-center hidden 2xl:table-cell text-indigo-300">Created</th>
                <th className="px-4 py-4 text-right text-indigo-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-500/5">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-indigo-500/5 transition duration-150 group">
                  <td className="px-4 py-5 border-b border-indigo-500/5">
                      <div className="font-normal text-[14px] text-text-main tracking-tight group-hover:text-indigo-500 transition-colors whitespace-nowrap">{tenant.name}</div>
                    </td>
                    <td className="px-4 py-5 text-center hidden sm:table-cell border-b border-indigo-500/5">
                      <span className="text-[11px] font-normal text-indigo-400/90 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-all inline-block">
                        {tenant.subdomain}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-center hidden md:table-cell border-b border-indigo-500/5">
                      <div className="text-[12px] font-normal text-text-main tracking-tight uppercase">{tenant.plan}</div>
                    </td>
                    <td className="px-4 py-5 text-center hidden lg:table-cell border-b border-indigo-500/5">
                      <div className="text-[14px] font-normal text-indigo-400">{tenant.user_count ?? '0'}</div>
                    </td>
                    <td className="px-4 py-5 text-center hidden xl:table-cell text-sm text-text-main border-b border-indigo-500/5">
                      {formatMoney(tenant.budget_allocated)}
                    </td>
                    <td className="px-4 py-5 text-center hidden 2xl:table-cell text-sm text-text-main border-b border-indigo-500/5">
                      {formatMoney(tenant.budget_consumed)}
                    </td>
                    <td className="px-4 py-5 text-center hidden lg:table-cell border-b border-indigo-500/5">
                      <div className="text-[13px] font-normal text-text-main">
                        {(() => {
                          const a = tenant.budget_allocated
                          const c = tenant.budget_consumed
                          if (a == null || typeof a !== 'number' || a === 0) return '—'
                          const percent = Math.round(((a - (c || 0)) / a) * 100)
                          return `${percent}%`
                        })()}
                      </div>
                    </td>
                    <td className="px-4 py-5 text-center border-b border-indigo-500/5">
                      <div className={`inline-flex px-2 py-1 rounded text-[10px] font-normal uppercase tracking-wider ${
                        tenant.status === 'active' ? 'bg-teal-500/10 text-teal-500 border border-teal-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      }`}>
                        {tenant.status}
                      </div>
                    </td>
                    <td className="px-4 py-5 text-center hidden 2xl:table-cell opacity-70 text-text-main text-[12px] font-normal whitespace-nowrap border-b border-indigo-500/5">
                      {new Date(tenant.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-5 text-right whitespace-nowrap border-b border-indigo-500/5">
                      <div className="flex items-center justify-end gap-2 text-nowrap">
                      <button 
                        onClick={() => handleStatusToggle(tenant.id, tenant.status)}
                        className={`text-[10px] font-normal tracking-tight px-2.5 py-1.5 rounded border transition-all active:scale-95 uppercase ${
                          tenant.status === 'active' 
                            ? 'text-rose-500 border-rose-500/20 hover:bg-rose-500/20' 
                            : 'text-teal-500 border-teal-500/20 hover:bg-teal-500/20'
                        }`}
                      >
                        {tenant.status === 'active' ? 'SUSPEND' : 'ACTIVATE'}
                      </button>
                      
                      <button
                        onClick={() => openLoadModal(tenant)}
                        title="Load Master Budget"
                        className="text-[10px] px-2.5 py-1.5 rounded bg-indigo-500/10 border border-indigo-500/10 text-text-main font-normal tracking-tight uppercase hover:bg-indigo-500/20 transition-all active:scale-95"
                      >
                        BUDGET
                      </button>

                      <button
                        onClick={() => handleImpersonate(tenant.id)}
                        title="Impersonate tenant"
                        className="text-[10px] px-2.5 py-1.5 rounded btn-accent font-normal tracking-tight uppercase hover:brightness-95 transition-all shadow-md active:scale-95"
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
