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
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <PageHeader title="Operator View" subtitle="Global SaaS control plane" />
        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => navigate('/platform-admin/logs')}
            className="px-4 py-2 rounded-xl bg-card border border-indigo-500/10 text-text-main text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-500/5 transition-all shadow-sm"
          >
            System Logs
          </button>
          <button 
            onClick={() => navigate('/platform-admin/subscriptions')}
            className="px-4 py-2 rounded-xl btn-accent text-[10px] font-bold uppercase tracking-wider hover:brightness-95 transition-all shadow-md shadow-indigo-600/20"
          >
            Pricing Engine
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-indigo-500 bg-gradient-to-br from-card to-indigo-500/5">
          <p className="text-[10px] font-bold opacity-70 text-text-main uppercase tracking-widest">Aggregated MRR</p>
          <h3 className="text-2xl font-black text-text-main mt-2">₹{((stats.INR || 0) / 100).toLocaleString()}</h3>
          <p className="text-xs text-indigo-500 font-bold mt-1 uppercase tracking-tighter">Growth: +12.5%</p>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-card to-emerald-500/5">
          <p className="text-[10px] font-bold opacity-70 text-text-main uppercase tracking-widest">Total Active Users</p>
          <h3 className="text-2xl font-black text-text-main mt-2">{stats.total_active_users || 0}</h3>
          <p className="text-xs text-emerald-500 font-bold mt-1 uppercase tracking-tighter">Across {tenants.length} tenants</p>
        </Card>
        <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-card to-amber-500/5">
          <p className="text-[10px] font-bold opacity-70 text-text-main uppercase tracking-widest">System Uptime</p>
          <h3 className="text-2xl font-black text-text-main mt-2">{formatUptime(stats.uptime_seconds)}</h3>
          <p className="text-xs text-amber-500 font-bold mt-1 uppercase tracking-tighter">Status: Operational</p>
        </Card>
        <Card className="border-l-4 border-l-rose-500 bg-gradient-to-br from-card to-rose-500/5">
          <p className="text-[10px] font-bold opacity-70 text-text-main uppercase tracking-widest">Top Tenants</p>
          <ul className="mt-2 text-[11px] text-text-main space-y-1">
            {(stats.top_tenants || []).slice(0, 3).map(t => (
              <li key={t.id} className="flex justify-between border-b border-indigo-500/5 pb-1">
                <span className="font-bold opacity-80">{t.name}</span>
                <span className="opacity-40">{t.recognitions} recs</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Tenant Management */}
      <div className="bg-card border border-indigo-500/10 rounded-3xl border border-border-soft shadow-sm-sm overflow-hidden">
        <TenantManager 
          tenants={tenants} 
          onRefresh={fetchTenants}
          onAddTenant={handleAddTenant}
        />
      </div>
    </div>
  )
}