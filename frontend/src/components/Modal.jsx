import React from 'react'

export default function Modal({ open, onClose, children, className = "max-w-3xl" }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl ${className}`}>{children}</div>
    </div>
  )
} 
