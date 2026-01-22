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
  const { user: authUser } = useAuth()
  const { selectedTenant } = useTenant()

  const userRole = authUser?.role || 'CORPORATE_USER'
  const isAdmin = userRole === 'PLATFORM_OWNER' || userRole === 'TENANT_ADMIN'

  const items = NAV_ITEMS[userRole] || NAV_ITEMS.CORPORATE_USER

  const sidebarClass = "bg-sidebar border-r border-border-soft text-text-main shadow-sm"
  const activeLinkClass = "bg-tm-gradient text-tm-bg-dark shadow-tm-neon font-bold"
  const inactiveLinkClass = "text-text-main opacity-60 hover:opacity-100 hover:bg-white/5 transition-all duration-200"

  return (
    <aside className={`w-64 h-screen ${sidebarClass} transition-colors duration-300`}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-8 h-8 rounded-lg bg-tm-gradient flex items-center justify-center shadow-tm-neon">
            <span className="text-tm-bg-dark text-xs">LH</span>
          </div>
          <div className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-tm-teal">LightHouse</div>
        </div>
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
              isActive ? 'bg-indigo-600/20 text-indigo-500' : 'text-text-main opacity-50 hover:bg-indigo-500/5 hover:opacity-100'
            }`}>
              <span className="text-xl">🏢</span>
              <span className="font-medium text-[10px] uppercase tracking-wider">Manage {selectedTenant.name}</span>
            </NavLink>
          )}
        </nav>
      </div>
    </aside>
  )
}
