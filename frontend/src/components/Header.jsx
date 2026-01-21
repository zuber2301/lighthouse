import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useTenant } from '../lib/TenantContext'
import TenantSelector from './TenantSelector'

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
  const isCorporate = userRole === 'CORPORATE_USER'
  const displayName = user?.full_name || user?.email || 'User'
  const firstLetter = displayName.charAt(0).toUpperCase()
  const { selectedTenant } = useTenant()

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
    return role?.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <header className={`flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[rgba(10,14,39,0.95)] backdrop-blur-md sticky top-0 z-40`}>
      <div className="flex items-center gap-4">
        {/* Only show tenant selector/logo area logic for admins or platform owners */}
        {!isCorporate && (
          <>
            <div className="text-lg font-semibold text-indigo-400">LightHouse</div>
            <div>
              <TenantSelector />
            </div>
          </>
        )}
      </div>

      <nav className="flex items-center gap-6">
        {/* Primary nav is now in Sidebar for Corporate Users. 
            We keep only essential context here or specific admin tabs if needed */}
        {userRole === 'PLATFORM_OWNER' && (
           <Link to="/platform-admin/tenants" className="text-sm font-medium text-slate-300 hover:text-white">Tenants</Link>
        )}
      </nav>

      <div className="flex items-center gap-4">
        {/* PROMINENT POINTS BALANCE FOR CORPORATE USERS */}
        {isCorporate && (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
            <span className="text-xl">💰</span>
            <span className="font-bold text-indigo-400">{user?.points_balance?.toLocaleString() || 0}</span>
            <span className="text-xs uppercase tracking-tighter text-indigo-300/60 font-medium">Points</span>
          </div>
        )}

        {/* New Recognition Quick Action (Scoped) */}
        {(userRole !== 'PLATFORM_OWNER' || selectedTenant) && (
          <button onClick={() => navigate('/recognition')} className="px-4 py-1.5 rounded-full text-sm font-bold bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 text-white">
            Give Recognition
          </button>
        )}

        <div className="h-8 w-[1px] bg-white/10 mx-2" />

        {/* Platform owner header controls */}
        {userRole === 'PLATFORM_OWNER' && (
          <div className="flex items-center gap-3">
            <input
              aria-label="Global search"
              placeholder="Search tenants or admin email..."
              className="text-sm px-3 py-2 rounded-md bg-slate-700 text-slate-100 placeholder-slate-400"
            />
            <div className="px-2 py-1 text-xs font-semibold bg-rose-600 text-white rounded-md">PLATFORM CONTROL PLANE</div>
          </div>
        )}
        
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
