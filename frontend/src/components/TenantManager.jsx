import React from 'react'
import Card from './Card'
import api from '../api/axiosClient'
import LoadBudgetModal from './LoadBudgetModal'
import { useNavigate } from 'react-router-dom'
import { useTenant } from '../lib/TenantContext'

const TenantManager = ({ tenants, onRefresh, onAddTenant }) => {
  const navigate = useNavigate()
  const { setSelectedTenantId } = useTenant()
  const [modalOpen, setModalOpen] = React.useState(false)
  const [activeTenant, setActiveTenant] = React.useState(null)
  const [searchTerm, setSearchTerm] = React.useState('')

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
    // refresh tenant list after successful load
    onRefresh && onRefresh()
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

  return (
    <>
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold">Tenant Registry</h2>
            <p className="text-slate-400 mt-1">All companies using LightHouse platform</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all pl-10"
              />
              <svg className="w-4 h-4 absolute left-3 top-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button 
              onClick={onAddTenant}
              className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition whitespace-nowrap"
            >
              + Add Company
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-5 font-semibold">Company</th>
                <th className="p-5 font-semibold">Subdomain</th>
                <th className="p-5 font-semibold">Plan</th>
                <th className="p-5 font-semibold">Status</th>
                <th className="p-5 font-semibold">Created</th>
                <th className="p-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-5">
                    <div className="font-bold text-slate-200">{tenant.name}</div>
                  </td>
                  <td className="p-5 text-indigo-400 font-mono text-sm">
                    <a href={`https://${tenant.subdomain}.lighthouse.com`} target="_blank" rel="noopener noreferrer">
                      {tenant.subdomain}.lighthouse.com
                    </a>
                  </td>
                  <td className="p-5">
                    <div className="text-sm">{tenant.plan}</div>
                    <div className="text-xs text-slate-400">Users: {tenant.user_count ?? '—'}</div>
                  </td>
                  <td className="p-5">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      tenant.status === 'active' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-rose-900/50 text-rose-400'
                    }`}>
                      {tenant.status}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Billing: {tenant.last_billing_date || '—'}</div>
                  </td>
                  <td className="p-5">
                    {renderSparkline(tenant.activity_last_7_days)}
                  </td>
                  <td className="p-5 text-slate-400 text-sm">
                    {new Date(tenant.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-5 text-right space-x-3">
                    <button 
                      onClick={() => handleStatusToggle(tenant.id, tenant.status)}
                      className={`text-sm font-semibold px-3 py-1 rounded ${
                        tenant.status === 'active' 
                          ? 'text-rose-400 hover:bg-rose-900/20' 
                          : 'text-emerald-400 hover:bg-emerald-900/20'
                      } transition`}
                    >
                      {tenant.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>

                    <button
                      onClick={() => openLoadModal(tenant)}
                      title="Load Master Budget"
                      className="text-sm px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition ml-2"
                    >
                      Load Master Budget
                    </button>

                    <button
                      onClick={() => handleImpersonate(tenant.id)}
                      title="Impersonate tenant"
                      className="text-sm px-3 py-1 rounded text-slate-300 hover:bg-slate-800/40 transition"
                    >
                      👁️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <LoadBudgetModal open={modalOpen} onClose={() => setModalOpen(false)} tenant={activeTenant} onLoaded={handleLoaded} />
    </>
  )
}

export default TenantManager