import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { ThemeProvider } from '../themes/templatemo_602_graph_page/ThemeProvider'
import { useAuth } from '../lib/AuthContext'

export default function AppLayout() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'PLATFORM_OWNER' || user?.role === 'TENANT_ADMIN'
  
  const bgClass = isAdmin ? 'bg-[#F1F5F9] text-[#1E293B]' : 'bg-slate-950 text-slate-100'

  return (
    <div className={`min-h-screen flex ${bgClass}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-full">
            <ThemeProvider>
              <Outlet />
            </ThemeProvider>
          </div>
        </main>
      </div>
    </div>
  )
}
