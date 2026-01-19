import React from 'react'
import { NavLink } from 'react-router-dom'
import { navLinkClass } from '../utils/navLinkClass'
import { useAuth } from '../lib/AuthContext'
import { useTenant } from '../lib/TenantContext'

import { useTheme } from '../themes/templatemo_602_graph_page/ThemeProvider'

const platformItems = [
  { label: 'Dashboard', href: '/platform-admin' },
  { label: 'Tenant Manager', href: '/platform-admin/tenants' },
  { label: 'Subscription Engine', href: '/platform-admin/subscriptions' },
  { label: 'Global Catalog', href: '/platform-admin/global-catalog' },
  { label: 'System Logs', href: '/platform-admin/logs' },
]

const defaultItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Recognition', href: '/recognition' },
  { label: 'Rewards', href: '/rewards' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Admin ⚙', href: '/admin' },
]

export default function Sidebar() {
  const themed = useTheme()
  const { user: authUser } = useAuth()
  const { selectedTenant } = useTenant()

  const getRoleFromToken = () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        const parts = token.split('.')
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
          if (payload.role) return payload.role
        }
      }
    } catch (err) {
      // ignore and fall back
    }
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const u = JSON.parse(userStr)
        if (u?.role) return u.role
      }
    } catch (err) {
      // ignore
    }
    return authUser?.role || 'CORPORATE_USER'
  }

  const userRole = getRoleFromToken()

  // Role-specific nav
  const tenantAdminItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Recognition', href: '/recognition' },
    { label: 'Rewards', href: '/rewards' },
    { label: 'Analytics', href: '/analytics' },
    { label: 'Admin', href: '/admin' },
    { label: 'Budgets', href: '/admin/budgets' },
  ]

  const tenantLeadItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Recognition', href: '/recognition' },
    { label: 'Rewards', href: '/rewards' },
    { label: 'Analytics', href: '/analytics' },
  ]

  let items = defaultItems
  if (userRole === 'PLATFORM_ADMIN') items = platformItems
  else if (userRole === 'TENANT_ADMIN') items = tenantAdminItems
  else if (userRole === 'TENANT_LEAD') items = tenantLeadItems
  else items = defaultItems

  return (
    <aside className={`w-64 min-h-screen bg-surface border-r border-slate-800 text-slate-100 ${themed ? '': ''}`}>
      <div className="p-6">
        <div className="text-xl font-semibold mb-6">LightHouse</div>
        <nav className="flex flex-col gap-1" role="navigation" aria-label="Main navigation">
          {items.map((it) => (
            <NavLink key={it.href} to={it.href} className={({ isActive }) => navLinkClass(isActive)}>
              {it.label}
            </NavLink>
          ))}
          {/* If platform admin has selected a tenant (impersonating), show a quick link back to tenant view */}
          {userRole === 'PLATFORM_ADMIN' && selectedTenant && (
            <NavLink to={`/tenants/${selectedTenant.id}`} className={({ isActive }) => navLinkClass(isActive)}>
              Back to Tenant: {selectedTenant.name}
            </NavLink>
          )}
        </nav>
      </div>
    </aside>
  )
}
