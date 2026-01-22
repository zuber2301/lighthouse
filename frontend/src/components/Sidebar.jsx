import React from 'react'
import { NavLink } from 'react-router-dom'
import { navLinkClass } from '../utils/navLinkClass'
import { useAuth } from '../lib/AuthContext'
import { useTenant } from '../lib/TenantContext'

import { useTheme } from '../themes/templatemo_602_graph_page/ThemeProvider'

const NAV_ITEMS = {
  PLATFORM_OWNER: [
    { label: 'Dashboard', href: '/platform-admin', icon: '📊' },
    { label: 'Tenant Manager', href: '/platform-admin/tenants', icon: '🏢' },
    { label: 'Subscriptions', href: '/platform-admin/subscriptions', icon: '💳' },
    { label: 'Global Catalog', href: '/platform-admin/global-catalog', icon: '🌍' },
    { label: 'System Logs', href: '/platform-admin/logs', icon: '📜' },
  ],
  TENANT_ADMIN: [
    { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { label: 'Manage Budget', href: '/tenant-admin', icon: '💰' },
    { label: 'Recognition Wall', href: '/recognition', icon: '🤝' },
    { label: 'Rewards Store', href: '/rewards', icon: '🎁' },
    { label: 'Analytics', href: '/analytics', icon: '📊' },
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
  const isAdmin = userRole === 'PLATFORM_OWNER' || userRole === 'TENANT_ADMIN'

  const items = NAV_ITEMS[userRole] || NAV_ITEMS.CORPORATE_USER

  const sidebarClass = isAdmin 
    ? "bg-white/80 backdrop-blur-xl border-r border-slate-200 text-slate-800" 
    : "bg-slate-900 border-r border-slate-800 text-slate-100"

  const activeLinkClass = isAdmin
    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
    : "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
  
  const inactiveLinkClass = isAdmin
    ? "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    : "text-slate-400 hover:bg-slate-800 hover:text-white"

  return (
    <aside className={`w-64 h-screen ${sidebarClass}`}>
      <div className="p-6">
        <div className={`text-2xl font-bold mb-8 px-2 ${isAdmin ? 'text-indigo-600' : 'text-indigo-400'}`}>LightHouse</div>
        <nav className="flex flex-col gap-2" role="navigation" aria-label="Main navigation">
          {items.map((it) => (
            <NavLink
              key={it.href}
              to={it.href}
              className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition ${isActive ? activeLinkClass : inactiveLinkClass}`}
            >
              <span className="text-xl">{it.icon}</span>
              <span className="font-medium">{it.label}</span>
            </NavLink>
          ))}

          {userRole === 'PLATFORM_OWNER' && selectedTenant && (
            <NavLink to={`/tenants/${selectedTenant.id}`} className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition ${
              isActive ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:bg-slate-100'
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
