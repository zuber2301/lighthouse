import React, { useState, useEffect } from 'react'
import TenantManager from '../../components/TenantManager'
import api from '../../api/axiosClient'

export default function TenantManagerPage() {
  const [tenants, setTenants] = useState([])

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      const res = await api.get('/platform/tenants')
      setTenants(res.data || [])
    } catch (err) {
      console.error('Failed to fetch tenants', err)
    }
  }

  const handleAddTenant = () => {
    // navigate to create tenant page
    window.location.href = '/platform-admin/create-tenant'
  }

  return (
    <div className="p-6">
      <TenantManager tenants={tenants} onRefresh={fetchTenants} onAddTenant={handleAddTenant} />
    </div>
  )
}
