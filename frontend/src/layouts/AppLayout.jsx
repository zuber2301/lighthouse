import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useAuth } from '../lib/AuthContext'

export default function AppLayout() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'PLATFORM_OWNER' || user?.role === 'TENANT_ADMIN'
  
  return (
    <div className="min-h-screen flex bg-surface text-text-main transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
