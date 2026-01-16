import React from 'react'

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
      <div className="w-full max-w-md bg-card rounded-2xl p-8 shadow">{children}</div>
    </div>
  )
} 
