import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

const tabs = [
  { name: 'Dashboard', path: '/' },
  { name: 'Recognition', path: '/recognition' },
  { name: 'Rewards', path: '/rewards' },
  { name: 'Analytics', path: '/analytics' },
  { name: 'Admin', path: '/admin', role: 'PLATFORM_ADMIN' },
]

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  const userRole = user?.role || 'CORPORATE_USER'

  return (
    <header className={`flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[rgba(10,14,39,0.95)] backdrop-blur-md`}>
      <div className="flex items-center gap-4">
        <div className="text-lg font-semibold">LightHouse</div>
        <div className="text-sm text-slate-400">Tenant: ACME Corp ▾</div>
      </div>

      <nav className="flex items-center gap-6">
        {tabs.filter(tab => !tab.role || tab.role === userRole).map(tab => (
          <Link
            key={tab.path}
            to={tab.path}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              location.pathname === tab.path
                ? 'bg-indigo-600 text-white transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-tm-teal'
                : 'text-slate-300 hover:text-white hover:bg-slate-700 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-tm-teal'
            }`}
          >
            {tab.name}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <button className="px-3 py-1 rounded-md text-sm bg-indigo-600 hover:bg-indigo-500 transition-colors duration-150 focus:outline-none focus-visible:ring-3 focus-visible:ring-tm-teal">New Recognition</button>
        <div className="text-sm text-slate-400">{user?.full_name || user?.email} • {userRole}</div>
        <button
          onClick={handleLogout}
          className="px-3 py-1 rounded-md text-sm bg-red-600 hover:bg-red-500 transition-colors duration-150 focus:outline-none focus-visible:ring-3 focus-visible:ring-red-500"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
