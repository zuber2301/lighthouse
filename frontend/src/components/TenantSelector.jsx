import React from 'react'
import { useTenant } from '../lib/TenantContext'

export default function TenantSelector() {
  const { tenants, selectedTenantId, setSelectedTenantId, selectedTenant } = useTenant()

  const onChange = (e) => {
    const val = e.target.value
    setSelectedTenantId(val)
  }

  if (!tenants || tenants.length === 0) return (
    <div className="text-sm text-slate-400">Tenant: —</div>
  )

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-slate-400 mr-2">Tenant</label>
      <select value={selectedTenantId} onChange={onChange} className="text-sm bg-slate-800 text-slate-200 px-2 py-1 rounded-md">
        <option value="">Select tenant</option>
        {tenants.map(t => (
          <option key={t.id} value={t.id}>{t.name} ({t.subdomain})</option>
        ))}
      </select>
      {selectedTenant && (
        <div className="text-xs text-slate-400 ml-3">Active: <span className="text-slate-200 font-medium">{selectedTenant.name}</span></div>
      )}
    </div>
  )
}
