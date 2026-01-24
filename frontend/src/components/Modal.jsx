import React from 'react'

export default function Modal({ open, onClose, children, className = "max-w-3xl" }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto styled-scrollbar">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full bg-card border border-border-soft rounded-lg p-6 shadow-2xl ${className} max-h-[calc(100vh-3.5rem)] overflow-auto styled-scrollbar my-8`}>{children}</div>
    </div>
  )
}
