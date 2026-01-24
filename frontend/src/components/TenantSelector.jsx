import React, { useRef, useState, useEffect } from 'react'
import { useTenant } from '../lib/TenantContext'

export default function TenantSelector() {
  const { tenants, selectedTenantId, setSelectedTenantId, selectedTenant } = useTenant()

  const onChange = (e) => {
    const val = e.target.value
    setSelectedTenantId(val)
  }

  if (!tenants || tenants.length === 0) return (
    <div className="text-[16px] text-text-main opacity-60">Tenant: —</div>
  )

  const wrapperRef = useRef(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex items-center gap-3">
      <span className="text-[13px] font-black uppercase tracking-widest text-white opacity-80">Context:</span>
      <div ref={wrapperRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          className="text-[16px] font-bold bg-indigo-500/5 border border-indigo-500/20 text-text-main px-4 py-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all hover:bg-indigo-500/10 active:scale-95 cursor-pointer pr-8 flex items-center justify-between min-w-[180px]"
        >
          <span className="truncate">{selectedTenant?.name || 'Global Overview'}</span>
          <span className="ml-3 text-text-main/60">▾</span>
        </button>

        {open && (
          <ul className="absolute left-0 right-0 mt-2 z-50 rounded-md overflow-hidden shadow-lg bg-card/20 border border-indigo-500/10" role="listbox">
            <li role="option" key="global" onClick={() => { setSelectedTenantId(''); setOpen(false) }} className={`px-4 py-3 text-sm text-text-main hover:bg-indigo-500/10 cursor-pointer ${!selectedTenantId ? 'font-bold' : 'font-normal'}`}>Global Overview</li>
            {tenants.map(t => (
              <li key={t.id} role="option" onClick={() => { setSelectedTenantId(t.id); setOpen(false) }} className={`px-4 py-3 text-sm text-text-main hover:bg-indigo-500/10 cursor-pointer ${String(selectedTenantId) === String(t.id) ? 'font-bold' : 'font-normal'}`}>
                {t.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
