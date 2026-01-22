import React from 'react'
import { useTheme } from '../themes/templatemo_602_graph_page/ThemeProvider'
import { useAuth } from '../lib/AuthContext'

export default function Card({ children, className = '' }) {
  const themed = useTheme()
  const { user } = useAuth()
  const isAdmin = user?.role === 'PLATFORM_OWNER' || user?.role === 'TENANT_ADMIN'

  const adminClass = "bg-white border border-slate-200 shadow-sm rounded-3xl"
  const darkClass = themed ? 'bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]' : 'bg-slate-900 border border-slate-800 shadow-sm'
  
  const baseClass = isAdmin ? adminClass : darkClass

  return (
    <div className={`p-6 transition-all duration-200 ${baseClass} ${className}`}>
      {children}
    </div>
  )
} 
