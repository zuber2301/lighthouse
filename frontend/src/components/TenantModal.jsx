import React from 'react'

export default function TenantModal({ tenant, onClose, onSelect }) {
  if (!tenant) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border-soft rounded-lg w-full max-w-lg p-6 shadow-xl text-text-main">
        <h3 className="text-lg font-semibold mb-2">{tenant.name}</h3>
        <p className="text-sm text-text-main/60 mb-4">Subdomain: {tenant.subdomain}</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-text-main/60">ID</div>
          <div className="break-all">{tenant.id}</div>
          <div className="text-text-main/60">Status</div>
          <div>{tenant.status ? (tenant.status[0].toUpperCase() + tenant.status.slice(1)) : ''}</div>
          <div className="text-text-main/60">Master balance</div>
          <div>₹{((tenant.master_budget_balance||0)/100).toFixed(2)}</div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-3 py-2 rounded-md bg-card border border-indigo-500/10 hover:bg-card/20">Close</button>
          <button onClick={() => onSelect(tenant)} className="px-3 py-2 rounded-md btn-accent">Select Tenant</button>
        </div>
      </div>
    </div>
  )
}
