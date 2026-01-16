import React from 'react'
import { useTheme } from '../themes/templatemo_602_graph_page/ThemeProvider'

export default function Card({ children, className = '' }) {
  const themed = useTheme()
  const themeClass = themed ? 'bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]' : ''
  return <div className={`rounded-xl p-6 shadow-sm ${themeClass} ${className} transition-all duration-200 hover:shadow-lg`}>{children}</div>
} 
