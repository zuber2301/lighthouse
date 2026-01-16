import React from 'react'

export default function Card({ children, className = '' }) {
  return <div className={`bg-card rounded-xl p-6 shadow-sm ${className}`}>{children}</div>
} 
