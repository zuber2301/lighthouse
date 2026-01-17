import React, { useState, useEffect } from 'react'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
import OnboardTenantModal from '../../components/OnboardTenantModal'
import TenantManager from '../../components/TenantManager'

export default function PlatformAdminPage() {
  const [showModal, setShowModal] = useState(false)
  const [tenants, setTenants] = useState([])
  const [stats, setStats] = useState({})

  useEffect(() => {
    fetchTenants()
    fetchStats()
  }, [])

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/platform/tenants')
      const data = await response.json()
      setTenants(data)
    } catch (error) {
      console.error('Failed to fetch tenants:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/platform/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleOnboardTenant = async (tenantData) => {
    try {
      const response = await fetch('/api/platform/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tenantData)
      })
      if (response.ok) {
        fetchTenants()
        fetchStats()
        setShowModal(false)
      }
    } catch (error) {
      console.error('Failed to onboard tenant:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-tm-bg-dark to-surface p-6 rounded-xl">
        <PageHeader title="Platform Admin" subtitle="Global SaaS control plane" />

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <h3 className="text-2xl font-bold text-indigo-400">{stats.total_tenants || 0}</h3>
            <p className="text-slate-400">Total Tenants</p>
          </Card>
          <Card>
            <h3 className="text-2xl font-bold text-emerald-400">{stats.active_tenants || 0}</h3>
            <p className="text-slate-400">Active Tenants</p>
          </Card>
          <Card>
            <h3 className="text-2xl font-bold text-amber-400">₹{(stats.total_revenue_paise || 0) / 100}</h3>
            <p className="text-slate-400">Monthly Revenue</p>
          </Card>
        </div>
      </div>

      {/* Tenant Management */}
      <TenantManager 
        tenants={tenants} 
        onRefresh={fetchTenants}
        onAddTenant={() => setShowModal(true)}
      />

      <OnboardTenantModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onSave={handleOnboardTenant}
      />
    </div>
  )
}