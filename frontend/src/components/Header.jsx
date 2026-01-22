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
  const headerClass = "bg-header-bg/80 backdrop-blur-xl border-b border-border-soft text-text-main shadow-sm"
  const separatorClass = "bg-border-soft"

  return (
    <header className={`flex items-center justify-between px-6 py-4 sticky top-0 z-40 ${headerClass} transition-colors duration-300`}>
      <div className="flex items-center gap-6">
        <Link to="/" className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity text-tm-gradient">
          Portal<span className="text-white">Admin</span>
        </Link>
        
        {!isCorporate && (
          <div className={`h-6 w-[1px] ${separatorClass}`} />
        )}
        {!isCorporate && <TenantSelector />}
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle - Modern Segmented Control with Visual Previews */}
        <div className="flex items-center p-1 bg-indigo-500/5 rounded-full border border-indigo-500/10 shadow-inner">
          <button 
            onClick={() => setTheme('light')}
            className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-500 ${theme === 'light' ? 'btn-accent scale-105' : 'text-text-main opacity-30 hover:opacity-100 hover:bg-indigo-500/5'}`}
            title="Light Mode"
          >
            <span className="w-2 h-2 rounded-full bg-white border border-gray-200" />
            Light
          </button>
          <button 
            onClick={() => setTheme('dim')}
            className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-500 ${theme === 'dim' ? 'btn-accent scale-105' : 'text-text-main opacity-30 hover:opacity-100 hover:bg-indigo-500/5'}`}
            title="Dim Mode"
          >
            <span className="w-2 h-2 rounded-full bg-[#1E1E2F] border border-indigo-400/30" />
            Dim
          </button>
          <button 
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-500 ${theme === 'dark' ? 'btn-accent scale-105' : 'text-text-main opacity-30 hover:opacity-100 hover:bg-indigo-500/5'}`}
            title="Dark Mode"
          >
            <span className="w-2 h-2 rounded-full bg-black border border-indigo-900" />
            Dark
          </button>
          <button 
            onClick={() => setTheme('graph')}
            className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-500 ${theme === 'graph' ? 'btn-accent scale-105' : 'text-text-main opacity-30 hover:opacity-100 hover:bg-indigo-500/5'}`}
            title="Graph Mode"
          >
            <span className="w-2 h-2 rounded-full bg-[#0a0e27] border border-[#00ffcc]" />
            Graph
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
            className="hidden sm:flex px-4 py-1.5 rounded-full text-xs font-bold btn-recognition hover:brightness-95 transition-all shadow-lg"
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
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-accent-contrast font-bold text-xs ring-2 ring-indigo-500/30">
              {firstLetter}
            </div>
            <div className="hidden md:block text-left mr-1">
              <div className="text-xs font-semibold text-text-main">{displayName}</div>
              <div className="text-[10px] uppercase tracking-tighter text-text-main/60">{formatRole(userRole)}</div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 border rounded-xl shadow-2xl z-50 overflow-hidden bg-card border-border-soft">
              <div className="p-4 border-b border-border-soft">
                <div className="text-sm font-bold text-text-main">{displayName}</div>
                <div className="text-xs text-text-main/60">{user?.email}</div>
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
