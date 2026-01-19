import React from 'react'
import api from '../api/axiosClient'

const personas = [
  { name: 'Platform Admin', email: 'super@lighthouse.com', role: 'PLATFORM_ADMIN' },
  { name: 'Tenant Admin', email: 'hr@triton.com', role: 'TENANT_ADMIN' },
  { name: 'Tenant Lead', email: 'eng-lead@triton.com', role: 'TENANT_LEAD' },
  { name: 'Corporate User', email: 'dev@triton.com', role: 'CORPORATE_USER' },
]

export default function DevPersonaSwitcher({ onSwitch } = {}) {
  // Only render in dev mode
  if (!import.meta.env.DEV) return null

  const handleSwitch = async (p) => {
    try {
      const res = await api.post('/auth/dev-login', { email: p.email })
      const data = res.data
      // store token under multiple keys for compatibility
      try { localStorage.setItem('auth_token', data.token) } catch (e) {}
      try { localStorage.setItem('lighthouse_token', data.token) } catch (e) {}
      try { localStorage.setItem('VITE_DEV_TOKEN', data.token) } catch (e) {}
      try { localStorage.setItem('user', JSON.stringify(data.user)) } catch (e) {}
      try { if (data.user && data.user.tenant_id) localStorage.setItem('tenant_id', data.user.tenant_id) } catch (e) {}
      if (onSwitch) onSwitch(data.user)
      window.location.reload()
    } catch (err) {
      console.error('Dev persona switch failed', err)
      alert('Dev persona login failed: ' + (err.response?.data || err.message || err))
    }
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-slate-900 border border-indigo-500 rounded-xl shadow-2xl z-[9999]">
      <p className="text-xs font-bold text-indigo-400 mb-2 uppercase tracking-tighter">Dev Persona Switcher</p>
      <div className="flex flex-col gap-2">
        {personas.map((p) => (
          <button
            key={p.role}
            onClick={() => handleSwitch(p)}
            className="text-left text-xs px-3 py-2 bg-slate-800 hover:bg-indigo-600 rounded transition text-white"
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  )
}
