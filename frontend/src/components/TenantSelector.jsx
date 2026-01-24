import React from 'react'
import { useTenant } from '../lib/TenantContext'

export default function TenantSelector() {
  const { tenants, selectedTenantId, setSelectedTenantId, selectedTenant } = useTenant()

  const onChange = (e) => {
    const val = e.target.value
    setSelectedTenantId(val)
  }

  if (!tenants || tenants.length === 0) return (
    <div className="text-[16px] text-text-main opacity-60">Tenant: —</div>
  )

  return (
    <div className="flex items-center gap-3">
      <span className="text-[13px] font-black uppercase tracking-widest text-white opacity-80">Context:</span>
      <select 
        value={selectedTenantId} 
        onChange={onChange} 
        className="text-[16px] font-bold bg-indigo-500/5 border border-indigo-500/20 text-text-main px-4 py-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all hover:bg-indigo-500/10 active:scale-95 cursor-pointer appearance-none pr-8 relative"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          backgroundSize: '12px'
        }}
      >
        <option value="" className="bg-card">Global Overview</option>
        {tenants.map(t => (
          <option key={t.id} value={t.id} className="bg-card">{t.name}</option>
        ))}
      </select>
    </div>
  )
}
