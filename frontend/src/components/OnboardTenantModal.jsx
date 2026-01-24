import React, { useState, useRef, useEffect } from 'react'

const OnboardTenantModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    adminEmail: '',
    planId: 1  // Default to Basic plan
  })
  const planWrapperRef = useRef(null)
  const [planOpen, setPlanOpen] = useState(false)

  useEffect(() => {
    function handleClickOutside(e) {
      if (planWrapperRef.current && !planWrapperRef.current.contains(e.target)) setPlanOpen(false)
    }
    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
            <div ref={planWrapperRef} className="relative">
              <button type="button" onClick={() => setPlanOpen(!planOpen)} className="w-full text-left bg-card/20 border border-indigo-500/10 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-text-main flex items-center justify-between">
                <span>{formData.planId === 1 ? 'Basic (Free)' : formData.planId === 2 ? 'Pro (₹15,000/mo)' : 'Enterprise (Custom)'}</span>
                <span className="text-text-main/60">▾</span>
              </button>

              {planOpen && (
                <ul className="absolute left-0 right-0 mt-2 z-50 rounded-md overflow-hidden shadow-lg bg-card/20 border border-indigo-500/10" role="listbox">
                  {[{id:1,label:'Basic (Free)'},{id:2,label:'Pro (₹15,000/mo)'},{id:3,label:'Enterprise (Custom)'}].map((opt) => (
                    <li key={opt.id} role="option" onClick={() => { setFormData({...formData, planId: opt.id}); setPlanOpen(false) }} className={`px-4 py-3 text-sm text-text-main hover:bg-indigo-500/10 cursor-pointer ${formData.planId === opt.id ? 'font-bold' : 'font-normal'}`}>{opt.label}</li>
                  ))}
                </ul>
              )}
            </div>
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