import React from 'react'

export default function TenantModal({ tenant, onClose, onSelect }) {
  if (!tenant) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-slate-900 rounded-lg w-full max-w-lg p-6 shadow-xl text-white">
        <h3 className="text-lg font-semibold mb-2">{tenant.name}</h3>
        <p className="text-sm text-slate-300 mb-4">Subdomain: {tenant.subdomain}</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-slate-400">ID</div>
          <div className="break-all">{tenant.id}</div>
          <div className="text-slate-400">Status</div>
          <div>{tenant.status ? (tenant.status[0].toUpperCase() + tenant.status.slice(1)) : ''}</div>
          <div className="text-slate-400">Master balance</div>
          <div>₹{((tenant.master_budget_balance||0)/100).toFixed(2)}</div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600">Close</button>
          <button onClick={() => onSelect(tenant)} className="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500">Select Tenant</button>
        </div>
      </div>
    </div>
  )
}
