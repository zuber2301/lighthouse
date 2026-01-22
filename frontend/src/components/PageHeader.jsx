import React from 'react'

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">{title}</h1>
        {subtitle ? <div className="text-sm opacity-60 text-text-main mt-1">{subtitle}</div> : null}
      </div>

      {actions ? <div className="ml-4">{actions}</div> : null}
    </div>
  )
}
