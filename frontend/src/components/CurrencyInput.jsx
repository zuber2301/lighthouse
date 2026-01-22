import React from 'react'

export default function CurrencyInput({ value, onChange, placeholder, className }) {
  const formatDisplay = (v) => {
    if (v === null || v === undefined || v === '') return ''
    const n = Number(v)
    if (!isFinite(n)) return v
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)
  }

  const handleChange = (e) => {
    let s = e.target.value || ''
    // strip commas and any non-digit except dot
    s = s.replace(/,/g, '').replace(/[^0-9.]/g, '')
    // allow a single dot, and at most 2 decimals
    const parts = s.split('.')
    if (parts.length > 1) {
      s = parts[0] + '.' + parts[1].slice(0, 2)
    }
    // avoid leading zeros like 00 -> 0
    if (/^0+[0-9]+/.test(s)) {
      s = s.replace(/^0+/, '')
    }
    onChange && onChange(s)
  }

  return (
    <div>
      <input
        type="text"
        inputMode="decimal"
        value={value || ''}
        onChange={handleChange}
        placeholder={placeholder}
        className={className || 'w-full p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-text-main placeholder:text-text-main/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-medium'}
      />
      <div className="text-indigo-400 text-xs mt-1.5 font-bold tracking-tight">{value ? `₹${formatDisplay(value)}` : ''}</div>
    </div>
  )
}
