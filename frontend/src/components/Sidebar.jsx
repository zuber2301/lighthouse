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
  const { user } = useAuth()
  const { selectedTenant } = useTenant()

  const userRole = user?.role || 'CORPORATE_USER'

  const items = userRole === 'PLATFORM_ADMIN' ? platformItems : defaultItems

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
