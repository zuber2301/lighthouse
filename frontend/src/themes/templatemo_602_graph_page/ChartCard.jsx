import React, { useState } from 'react'

export function ChartCard({ title, children, options }) {
  const [active, setActive] = useState(0)
  return (
    <div className="bg-card border border-indigo-500/10 rounded-xl p-6 min-h-[300px] hover:-translate-y-1 transform transition-all duration-200 focus-within:shadow-tm-neon">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {options ? (
          <div className="flex gap-2">
            {options.map((o, i) => (
              <button key={i} onClick={() => setActive(i)} aria-pressed={active === i} className={`px-3 py-1 rounded-md text-sm ${active === i ? 'bg-card/10 border border-indigo-500/10' : 'bg-card/5 border border-indigo-500/10'} focus:outline-none focus-visible:ring-2 focus-visible:ring-tm-teal`}>{o}</button>
            ))}
          </div>
        ) : null}
      </div>
      <div style={{ height: 220 }}>{children}</div>
    </div>
  )
}

export function BarChart({ values = [] }) {
  const max = Math.max(...values, 1)
  return (
    <div className="flex items-end gap-3 h-[180px]">
      {values.map((v, i) => (
        <div key={i} role="img" aria-label={`${v}`} style={{ height: `${(v / max) * 100}%`, animationDelay: `${i * 80}ms` }} className="w-7 rounded-t-md flex items-end justify-center text-tm-teal text-xs origin-bottom transform transition-transform duration-200 hover:scale-105 bg-gradient-to-b from-tm-teal to-tm-teal-2 scale-y-0 animate-grow">
          <span className="sr-only">{v}</span>
        </div>
      ))}
    </div>
  )
}

export function LineChartSVG({ pathD, gradientId = 'g1' }) {
  return (
    <svg viewBox="0 0 500 250" className="w-full h-full drop-shadow-[0_0_10px_rgba(99,102,241,0.15)]">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#6366F1', stopOpacity: 0.5 }} />
          <stop offset="100%" style={{ stopColor: '#6366F1', stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d={pathD} fill={`url(#${gradientId})`} opacity={0.25} className="opacity-0 animate-fade-in" style={{ animationDelay: '180ms' }} />
      <path d={pathD} fill="none" stroke="#6366F1" strokeWidth="2" className="animate-draw" style={{ strokeDasharray: 1000, strokeDashoffset: 1000 }} />
    </svg>
  )
}
