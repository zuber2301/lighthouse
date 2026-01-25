import React, { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { navLinkClass } from '../utils/navLinkClass'
import { useAuth } from '../lib/AuthContext'
import { useTenant } from '../lib/TenantContext'
import { usePlatform } from '../context/PlatformContext'
import TenantSelector from './TenantSelector'
import { 
  HomeIcon, 
  RecognitionIcon, 
  RewardsIcon, 
  ActivityIcon, 
  LeaderboardIcon, 
  DashboardIcon, 
  TenantIcon, 
  SubscriptionIcon, 
  GlobalIcon, 
  LogsIcon, 
  BudgetIcon, 
  SettingsIcon 
} from './Icons'

const NAV_ITEMS = {
  PLATFORM_OWNER: [
    { label: 'Dashboard', href: '/platform-admin', icon: DashboardIcon },
    { label: 'Tenant Manager', href: '/platform-admin/tenants', icon: TenantIcon },
    { label: 'Subscriptions', href: '/platform-admin/subscriptions', icon: SubscriptionIcon },
    { label: 'Global Catalog', href: '/platform-admin/global-catalog', icon: GlobalIcon },
    { label: 'Recognition', href: '/recognition', icon: RecognitionIcon },
    { label: 'System Logs', href: '/platform-admin/logs', icon: LogsIcon },
  ],
  TENANT_ADMIN: [
    { label: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { label: 'Manage Budget', href: '/tenant-admin', icon: BudgetIcon },
    { label: 'Recognition Wall', href: '/recognition', icon: RecognitionIcon },
    { label: 'Rewards Store', href: '/rewards', icon: RewardsIcon },
    { label: 'Analytics', href: '/analytics', icon: DashboardIcon },
    { label: 'Settings', href: '/admin', icon: SettingsIcon },
  ],
  TENANT_LEAD: [
    { label: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { label: 'Recognition Wall', href: '/recognition', icon: RecognitionIcon },
    { label: 'Rewards Store', href: '/rewards', icon: RewardsIcon },
    { label: 'Team Analytics', href: '/analytics', icon: DashboardIcon },
  ],
  CORPORATE_USER: [
    { label: 'Home', href: '/dashboard', icon: HomeIcon },
    { label: 'Recognition', href: '/recognition', icon: RecognitionIcon },
    { label: 'Rewards Store', href: '/rewards', icon: RewardsIcon },
    { label: 'My Activity', href: '/activity', icon: ActivityIcon },
    { label: 'Leaderboard', href: '/leaderboard', icon: LeaderboardIcon },
  ],
}

export default function Sidebar() {
  const { user: authUser } = useAuth()
  const { tenants, selectedTenant, setSelectedTenantId } = useTenant()
  const { switchTenant } = usePlatform()

  const userRole = authUser?.role || 'CORPORATE_USER'
  const isAdmin = userRole === 'PLATFORM_OWNER' || userRole === 'TENANT_ADMIN'

  const items = NAV_ITEMS[userRole] || NAV_ITEMS.CORPORATE_USER

  const sidebarClass = "bg-sidebar border-r border-border-soft text-text-main shadow-sm"
  const activeLinkClass = "bg-selected-tab text-selected-tab-alt"
  const inactiveLinkClass = "text-text-main opacity-90 hover:opacity-100 hover:bg-white/5 transition-all duration-200"

  return (
    <aside className={`w-64 h-screen ${sidebarClass} transition-colors duration-300`}>
      <div className="p-6 flex flex-col h-full">
        <Link to="/" className="flex items-center gap-3 mb-8 px-2 hover:opacity-80 transition-opacity group">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shadow-accent-neon active:scale-95 transition-transform">
            <span className="text-white text-[16px]">LH</span>
          </div>
          <div className="text-2xl font-normal tracking-tight text-white">LightHouse</div>
        </Link>
        {/* Tenant selector moved to bottom */}
        <nav className="flex flex-col gap-2" role="navigation" aria-label="Main navigation">
          {items.map((it) => (
            <NavLink
              key={it.href}
              to={it.href}
              className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${isActive ? activeLinkClass : inactiveLinkClass}`}
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-lg ${isActive ? 'bg-accent/20' : 'bg-white/5'}`}>
                    <it.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-normal text-[18px] text-white">{it.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {userRole === 'PLATFORM_OWNER' && selectedTenant && (
            <NavLink to={`/tenants/${selectedTenant.id}`} className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${isActive ? activeLinkClass : inactiveLinkClass}`}>
              <>
                <div className="p-1.5 rounded-lg bg-white/5">
                  <TenantIcon className="w-5 h-5 text-white" />
                </div>
                <span className="font-normal text-[18px] text-white">Manage {selectedTenant.name}</span>
              </>
            </NavLink>
          )}
        </nav>

        {/* Bottom area: tenant selector for PLATFORM_OWNER */}
        {userRole === 'PLATFORM_OWNER' && (
          <div className="mt-auto pt-4 border-t border-indigo-500/5">
            <div className="flex flex-col items-start">
              <TenantSelector label={null} direction="up" compact={true} />

              {/* visible sidebar search removed; search is inside TenantSelector dropdown */}

              <div className="mt-2 flex items-center gap-3 p-3 rounded-xl">
                <div className="p-1.5 rounded-lg bg-white/5">
                  <TenantIcon className="w-5 h-5 text-white" />
                </div>
                <span className="font-normal text-[18px] text-white">Select Tenant</span>
              </div>

              <div className="mt-2 px-3 w-full">
                <label className="flex items-center gap-3 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!selectedTenant}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTenantId('')
                        switchTenant(null)
                      }
                    }}
                    className="w-4 h-4 rounded bg-card border border-indigo-500/10"
                  />
                  <span className="text-white">All Tenants</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
