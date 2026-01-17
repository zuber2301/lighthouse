import React from 'react'
import { NavLink } from 'react-router-dom'
import { navLinkClass } from '../utils/navLinkClass'

const items = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Recognition', href: '/recognition' },
  { label: 'Rewards', href: '/rewards' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Admin ⚙', href: '/admin' },
  { label: '🏢 Platform Admin', href: '/platform-admin' },
  { label: '💼 Tenant Admin', href: '/tenant-admin' },
  { label: '👔 Tenant Lead', href: '/tenant-lead' },
  { label: '👤 Corporate User', href: '/corporate-user' },
]

import { useTheme } from '../themes/templatemo_602_graph_page/ThemeProvider'

export default function Sidebar() {
  const themed = useTheme()
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
        </nav>
      </div>
    </aside>
  )
}
