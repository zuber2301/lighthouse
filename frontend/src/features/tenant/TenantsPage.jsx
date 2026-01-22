import React, { useState, useMemo, useEffect } from 'react'
import PageHeader from '../../components/PageHeader'
import { useTenant } from '../../lib/TenantContext'
import { useNavigate, useLocation } from 'react-router-dom'
import TenantModal from '../../components/TenantModal'

export default function TenantsPage() {
  const { tenants, setSelectedTenantId } = useTenant()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const onSelect = (tenant) => {
    setSelectedTenantId(tenant.id)
    navigate('/tenant-dashboard')
  }

  const [modalTenant, setModalTenant] = useState(null)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 12
  const location = useLocation()

  // open modal if ?open=<id> present
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const openId = params.get('open')
    if (!openId) return
    // wait until tenants loaded
    const t = tenants.find(x => x.id === openId)
    if (t) {
      // set page to the page containing this tenant
      const idx = filtered.findIndex(x => x.id === openId)
      if (idx >= 0) setPage(Math.floor(idx / PAGE_SIZE))
      setModalTenant(t)
    }
  }, [location.search, tenants])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return tenants
    return tenants.filter(t => (
      (t.name && t.name.toLowerCase().includes(term)) ||
      (t.subdomain && t.subdomain.toLowerCase().includes(term)) ||
      (t.id && t.id.toLowerCase().includes(term))
    ))
  }, [tenants, q])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const hashHue = (id) => {
    let h = 0
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360
    return h
  }

  const formatMoney = (paise) => {
    try { return `₹${(paise/100).toFixed(2)}` } catch (e) { return '₹0.00' }
  }

  return (
    <div className="p-6">
      <PageHeader title="Tenants" subtitle="Select a tenant to manage" />

      <div className="mt-4 flex items-center gap-3">
        <label className="text-xs opacity-70 text-text-main mr-2">Tenant</label>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by name, subdomain or id"
          className="px-3 py-2 rounded-md bg-card text-white placeholder-text-main opacity-40 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full max-w-md"
        />
        {q && (
          <button onClick={() => setQ('')} className="text-sm text-text-main opacity-80 hover:text-white">Clear</button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {paged.map(t => {
          const h = hashHue(t.id || '')
          const bg = { backgroundImage: `linear-gradient(135deg, hsl(${h},70%,45%), hsl(${(h+30)%360},70%,40%))` }
          return (
            <button
              key={t.id}
              onClick={() => setModalTenant(t)}
              className="aspect-square rounded-lg p-4 flex flex-col items-start justify-between text-white transition-shadow-sm shadow-sm-md text-left"
              style={bg}
            >
              <div>
                <div className="text-lg font-semibold truncate">{t.name}</div>
                <div className="text-base opacity-80 truncate">{t.subdomain}</div>
              </div>
              <div className="w-full">
                <div className="flex items-center justify-between text-base opacity-90">
                  <span className="text-text-main text-base">{formatMoney(t.master_budget_balance || 0)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[15px] ${t.status === 'active' ? 'bg-emerald-600' : 'bg-amber-600'}`}>{t.status ? (t.status[0].toUpperCase() + t.status.slice(1)) : ''}</span>
                </div>
                <div className="mt-2 text-[14px] text-slate-200 truncate">ID: {t.id}</div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page <= 0} className="px-3 py-1 rounded-md bg-card text-slate-200 hover:bg-surface">Previous</button>
        <div className="text-sm text-text-main opacity-80">Page {page+1} / {totalPages}</div>
        <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page >= totalPages-1} className="px-3 py-1 rounded-md bg-card text-slate-200 hover:bg-surface">Next</button>
      </div>

      <TenantModal tenant={modalTenant} onClose={() => setModalTenant(null)} onSelect={(t) => { setSelectedTenantId(t.id); navigate('/tenant-dashboard') }} />
    </div>
  )
}
