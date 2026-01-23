import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
import TenantManager from '../../components/TenantManager'
import usePlatformPulse from '../../hooks/usePlatformPulse'
import api from '../../api/axiosClient'

export default function PlatformAdminPage() {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState([])
  const [stats, setStats] = useState({})
  const { events } = usePlatformPulse()

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
    // handled by drawer inside TenantManager now, but keeping for compatibility
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto styled-scrollbar">
      <div className="flex justify-between items-end">
        <PageHeader title="Super User View" subtitle="Global SaaS control plane" />
        <div className="flex gap-3 mb-8">
          <button 
            onClick={() => navigate('/platform-admin/logs')}
            className="px-5 py-2.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-text-main text-[13px] font-normal uppercase tracking-widest hover:bg-indigo-500/10 transition-all shadow-lg active:scale-95"
          >
            System Logs
          </button>
          <button 
            onClick={() => navigate('/platform-admin/subscriptions')}
            className="px-5 py-2.5 rounded-2xl btn-accent text-[13px] font-normal uppercase tracking-widest hover:brightness-95 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
          >
            Pricing Engine
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-[6px] border-l-indigo-500 bg-gradient-to-br from-indigo-500/10 to-transparent hover:shadow-2xl hover:shadow-indigo-500/10 hover:translate-y-[-4px] transition-all border border-indigo-500/5">
          <p className="text-[12px] font-normal opacity-60 text-text-main uppercase tracking-widest leading-none">Aggregated MRR</p>
          <h3 className="text-4xl font-normal text-text-main mt-4">₹{((stats.INR || 0) / 100).toLocaleString()}</h3>
          <p className="text-[11px] text-indigo-400 font-normal mt-2 uppercase tracking-widest opacity-80">Growth: +12.5%</p>
        </Card>
        <Card className="border-l-[6px] border-l-emerald-500 bg-gradient-to-br from-emerald-500/10 to-transparent hover:shadow-2xl hover:shadow-emerald-500/10 hover:translate-y-[-4px] transition-all border border-emerald-500/5">
          <p className="text-[12px] font-normal opacity-60 text-text-main uppercase tracking-widest leading-none">Active Users</p>
          <h3 className="text-4xl font-normal text-text-main mt-4">{stats.total_active_users || 0}</h3>
          <p className="text-[11px] text-emerald-400 font-normal mt-2 uppercase tracking-widest opacity-80">Across {tenants.length} tenants</p>
        </Card>
        <Card className="border-l-[6px] border-l-amber-500 bg-gradient-to-br from-amber-500/10 to-transparent hover:shadow-2xl hover:shadow-amber-500/10 hover:translate-y-[-4px] transition-all border border-amber-500/5">
          <p className="text-[12px] font-normal opacity-60 text-text-main uppercase tracking-widest leading-none">System Uptime</p>
          <h3 className="text-4xl font-normal text-text-main mt-4 truncate">{formatUptime(stats.uptime_seconds)}</h3>
          <p className="text-[11px] text-amber-400 font-normal mt-2 uppercase tracking-widest opacity-80">Status: Operational</p>
        </Card>
        <Card className="border-l-[6px] border-l-rose-500 bg-gradient-to-br from-rose-500/10 to-transparent hover:shadow-2xl hover:shadow-rose-500/10 hover:translate-y-[-4px] transition-all border border-rose-500/5">
          <p className="text-[12px] font-normal opacity-60 text-text-main uppercase tracking-widest leading-none">Top Tenants</p>
          <ul className="mt-4 text-[13px] text-text-main space-y-2">
            {(stats.top_tenants || []).slice(0, 3).map(t => (
              <li key={t.id} className="flex justify-between border-b border-indigo-500/10 pb-2">
                <span className="font-normal opacity-80">{t.name}</span>
                <span className="opacity-60 font-normal uppercase text-[10px] text-rose-400">{t.recognitions} recs</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <TenantManager 
            tenants={tenants} 
            onRefresh={fetchTenants}
            onAddTenant={handleAddTenant}
          />
        </div>
        
        <div className="lg:col-span-1">
          <Card className="h-full border border-indigo-500/10 bg-card/60 backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[12px] font-normal opacity-60 text-text-main uppercase tracking-widest">Platform Pulse</h3>
              <div className="text-[10px] font-bold text-emerald-500 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                LIVE
              </div>
            </div>
            
            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar styled-scrollbar">
              {events.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-[13px] text-text-main opacity-40 italic">Waiting for signals...</p>
                </div>
              ) : (
                events.map((event, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs z-10 relative ${
                        event.type === 'provision' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {event.type === 'provision' ? '🚀' : '💰'}
                      </div>
                    </div>
                    <div>
                      <p className="text-[13px] text-text-main font-bold truncate max-w-[120px]">{event.name || event.tenant_name}</p>
                      <p className="text-[11px] text-text-main opacity-60">
                        {event.type === 'provision' ? 'Provisioned' : `Loaded ₹${event.amount}`}
                      </p>
                      <p className="text-[9px] text-text-main opacity-30 uppercase mt-1">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
