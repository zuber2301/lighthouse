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
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-xl font-bold tracking-tight text-white hover:opacity-80 transition-opacity">
          Light<span className="text-indigo-500">House</span>
        </Link>
        
        {/* Simplified Tenant Context for Admins */}
        {!isCorporate && (
          <div className="h-6 w-[1px] bg-white/10" />
        )}
        {!isCorporate && <TenantSelector />}
      </div>

      <div className="flex items-center gap-3">
        {/* PROMINENT POINTS BALANCE FOR CORPORATE USERS */}
        {isCorporate && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
            <span className="text-sm">💰</span>
            <span className="font-bold text-indigo-400 text-sm">{user?.points_balance?.toLocaleString() || 0}</span>
            <span className="text-[10px] uppercase tracking-wider text-indigo-300/60 font-medium">Pts</span>
          </div>
        )}

        {/* Quick Action Button - Scoped or Corporate */}
        {(userRole !== 'PLATFORM_OWNER' || selectedTenant) && (
          <button 
            onClick={() => navigate('/recognition')} 
            className="hidden sm:flex px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-500 transition-all text-white shadow-lg shadow-indigo-600/20"
          >
            Give Recognition
          </button>
        )}

        <div className="h-6 w-[1px] bg-white/10 mx-1" />
        
        {/* User Avatar and Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-white/5 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-indigo-500/30">
              {firstLetter}
            </div>
            <div className="hidden md:block text-left mr-1">
              <div className="text-xs font-semibold text-slate-200">{displayName}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-tighter">{formatRole(userRole)}</div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <div className="text-sm font-bold text-white">{displayName}</div>
                <div className="text-xs text-slate-400">{user?.email}</div>
                <div className="mt-2 inline-block px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase">
                  {formatRole(userRole)}
                </div>
              </div>
              <div className="p-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
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
