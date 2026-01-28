import React, { useState, useEffect } from 'react'
import api from '../api/axiosClient'

const personas = [
  { name: 'Platform Owner', email: 'super_user@lighthouse.com', role: 'PLATFORM_OWNER' },
  { name: 'Tenant Admin', email: 'tenant_admin@triton.com', role: 'TENANT_ADMIN' },
  { name: 'Tenant Lead', email: 'eng-lead@triton.com', role: 'TENANT_LEAD' },
  { name: 'Corporate User', email: 'user@triton.com', role: 'CORPORATE_USER' },
]

const roleColors = {
  'Platform Owner': '#FFD54F',
  'Tenant Admin': '#4FC3F7',
  'Tenant Lead': '#BA68C8',
  'Corporate User': '#90CAF9',
}

export default function DevPersonaSwitcher({ onSwitch } = {}) {
  // Only render in dev mode
  if (!import.meta.env.DEV) return null

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('dev_switcher_collapsed') === '1' } catch (e) { return false }
  })

  useEffect(() => {
    try { localStorage.setItem('dev_switcher_collapsed', collapsed ? '1' : '0') } catch (e) {}
  }, [collapsed])

  const handleSwitch = async (p) => {
    try {
      const res = await api.post('/auth/dev-login', { email: p.email })
      const data = res.data
      // store token under multiple keys for compatibility
      try { localStorage.setItem('auth_token', data.token) } catch (e) {}
      try { localStorage.setItem(' lighthouse_token', data.token) } catch (e) {}
      try { localStorage.setItem('VITE_DEV_TOKEN', data.token) } catch (e) {}
      try { localStorage.setItem('user', JSON.stringify(data.user)) } catch (e) {}
      if (data.user && data.user.tenant_id) {
        try { localStorage.setItem('tenant_id', data.user.tenant_id) } catch (e) {}
        try { localStorage.setItem('selected_tenant_id', data.user.tenant_id) } catch (e) {}
      }
      if (onSwitch) onSwitch(data.user)
      
      // Role-based redirection instead of simple reload
      let dest = '/dashboard'
      if (data.user.role === 'PLATFORM_OWNER') dest = '/platform-admin'
      
      window.location.href = dest
    } catch (err) {
      console.error('Dev persona switch failed', err)
      alert('Dev persona login failed: ' + (err.response?.data || err.message || err))
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {!collapsed ? (
        <div className="p-4 bg-card border border-indigo-500/10 rounded-xl shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-tighter">Dev Persona Switcher</p>
            <button onClick={() => setCollapsed(true)} className="text-text-main opacity-60 px-2 py-1 rounded hover:bg-card border border-indigo-500/10/5">▾</button>
          </div>
          <div className="flex flex-col gap-2">
            {personas.map((p) => (
              <button
                key={p.role}
                onClick={() => handleSwitch(p)}
                className="flex items-center text-left text-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span style={{ 
                  backgroundColor: roleColors[p.name], 
                  borderRadius: '12px', 
                  padding: '4px 10px',
                  color: 'var(--text-main)',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}>
                  {p.name}
                </span>
              </button>
            ))}
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="text-left text-xs px-3 py-2 bg-red-900/50 hover:bg-red-600 rounded transition text-red-100 mt-1"
            >
              Clear Session
            </button>
          </div>
        </div>
      ) : (
        <div className="p-2 bg-card border border-indigo-500 rounded-xl shadow-2xl">
          <button onClick={() => setCollapsed(false)} className="text-xs text-indigo-400 px-3 py-2">Dev Personas ▸</button>
        </div>
      )}
    </div>
  )
}
