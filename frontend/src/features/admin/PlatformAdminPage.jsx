import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
import TenantManager from '../../components/TenantManager'
import api from '../../lib/api'

export default function PlatformAdminPage() {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState([])
  const [stats, setStats] = useState({})

  const formatUptime = (secs) => {
    if (!secs) return '—'
    const d = Math.floor(secs / 86400)
    const h = Math.floor((secs % 86400) / 3600)
    const m = Math.floor((secs % 3600) / 60)
    return `${d}d ${h}h ${m}m`
  }

  useEffect(() => {
    fetchTenants()
    fetchStats()
  }, [])

  const fetchTenants = async () => {
    try {
      const response = await api.get('/platform/tenants')
      setTenants(response.data || [])
    } catch (error) {
      console.error('Failed to fetch tenants:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/platform/overview')
      setStats(response.data || {})
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleAddTenant = () => {
    navigate('/platform-admin/create-tenant')
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-tm-bg-dark to-surface p-6 rounded-xl">
        <PageHeader title="Platform Owner" subtitle="Global SaaS control plane" />

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <h3 className="text-2xl font-bold text-indigo-400">₹{((stats.mrr_paise || 0) / 100).toLocaleString()}</h3>
            <p className="text-slate-400">Aggregated MRR</p>
          </Card>
          <Card>
            <h3 className="text-2xl font-bold text-emerald-400">{stats.total_active_users || 0}</h3>
            <p className="text-slate-400">Total Active Users</p>
          </Card>
          <Card>
            <h3 className="text-2xl font-bold text-amber-400">{formatUptime(stats.uptime_seconds)}</h3>
            <p className="text-slate-400">System Uptime</p>
          </Card>
          <Card>
            <h3 className="text-2xl font-bold text-pink-400">Top Tenants</h3>
            <ul className="mt-2 text-sm text-slate-300 space-y-1">
              {(stats.top_tenants || []).map(t => (
                <li key={t.id} className="flex justify-between">
                  <span>{t.name}</span>
                  <span className="text-slate-400">{t.recognitions} recs</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* Tenant Management */}
      <TenantManager 
        tenants={tenants} 
        onRefresh={fetchTenants}
        onAddTenant={handleAddTenant}
      />
    </div>
  )
}