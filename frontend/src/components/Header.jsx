import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useTenant } from '../lib/TenantContext'
import { useAppTheme } from '../lib/ThemeContext'
import TenantSelector from './TenantSelector'

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useAppTheme()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  const userRole = user?.role || 'CORPORATE_USER'
  const isCorporate = userRole === 'CORPORATE_USER'
  const isAdmin = userRole === 'PLATFORM_OWNER' || userRole === 'TENANT_ADMIN'
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

  // Use theme variables for styling
  const headerClass = "bg-card/80 border-b border-border-soft text-text-main"
  const separatorClass = "bg-border-soft"

  return (
    <header className={`flex items-center justify-between px-6 py-4 backdrop-blur-xl sticky top-0 z-40 ${headerClass} transition-colors duration-300`}>
      <div className="flex items-center gap-6">
        <Link to="/" className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity text-text-main">
          Light<span className="text-indigo-500">House</span>
        </Link>
        
        {!isCorporate && (
          <div className={`h-6 w-[1px] ${separatorClass}`} />
        )}
        {!isCorporate && <TenantSelector />}
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <div className="flex items-center gap-1 bg-surface rounded-full p-1 border border-border-soft shadow-inner">
          <button 
            onClick={() => setTheme('light')}
            className={`flex items-center justify-center p-1.5 rounded-full transition-all duration-200 ${theme === 'light' ? 'bg-indigo-600 text-white shadow-md' : 'text-text-main opacity-50 hover:opacity-100 hover:bg-white/10'}`}
            title="Light Mode"
          >
            <span className="text-xs">☀️</span>
          </button>
          <button 
            onClick={() => setTheme('dim')}
            className={`flex items-center justify-center p-1.5 rounded-full transition-all duration-200 ${theme === 'dim' ? 'bg-indigo-600 text-white shadow-md' : 'text-text-main opacity-50 hover:opacity-100 hover:bg-white/10'}`}
            title="Dim Mode"
          >
            <span className="text-xs">🌓</span>
          </button>
          <button 
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-center p-1.5 rounded-full transition-all duration-200 ${theme === 'dark' ? 'bg-indigo-600 text-white shadow-md' : 'text-text-main opacity-50 hover:opacity-100 hover:bg-white/10'}`}
            title="Dark Mode"
          >
            <span className="text-xs">🌑</span>
          </button>
        </div>

        <div className={`h-6 w-[1px] ${separatorClass}`} />

        {/* PROMINENT POINTS BALANCE FOR CORPORATE USERS */}
        {isCorporate && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
            <span className="text-sm">💰</span>
            <span className="font-bold text-indigo-500 text-sm">{user?.points_balance?.toLocaleString() || 0}</span>
            <span className="text-[10px] uppercase tracking-wider text-indigo-500/60 font-medium">Pts</span>
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

        <div className={`h-6 w-[1px] mx-1 ${separatorClass}`} />
        
        {/* User Avatar and Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-full transition-colors focus:outline-none hover:bg-surface"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-indigo-500/30">
              {firstLetter}
            </div>
            <div className="hidden md:block text-left mr-1">
              <div className="text-xs font-semibold text-text-main">{displayName}</div>
              <div className="text-[10px] uppercase tracking-tighter text-slate-500">{formatRole(userRole)}</div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 border rounded-xl shadow-2xl z-50 overflow-hidden bg-card border-border-soft">
              <div className="p-4 border-b border-border-soft">
                <div className="text-sm font-bold text-text-main">{displayName}</div>
                <div className="text-xs text-slate-500">{user?.email}</div>
                <div className="mt-2 inline-block px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 text-[10px] font-bold uppercase">
                  {formatRole(userRole)}
                </div>
              </div>
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
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
