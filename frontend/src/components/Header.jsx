import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useTenant } from '../lib/TenantContext'
import { useAppTheme } from '../lib/ThemeContext'
import TenantSelector from './TenantSelector'
import GroupAwardModal from '../features/recognition/GroupAwardModal'
import { createRecognition } from '../api/recognitions'

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useAppTheme()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false)
  const themeDropdownRef = useRef(null)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  const userRole = user?.role || 'CORPORATE_USER'
  const isCorporate = userRole === 'CORPORATE_USER'
  const isAdmin = userRole === 'PLATFORM_OWNER' || userRole === 'TENANT_ADMIN'
  const showGiveButtons = ['PLATFORM_OWNER', 'TENANT_ADMIN', 'TENANT_LEAD', 'CORPORATE_USER'].includes(userRole)
  const displayName = user?.full_name || user?.email || 'User'
  const firstLetter = displayName.charAt(0).toUpperCase()
  const { selectedTenant } = useTenant()

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target)) {
        setIsThemeDropdownOpen(false)
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
    <>
      <header className={`flex items-center justify-between px-6 py-4 sticky top-0 z-40 ${headerClass} transition-colors duration-300`}>
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
            <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shadow-accent-neon active:scale-95 transition-transform">
            <span className="text-white text-[18px]">LH</span>
          </div>
          <div className="text-[26px] font-normal tracking-tight text-white">LightHouse</div>
        </Link>
        
        {!isCorporate && (
          <div className={`h-8 w-[1px] ${separatorClass} opacity-20`} />
        )}
        {!isCorporate && <TenantSelector />}
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Dropdown */}
        <div className="relative" ref={themeDropdownRef}>
          <button
            onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 rounded-full transition-all text-[17px] font-bold text-text-main"
          >
            <span className="opacity-70">🎨</span>
            <span>Theme</span>
            <svg className={`w-2 h-2 ml-1 transition-transform ${isThemeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isThemeDropdownOpen && (
            <div className="absolute left-0 mt-3 w-44 bg-card border border-border-soft rounded-2xl shadow-2xl z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <button 
                onClick={() => { setTheme('light'); setIsThemeDropdownOpen(false); }} 
                className={`w-full text-left px-4 py-2.5 text-[11px] font-black uppercase tracking-widest hover:bg-indigo-500/5 flex items-center gap-3 transition-colors ${theme === 'light' ? 'text-indigo-500 bg-indigo-500/5' : 'text-text-main opacity-60'}`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-white border border-gray-200 shadow-sm" />
                Light Mode
              </button>
              <button 
                onClick={() => { setTheme('dim'); setIsThemeDropdownOpen(false); }} 
                className={`w-full text-left px-4 py-2.5 text-[11px] font-black uppercase tracking-widest hover:bg-indigo-500/5 flex items-center gap-3 transition-colors ${theme === 'dim' ? 'text-indigo-500 bg-indigo-500/5' : 'text-text-main opacity-60'}`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#1E1E2F] border border-indigo-400/30 shadow-sm" />
                Dim Mode
              </button>
              <button 
                onClick={() => { setTheme('dark'); setIsThemeDropdownOpen(false); }} 
                className={`w-full text-left px-4 py-2.5 text-[11px] font-black uppercase tracking-widest hover:bg-indigo-500/5 flex items-center gap-3 transition-colors ${theme === 'dark' ? 'text-indigo-500 bg-indigo-500/5' : 'text-text-main opacity-60'}`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-black border border-indigo-900 shadow-sm" />
                Dark Mode
              </button>
              <button 
                onClick={() => { setTheme('graph'); setIsThemeDropdownOpen(false); }} 
                className={`w-full text-left px-4 py-2.5 text-[11px] font-black uppercase tracking-widest hover:bg-indigo-500/5 flex items-center gap-3 transition-colors ${theme === 'graph' ? 'text-indigo-500 bg-indigo-500/5' : 'text-text-main opacity-60'}`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#0a0e27] border border-[#6366F1] shadow-[0_0_5px_rgba(99,102,241,0.5)]" />
                Graph Mode
              </button>
            </div>
          )}
        </div>

        <div className={`h-6 w-[1px] ${separatorClass}`} />

        {/* PROMINENT POINTS BALANCE FOR CORPORATE USERS */}
        {isCorporate && (
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
            <span className="text-[16px]">💰</span>
            <span className="font-bold text-indigo-500 text-[17px]">{user?.points_balance?.toLocaleString() || 0}</span>
            <span className="text-[12px] uppercase tracking-wider text-indigo-500/60 font-black">Pts</span>
          </div>
        )}

        {/* Quick Action Buttons - give specific award types; visible to admins, leads and users */}
        {showGiveButtons && (
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => navigate(`/recognition?tab=${encodeURIComponent('Individual award')}&_=${Date.now()}`)}
              className="px-6 py-2 rounded-full btn-recognition text-[16px] font-bold transition-all shadow-lg active:scale-95"
            >
              Give Individual award
            </button>

            <button
              onClick={() => navigate(`/recognition?tab=${encodeURIComponent('E-Card')}&_=${Date.now()}`)}
              className="px-6 py-2 rounded-full btn-recognition text-[16px] font-bold transition-all shadow-lg active:scale-95"
            >
              Give E-Card
            </button>

            <button
              onClick={() => setIsGroupModalOpen(true)}
              className="px-6 py-2 rounded-full btn-recognition text-[16px] font-bold transition-all shadow-lg active:scale-95"
            >
              Give Group award
            </button>
          </div>
        )}

        <div className={`h-6 w-[1px] mx-1 ${separatorClass}`} />

        {/* User Avatar and Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-full transition-colors focus:outline-none hover:bg-surface active:scale-95"
          >
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-accent-contrast font-black text-[16px] ring-2 ring-indigo-500/30 shadow-md">
              {firstLetter}
            </div>
            <div className="hidden md:block text-left mr-1">
              <div className="text-[16px] font-bold text-text-main leading-none">{displayName}</div>
              <div className="text-[12px] uppercase tracking-widest text-text-main/50 font-black mt-0.5">{formatRole(userRole)}</div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-60 border bg-card border-border-soft rounded-2xl shadow-2xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-border-soft bg-indigo-500/5">
                <div className="text-[17px] font-black text-text-main">{displayName}</div>
                <div className="text-xs text-text-main/50 font-normal truncate">{user?.email}</div>
                <div className="mt-2 inline-block px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-500 text-[11px] font-black uppercase tracking-widest">
                  {formatRole(userRole)}
                </div>
              </div>
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center justify-between group"
                >
                  Logout
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">👋</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

      {isGroupModalOpen && (
        <GroupAwardModal
          open={isGroupModalOpen}
          onClose={() => setIsGroupModalOpen(false)}
          onSubmit={async (payload) => {
            try {
              await createRecognition(payload)
              setIsGroupModalOpen(false)
              navigate('/recognition')
            } catch (err) {
              console.error('Failed to send group award:', err)
              alert(err?.message || 'Failed to send group award')
            }
          }}
        />
      )}
    </>
  )
}
