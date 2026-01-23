import React, { useState } from 'react'
import api from '../api/axiosClient'

const OnboardTenantDrawer = ({ isOpen, onClose, onRefresh }) => {
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    admin_email: '',
    admin_name: '',
    industry: '',
    plan_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/platform/tenants', formData)
      onRefresh()
      onClose()
      setFormData({ name: '', subdomain: '', admin_email: '', admin_name: '', industry: '', plan_id: '' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to provision tenant')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-card border-l border-border-soft shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-border-soft flex items-center justify-between bg-surface/50">
          <div>
            <h2 className="text-xl font-normal text-text-main tracking-tight">Provision New Tenant</h2>
            <p className="text-xs opacity-50 uppercase tracking-widest mt-1">Environment Setup</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-text-main/60 hover:text-text-main transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar styled-scrollbar">
          {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-white/40">Company Details</label>
            <div className="space-y-4">
              <div>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Company Name"
                  className="w-full bg-surface border border-border-soft rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                  required
                />
              </div>
              <div>
                <div className="relative">
                  <input
                    name="subdomain"
                    value={formData.subdomain}
                    onChange={handleChange}
                    placeholder="Subdomain"
                    className="w-full bg-surface border border-border-soft rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none pr-32"
                    required
                  />
                  <div className="absolute right-3 top-3.5 text-xs opacity-30">.lighthouse.com</div>
                </div>
              </div>
              <div>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full bg-surface border border-border-soft rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                >
                  <option value="">Select Industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <label className="text-[11px] font-black uppercase tracking-widest text-white/40">Primary Admin</label>
            <div className="space-y-4">
              <input
                name="admin_name"
                value={formData.admin_name}
                onChange={handleChange}
                placeholder="Full Name"
                className="w-full bg-surface border border-border-soft rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                required
              />
              <input
                name="admin_email"
                type="email"
                value={formData.admin_email}
                onChange={handleChange}
                placeholder="Admin Email Address"
                className="w-full bg-surface border border-border-soft rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                required
              />
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-border-soft bg-surface/50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-border-soft text-text-main/60 hover:bg-white/5 transition-all text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-2 btn-accent px-8 py-3 rounded-xl text-white font-semibold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {loading ? 'Provisioning...' : 'Provision Tenant'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default OnboardTenantDrawer
