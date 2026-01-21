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
      <select 
        value={selectedTenantId} 
        onChange={onChange} 
        className="text-xs bg-slate-800/50 border border-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-full focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all hover:bg-slate-800"
      >
        <option value="">Select Tenant Context</option>
        {tenants.map(t => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    </div>
  )
}
