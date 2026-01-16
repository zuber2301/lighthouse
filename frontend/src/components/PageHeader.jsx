import React from 'react'

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle ? <div className="text-sm text-slate-400 mt-1">{subtitle}</div> : null}
      </div>

      {actions ? <div className="ml-4">{actions}</div> : null}
    </div>
  )
} 
