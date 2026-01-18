import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE } from '../../lib/api'
import { useTenant } from '../../lib/TenantContext'

export default function CreateTenantForm() {
  const navigate = useNavigate()
  const { addTenant } = useTenant()
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    adminEmail: '',
    adminName: '',
    planId: ''
  })
  const [subscriptionPlans, setSubscriptionPlans] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)

  useEffect(() => {
    fetchSubscriptionPlans()
  }, [])

  const fetchSubscriptionPlans = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const headers = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const response = await fetch(`${API_BASE}/platform/subscription-plans`, { headers })
      if (response.ok) {
        const plans = await response.json()
        setSubscriptionPlans(plans)
        // Set default to Basic (Free) plan if available
        const basicPlan = plans.find(plan => plan.name === 'Basic')
        if (basicPlan) {
          setFormData(prev => ({ ...prev, planId: basicPlan.id }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch subscription plans:', error)
    } finally {
      setIsLoadingPlans(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Auto-generate subdomain from company name
    if (name === 'name') {
      const subdomain = value.toLowerCase().replace(/[^a-z0-9]/g, '')
      setFormData(prev => ({
        ...prev,
        subdomain
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = localStorage.getItem('auth_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(`${API_BASE}/platform/tenants`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: formData.name,
          subdomain: formData.subdomain,
          admin_email: formData.adminEmail,
          admin_name: formData.adminName,
          plan_id: parseInt(formData.planId)
        })
      })

      if (response.ok) {
        const result = await response.json()
        try {
          // Add to tenant context so tenant grids update immediately
          if (addTenant) addTenant(result)
        } catch (e) {
          // ignore
        }
        try {
          if (addTenant) addTenant(result)
        } catch (e) {}
        alert(`Tenant "${formData.name}" created successfully! Subdomain: ${result.subdomain}.lighthouse.com`)
        navigate(`/tenants?open=${result.id}`)
      } else {
        const status = response.status
        let text
        try {
          const j = await response.json()
          text = j.detail || JSON.stringify(j)
        } catch (err) {
          text = await response.text().catch(() => '')
        }
        console.error('Create tenant failed', { status, text })
        if (status === 401) {
          alert('Unauthorized. Please sign in as a platform admin.')
        } else if (status === 403) {
          alert('Forbidden. Your account lacks platform admin permissions.')
        } else {
          alert(`Error creating tenant (${status}): ${text || 'unknown error'}`)
        }
      }
    } catch (error) {
      console.error('Failed to create tenant:', error)
      alert('Failed to create tenant. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (priceInPaise) => {
    if (priceInPaise === 0) return 'Free'
    return `$${(priceInPaise / 100).toFixed(2)}/month`
  }

  if (isLoadingPlans) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-slate-100">Loading subscription plans...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h1 className="text-2xl font-bold text-slate-100 mb-6">Onboard New Company</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Company Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="TigerCorp"
              required
            />
          </div>

          {/* Subdomain */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Subdomain
            </label>
            <div className="flex">
              <input
                type="text"
                name="subdomain"
                value={formData.subdomain}
                onChange={handleInputChange}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-l-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="tigercorp"
                required
              />
              <span className="inline-flex items-center px-3 py-2 bg-slate-600 border border-l-0 border-slate-600 rounded-r-md text-slate-400">
                .lighthouse.com
              </span>
            </div>
          </div>

          {/* Primary Admin Email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Primary Admin Email
            </label>
            <input
              type="email"
              name="adminEmail"
              value={formData.adminEmail}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="john@tigercorp.com"
              required
            />
          </div>

          {/* Admin Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Admin Full Name
            </label>
            <input
              type="text"
              name="adminName"
              value={formData.adminName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="John Smith"
              required
            />
          </div>

          {/* Subscription Plan */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Subscription Plan
            </label>
            <select
              name="planId"
              value={formData.planId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            >
              <option value="">Select a plan</option>
              {subscriptionPlans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({formatPrice(plan.monthly_price_in_paise)})
                </option>
              ))}
            </select>
          </div>

          {/* Selected Plan Details */}
          {formData.planId && (
            <div className="bg-slate-700 rounded-md p-4">
              {(() => {
                const selectedPlan = subscriptionPlans.find(plan => plan.id === parseInt(formData.planId))
                return selectedPlan ? (
                  <div>
                    <h3 className="font-medium text-slate-100 mb-2">{selectedPlan.name} Plan</h3>
                    <p className="text-sm text-slate-300 mb-2">{selectedPlan.features.description}</p>
                    <div className="text-sm text-slate-400">
                      <strong>Price:</strong> {formatPrice(selectedPlan.monthly_price_in_paise)}
                    </div>
                    <div className="text-sm text-slate-400">
                      <strong>Max Users:</strong> {selectedPlan.features.max_users}
                    </div>
                    <div className="text-sm text-slate-400">
                      <strong>Monthly Recognitions:</strong> {selectedPlan.features.max_recognitions_per_month === -1 ? 'Unlimited' : selectedPlan.features.max_recognitions_per_month}
                    </div>
                  </div>
                ) : null
              })()}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/platform-admin')}
              className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-100 rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {isLoading ? 'Creating Tenant...' : 'Create Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}