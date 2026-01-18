import React, { useEffect, useState } from 'react'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/Card'
import { API_BASE } from '../../lib/api'
import { useTenant } from '../../lib/TenantContext'

export default function TenantDashboard() {
  const { selectedTenant } = useTenant()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const headers = {}
        if (selectedTenant && selectedTenant.id) headers['X-Tenant-ID'] = selectedTenant.id
        const resp = await fetch(`${API_BASE}/tenant/dashboard`, { headers })
        if (!resp.ok) {
          console.error('dashboard fetch failed', resp.status)
          if (mounted) setData(null)
          return
        }
        const j = await resp.json()
        if (mounted) setData(j)
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [selectedTenant])

  if (loading) return <div className="p-6">Loading...</div>
  if (!data) return <div className="p-6">No data available</div>

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Tenant Dashboard" subtitle={selectedTenant ? `${selectedTenant.name}` : ''} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-2xl font-bold text-indigo-400">{data.active_users}</h3>
          <p className="text-slate-400">Active Users</p>
        </Card>
        <Card>
          <h3 className="text-2xl font-bold text-emerald-400">{data.recognitions_30d}</h3>
          <p className="text-slate-400">Recognitions (30d)</p>
        </Card>
        <Card>
          <h3 className="text-2xl font-bold text-amber-400">{data.points_distributed_30d}</h3>
          <p className="text-slate-400">Points Distributed (30d)</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold text-lg mb-3">Top Employees</h3>
          <ul className="space-y-2">
            {data.top_employees.map(te => (
              <li key={te.id} className="flex justify-between">
                <span>{te.name}</span>
                <span className="font-bold">{te.points} pts</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="font-bold text-lg mb-3">Redemptions (30d)</h3>
          <p>Count: {data.redemptions_30d.count}</p>
          <p>Points spent: {data.redemptions_30d.points_spent}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold text-lg mb-3">Budget Overview</h3>
          <p>Master balance: ₹{(data.lead_budget.master_balance_paise/100).toFixed(2)}</p>
          {data.lead_budget.leads.length === 0 ? (
            <p className="text-slate-400">No lead budgets allocated</p>
          ) : (
            <ul className="space-y-2 mt-2">
              {data.lead_budget.leads.map(l => (
                <li key={l.id} className="flex justify-between">
                  <span>{l.name}</span>
                  <span className="font-bold">₹{(l.amount_paise/100).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3 className="font-bold text-lg mb-3">Recognition Trend (7d)</h3>
          <ul className="space-y-1">
            {data.time_series.labels.map((lbl, idx) => (
              <li key={lbl} className="flex justify-between">
                <span className="text-sm text-slate-500">{lbl}</span>
                <span className="font-bold">{data.time_series.recognitions[idx]}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

    </div>
  )
}
