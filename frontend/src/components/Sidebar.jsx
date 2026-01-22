import React from 'react'
import { NavLink } from 'react-router-dom'
import { navLinkClass } from '../utils/navLinkClass'
import { useAuth } from '../lib/AuthContext'
import { useTenant } from '../lib/TenantContext'

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

  const sidebarClass = "bg-card border-r border-border-soft text-text-main"
  const activeLinkClass = "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
  const inactiveLinkClass = "text-text-main opacity-60 hover:opacity-100 hover:bg-surface"

  return (
    <aside className={`w-64 h-screen ${sidebarClass} transition-colors duration-300`}>
      <div className="p-6">
        <div className="text-2xl font-bold mb-8 px-2 text-indigo-600">LightHouse</div>
        <nav className="flex flex-col gap-2" role="navigation" aria-label="Main navigation">
          {items.map((it) => (
            <NavLink
              key={it.href}
              to={it.href}
              className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${isActive ? activeLinkClass : inactiveLinkClass}`}
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
