import React from 'react'

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-4xl font-black text-text-main tracking-tight">{title}</h1>
        {subtitle ? <div className="text-base font-medium opacity-50 text-text-main mt-2">{subtitle}</div> : null}
      </div>

      {actions ? <div className="ml-4">{actions}</div> : null}
    </div>
  )
}
