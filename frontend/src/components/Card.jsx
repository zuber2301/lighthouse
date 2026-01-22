import React from 'react'

export default function Card({ children, className = '' }) {
  return (
    <div className={`p-6 transition-all duration-300 bg-card border border-border-soft shadow-sm rounded-3xl text-text-main ${className}`}>
      {children}
    </div>
  )
}
