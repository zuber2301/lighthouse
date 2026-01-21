import React, { useEffect, useState } from 'react'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/Card'
import api from '../../api/axiosClient'
import { useTenant } from '../../lib/TenantContext'
import LeadAllocationTable from '../../components/LeadAllocationTable'
import BudgetLoadLogs from '../../components/BudgetLoadLogs'

export default function TenantDashboard() {
  const { selectedTenant } = useTenant()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    let mounted = true

    const fetchDashboard = async () => {
      setLoading(true)
      try {
        const cfg = {}
        if (selectedTenant && selectedTenant.id) cfg.headers = { 'X-Tenant-ID': selectedTenant.id }
        const resp = await api.get('/tenant/dashboard', cfg)
        if (mounted) setData(resp.data)
      } catch (e) {
        console.error('dashboard fetch failed', e)
        if (mounted) setData(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchDashboard()
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
          <LeadAllocationTable tenantId={selectedTenant?.id} onAllocated={() => { 
            // refresh tenant dashboard after allocation
            (async () => {
              try {
                const cfg = {}
                if (selectedTenant && selectedTenant.id) cfg.headers = { 'X-Tenant-ID': selectedTenant.id }
                const resp = await api.get('/tenant/dashboard', cfg)
                setData(resp.data)
              } catch (e) {
                console.error('refresh after allocation failed', e)
              }
            })()
          }} />
        </Card>
        <BudgetLoadLogs tenantId={selectedTenant?.id} />
      </div>

    </div>
  )
}
