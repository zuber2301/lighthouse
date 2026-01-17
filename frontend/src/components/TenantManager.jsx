import React from 'react'
import Card from './Card'

const TenantManager = ({ tenants, onRefresh, onAddTenant }) => {
  const handleStatusToggle = async (tenantId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
    try {
      const response = await fetch(`/api/platform/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (response.ok) {
        onRefresh()
      }
    } catch (error) {
      console.error('Failed to update tenant status:', error)
    }
  }

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Tenant Registry</h2>
          <p className="text-slate-400 mt-1">All companies using LightHouse platform</p>
        </div>
        <button 
          onClick={onAddTenant}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition"
        >
          + Add New Company
        </button>
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
            {tenants.map((tenant) => (
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
                  <span className="px-3 py-1 bg-slate-800 rounded-full text-xs font-medium">
                    {tenant.plan}
                  </span>
                </td>
                <td className="p-5">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    tenant.status === 'active' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-rose-900/50 text-rose-400'
                  }`}>
                    {tenant.status}
                  </span>
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TenantManager