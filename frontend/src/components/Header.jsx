import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import TenantSelector from './TenantSelector'

const tabs = [
  { name: 'Dashboard', path: '/' },
  { name: 'Tenants', path: '/tenants' },
  { name: 'Recognition', path: '/recognition' },
  { name: 'Rewards', path: '/rewards' },
  { name: 'Analytics', path: '/analytics' },
  { name: 'Admin', path: '/admin', role: 'PLATFORM_ADMIN' },
]

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  const userRole = user?.role || 'CORPORATE_USER'
  const displayName = user?.full_name || user?.email || 'User'
  const firstLetter = displayName.charAt(0).toUpperCase()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatRole = (role) => {
    return role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <header className={`flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[rgba(10,14,39,0.95)] backdrop-blur-md`}>
      <div className="flex items-center gap-4">
        <div className="text-lg font-semibold">LightHouse</div>
        <div>
          <TenantSelector />
        </div>
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
        
        {/* User Avatar and Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-700 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
              {firstLetter}
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-slate-200">{displayName}</div>
              <div className="text-xs text-slate-400">{formatRole(userRole)}</div>
            </div>
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-50">
              <div className="py-1">
                <div className="px-4 py-2 text-sm text-slate-300 border-b border-slate-700">
                  <div className="font-medium">{displayName}</div>
                  <div className="text-slate-400">Role: {formatRole(userRole)}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors duration-150 focus:outline-none focus:bg-slate-700"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
