import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useAuth } from '../lib/AuthContext'
import { useAppTheme } from '../lib/ThemeContext'

export default function AppLayout() {
  const { user } = useAuth()
  const { theme } = useAppTheme()
  const isAdmin = user?.role === 'PLATFORM_OWNER' || user?.role === 'TENANT_ADMIN'
  
  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr] bg-surface text-text-main transition-colors duration-300 relative overflow-hidden">
      {theme === 'graph' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="tm-shape w-64 h-64 top-[10%] -left-32 rotate-45 animate-tm-float border-tm-teal/20" />
          <div className="tm-shape w-96 h-96 top-[60%] -right-48 border-tm-pink/10 animate-tm-float" style={{ animationDirection: 'reverse' }} />
          <div className="tm-shape w-48 h-48 bottom-[20%] left-[10%] rotate-12 border-tm-teal-2/20 animate-tm-float" />
        </div>
      )}
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        <Header />
        <main className="flex-1 overflow-y-auto styled-scrollbar px-6 py-6">
          <div className="max-w-[1260px] w-full space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
