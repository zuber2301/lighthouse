import React, { useState } from 'react'

const OnboardTenantModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    adminEmail: '',
    planId: 1  // Default to Basic plan
  })

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      name: formData.name,
      subdomain: formData.subdomain,
      admin_email: formData.adminEmail,
      plan_id: parseInt(formData.planId)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border-soft w-full max-w-lg rounded-lg p-8 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6">Onboard New Company</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-normal mb-1">Company Name</label>
            <input 
              type="text"
              className="w-full px-4 py-2 rounded-lg border bg-card/20 border-indigo-500/10 outline-none focus:ring-2 focus:ring-indigo-500 text-text-main placeholder:text-text-main/60"
              placeholder="e.g. Acme Corp"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-normal mb-1">Subdomain</label>
            <div className="flex items-center">
              <input 
                type="text"
                className="flex-1 px-4 py-2 rounded-l-lg border bg-surface/50 border-indigo-500/10 outline-none focus:ring-2 focus:ring-indigo-500 text-text-main placeholder:text-text-main/60"
                placeholder="acme"
                value={formData.subdomain}
                onChange={(e) => setFormData({...formData, subdomain: e.target.value})}
                required
              />
              <span className="bg-surface dark:bg-card px-3 py-2 border-l-0 border border-indigo-500/10 rounded-r-lg text-text-main opacity-70">.lighthouse.com</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-normal mb-1">Primary Admin Email</label>
            <input 
              type="email"
              className="w-full px-4 py-2 rounded-lg border bg-card/20 border-indigo-500/10 outline-none focus:ring-2 focus:ring-indigo-500 text-text-main placeholder:text-text-main/60"
              placeholder="admin@acme.com"
              value={formData.adminEmail}
              onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-normal mb-1">Subscription Plan</label>
            <select 
              className="w-full px-4 py-2 rounded-lg border bg-card/20 border-indigo-500/10 outline-none focus:ring-2 focus:ring-indigo-500 text-text-main"
              value={formData.planId}
              onChange={(e) => setFormData({...formData, planId: e.target.value})}
            >
              <option value={1}>Basic (Free)</option>
              <option value={2}>Pro (₹15,000/mo)</option>
              <option value={3}>Enterprise (Custom)</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 text-text-main/60 font-normal hover:text-text-main transition">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 btn-accent rounded-lg font-bold hover:brightness-95 transition">
              Create Tenant
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default OnboardTenantModal