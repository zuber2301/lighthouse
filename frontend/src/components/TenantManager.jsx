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
      <div className="bg-white rounded-3xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Tenant Registry</h2>
            <p className="text-slate-400 mt-1 text-sm font-medium">All companies using LightHouse platform</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all pl-10 text-slate-700 placeholder:text-slate-400"
              />
              <svg className="w-4 h-4 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button 
              onClick={onAddTenant}
              className="bg-indigo-600 text-white px-6 py-2 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition whitespace-nowrap"
            >
              + Add Company
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Company</th>
                <th className="px-8 py-5">Subdomain</th>
                <th className="px-8 py-5">Plan</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 uppercase">Activity</th>
                <th className="px-8 py-5 uppercase">Created</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-slate-50/50 transition duration-150">
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-700">{tenant.name}</div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">
                      {tenant.subdomain}.lighthouse.com
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-xs font-bold text-slate-600">{tenant.plan}</div>
                    <div className="text-[10px] text-slate-400 font-medium">Users: {tenant.user_count ?? '—'}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      tenant.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {tenant.status}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {renderSparkline(tenant.activity_last_7_days)}
                  </td>
                  <td className="px-8 py-5 text-slate-400 text-xs font-medium">
                    {new Date(tenant.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-5 text-right space-x-2">
                    <button 
                      onClick={() => handleStatusToggle(tenant.id, tenant.status)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition ${
                        tenant.status === 'active' 
                          ? 'text-rose-600 border-rose-100 hover:bg-rose-50' 
                          : 'text-emerald-600 border-emerald-100 hover:bg-emerald-50'
                      }`}
                    >
                      {tenant.status === 'active' ? 'SUSPEND' : 'ACTIVATE'}
                    </button>

                    <button
                      onClick={() => openLoadModal(tenant)}
                      title="Load Master Budget"
                      className="text-[10px] px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition"
                    >
                      LOAD BUDGET
                    </button>

                    <button
                      onClick={() => handleImpersonate(tenant.id)}
                      title="Impersonate tenant"
                      className="text-[10px] px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 transition"
                    >
                      👁️ VIEW
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