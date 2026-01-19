import React from 'react'
import { NavLink } from 'react-router-dom'
import { navLinkClass } from '../utils/navLinkClass'
import { useAuth } from '../lib/AuthContext'
import { useTenant } from '../lib/TenantContext'

import { useTheme } from '../themes/templatemo_602_graph_page/ThemeProvider'

const NAV_ITEMS = {
  PLATFORM_ADMIN: [
    { label: 'Dashboard', href: '/platform-admin', icon: '📊' },
    { label: 'Tenant Manager', href: '/platform-admin/tenants', icon: '🏢' },
    { label: 'Subscriptions', href: '/platform-admin/subscriptions', icon: '💳' },
    { label: 'Global Catalog', href: '/platform-admin/global-catalog', icon: '🌍' },
    { label: 'System Logs', href: '/platform-admin/logs', icon: '📜' },
  ],
  TENANT_ADMIN: [
    { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { label: 'Recognition Wall', href: '/recognition', icon: '🤝' },
    { label: 'Rewards Store', href: '/rewards', icon: '🎁' },
    { label: 'Analytics', href: '/analytics', icon: '📊' },
    { label: 'Manage Budget', href: '/admin/budgets', icon: '💰' },
    { label: 'Settings', href: '/admin', icon: '⚙️' },
  ],
  TENANT_LEAD: [
    { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { label: 'Recognition Wall', href: '/recognition', icon: '🤝' },
    { label: 'Rewards Store', href: '/rewards', icon: '🎁' },
    { label: 'Team Analytics', href: '/analytics', icon: '📊' },
  ],
  CORPORATE_USER: [
    { label: 'Home', href: '/dashboard', icon: '🏠' },
    { label: 'Wall of Fame', href: '/feed', icon: '🤝' },
    { label: 'Rewards Store', href: '/rewards', icon: '🎁' },
    { label: 'My Activity', href: '/activity', icon: '📜' },
    { label: 'Leaderboard', href: '/leaderboard', icon: '🏆' },
  ],
}

export default function Sidebar() {
  const themed = useTheme()
  const { user: authUser } = useAuth()
  const { selectedTenant } = useTenant()

  const userRole = authUser?.role || 'CORPORATE_USER'

  const items = NAV_ITEMS[userRole] || NAV_ITEMS.CORPORATE_USER

  return (
    <aside className={`w-64 min-h-screen bg-slate-900 border-r border-slate-800 text-slate-100`}>
      <div className="p-6">
        <div className="text-2xl font-bold mb-8 text-indigo-400 px-2">LightHouse</div>
        <nav className="flex flex-col gap-2" role="navigation" aria-label="Main navigation">
          {items.map((it) => (
            <NavLink
              key={it.href}
              to={it.href}
              className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <span className="text-xl">{it.icon}</span>
              <span className="font-medium">{it.label}</span>
            </NavLink>
          ))}

          {userRole === 'PLATFORM_ADMIN' && selectedTenant && (
            <NavLink to={`/tenants/${selectedTenant.id}`} className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition ${
              isActive ? 'bg-slate-700' : 'text-slate-400 hover:bg-slate-800'
            }`}>
              <span className="text-xl">🏢</span>
              <span className="font-medium text-xs">Back to {selectedTenant.name}</span>
            </NavLink>
          )}
        </nav>
      </div>
    </aside>
  )
}
