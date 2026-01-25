import React, { useRef, useState, useEffect } from 'react'
import { useTenant } from '../lib/TenantContext'
import { usePlatform } from '../context/PlatformContext'

export default function TenantSelector({ label = null, direction = 'down' }) {
  const { tenants, selectedTenantId, setSelectedTenantId, selectedTenant } = useTenant()
  const { switchTenant } = usePlatform()

  const onChange = (e) => {
    const val = e.target.value
    setSelectedTenantId(val)
  }

  if (!tenants || tenants.length === 0) return (
    <div className="text-[16px] text-text-main opacity-60">Tenant: —</div>
  )

  const wrapperRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (open) {
      // focus the search input and ensure it's visible when dropdown opens
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          inputRef.current.scrollIntoView({ block: 'nearest' })
        }
      })
    }
  }, [open])

  const filtered = tenants?.filter(t => t.name.toLowerCase().includes(query.toLowerCase())) || []

  return (
    <div className="flex flex-col">
      {label && <div className="text-sm font-normal text-text-main opacity-80 mb-2">{label}</div>}
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
          <div
            className={`absolute left-0 right-0 z-50 rounded-md overflow-hidden shadow-lg bg-card/20 border border-indigo-500/10 ${direction === 'up' ? 'bottom-full mb-2' : 'mt-2'}`}
            role="listbox"
          >
            <ul className="max-h-56 overflow-y-auto">
              <li
                role="option"
                key="global"
                onClick={() => {
                  setSelectedTenantId('')
                  switchTenant(null)
                  setOpen(false)
                }}
                className={`px-4 py-3 text-sm text-text-main hover:bg-indigo-500/10 cursor-pointer ${!selectedTenantId ? 'font-bold' : 'font-normal'}`}
              >
                Global Overview
              </li>
              {filtered.map(t => (
                <li
                  key={t.id}
                  role="option"
                  onClick={() => {
                    setSelectedTenantId(t.id)
                    switchTenant(t)
                    setOpen(false)
                    setQuery('')
                  }}
                  className={`px-4 py-3 text-sm text-text-main hover:bg-indigo-500/10 cursor-pointer ${String(selectedTenantId) === String(t.id) ? 'font-bold' : 'font-normal'}`}
                >
                  {t.name}
                </li>
              ))}

              <li className="px-3 py-2 border-t border-indigo-500/5">
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tenants..."
                  className="w-full bg-transparent border border-indigo-500/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
