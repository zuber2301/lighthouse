import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { API_BASE } from '../../lib/api'
import TenantContext from '../../lib/TenantContext'

export default function CreateTenantForm({ onCreated = null, redirectOnSuccess = '/platform-admin', alertOnSuccess = true }) {
  const navigate = useNavigate()
  const tenantCtx = useContext(TenantContext) || {}
  const addTenant = tenantCtx.addTenant
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
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    console.log('CreateTenantForm mounted, fetching plans...')
    fetchSubscriptionPlans()
  }, [])

  const fetchSubscriptionPlans = async () => {
    setIsLoadingPlans(true)
    try {
      const response = await api.get('/platform/subscription-plans')
      console.log('Fetched subscription plans:', response.data)
      const plans = response.data
      const normalizedPlans = Array.isArray(plans) ? plans : (plans && plans.data && Array.isArray(plans.data) ? plans.data : [])
      setSubscriptionPlans(normalizedPlans)
      if (normalizedPlans.length === 0) {
        setErrorMessage('No subscription plans found in the system.')
      }
      const basicPlan = normalizedPlans.find(plan => plan && plan.name === 'Basic')
      if (basicPlan) {
        setFormData(prev => ({ ...prev, planId: basicPlan.id }))
      }
    } catch (error) {
      console.error('Failed to fetch subscription plans:', error)
      const status = error.response?.status
      if (status === 403) {
        setErrorMessage('Access denied. Platform owner permissions required (403).')
      } else if (status === 401) {
        setErrorMessage('Not authorized. Please log in (401).')
      } else {
        setErrorMessage(`Error loading plans: ${error.message}`)
      }
    } finally {
      setIsLoadingPlans(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (name === 'name') {
      const subdomain = value.toLowerCase().replace(/[^a-z0-9]/g, '')
      setFormData(prev => ({ ...prev, subdomain }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await api.post('/platform/tenants', {
        name: formData.name,
        subdomain: formData.subdomain,
        admin_email: formData.adminEmail,
        admin_name: formData.adminName,
        plan_id: parseInt(formData.planId)
      })
      
      const result = response.data
      try { if (addTenant) addTenant(result) } catch (e) {}
      setErrorMessage('')
      if (onCreated) {
        try { onCreated(result) } catch (e) {}
      } else {
        if (alertOnSuccess) alert(`Tenant "${formData.name}" created successfully! Subdomain: ${result.subdomain}.lighthouse.com`)
        if (redirectOnSuccess) navigate(redirectOnSuccess)
      }
    } catch (error) {
      const status = error.response?.status
      const text = error.response?.data?.detail || error.message
      console.error('Create tenant failed', { status, text })
      if (status === 401) {
        if (alertOnSuccess) alert('Unauthorized. Please sign in as a platform owner.')
        setErrorMessage('Unauthorized. Please sign in as a platform owner.')
      } else if (status === 403) {
        if (alertOnSuccess) alert('Forbidden. Your account lacks platform owner permissions.')
        setErrorMessage('Forbidden. Your account lacks platform owner permissions.')
      } else {
        if (alertOnSuccess) alert(`Error creating tenant (${status}): ${text || 'unknown error'}`)
        setErrorMessage(text || 'Error creating tenant')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (priceInPaise) => {
    if (priceInPaise === 0) return 'Free'
    if (!priceInPaise && priceInPaise !== 0) return ''
    return `$${(priceInPaise / 100).toFixed(2)}/month`
  }

  if (isLoadingPlans) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-text-main">Loading subscription plans...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-card border border-indigo-500/10 rounded-lg p-6 border border-border-soft">
        <h1 className="text-2xl font-bold text-text-main mb-6">Onboard New Company</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="text-sm text-red-400 mb-2">{errorMessage}</div>
          )}

          <div>
            <label htmlFor="company-name" className="block text-sm font-medium text-text-main opacity-80 mb-2">Company Name</label>
            <input id="company-name" aria-label="Company Name" type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 bg-surface border border-border-soft rounded-md text-text-main placeholder-text-main opacity-40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="TigerCorp" required />
          </div>

          <div>
            <label htmlFor="subdomain" className="block text-sm font-medium text-text-main opacity-80 mb-2">Subdomain</label>
            <div className="flex">
              <input aria-label="Subdomain" id="subdomain" type="text" name="subdomain" value={formData.subdomain} onChange={handleInputChange} className="flex-1 px-3 py-2 bg-surface border border-border-soft rounded-l-md text-text-main placeholder-text-main opacity-40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="tigercorp" required />
              <span className="inline-flex items-center px-3 py-2 bg-surface border border-l-0 border-border-soft rounded-r-md opacity-70 text-text-main">.lighthouse.com</span>
            </div>
          </div>

          <div>
            <label htmlFor="adminEmail" className="block text-sm font-medium text-text-main opacity-80 mb-2">Primary Admin Email</label>
            <input aria-label="Admin Email" id="adminEmail" type="email" name="adminEmail" value={formData.adminEmail} onChange={handleInputChange} className="w-full px-3 py-2 bg-surface border border-border-soft rounded-md text-text-main placeholder-text-main opacity-40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="john@tigercorp.com" required />
          </div>

          <div>
            <label htmlFor="adminName" className="block text-sm font-medium text-text-main opacity-80 mb-2">Admin Full Name</label>
            <input aria-label="Admin Name" id="adminName" type="text" name="adminName" value={formData.adminName} onChange={handleInputChange} className="w-full px-3 py-2 bg-surface border border-border-soft rounded-md text-text-main placeholder-text-main opacity-40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="John Smith" required />
          </div>

          <div>
            <label htmlFor="planId" className="block text-sm font-medium text-text-main opacity-80 mb-2">Subscription Plan</label>
            <select aria-label="Subscription Plan" id="planId" name="planId" value={formData.planId} onChange={handleInputChange} className="w-full px-3 py-2 bg-surface border border-border-soft rounded-md text-text-main focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" required>
              <option value="">Select a plan</option>
              {subscriptionPlans.map(plan => (
                <option key={plan.id} value={plan.id}>{plan.name} ({formatPrice(plan.monthly_price_in_paise)})</option>
              ))}
            </select>
          </div>

          {formData.planId && (
            <div className="bg-surface rounded-md p-4">
              {(() => {
                const selectedPlan = subscriptionPlans.find(plan => plan.id === parseInt(formData.planId))
                return selectedPlan ? (
                  <div>
                    <h3 className="font-medium text-text-main mb-2">{selectedPlan.name} Plan</h3>
                    <p className="text-sm text-text-main opacity-80 mb-2">{selectedPlan.features?.description}</p>
                    <div className="text-sm opacity-70 text-text-main"><strong>Price:</strong> {formatPrice(selectedPlan.monthly_price_in_paise)}</div>
                    <div className="text-sm opacity-70 text-text-main"><strong>Max Users:</strong> {selectedPlan.features?.max_users}</div>
                    <div className="text-sm opacity-70 text-text-main"><strong>Monthly Recognitions:</strong> {selectedPlan.features?.max_recognitions_per_month === -1 ? 'Unlimited' : selectedPlan.features?.max_recognitions_per_month}</div>
                  </div>
                ) : null
              })()}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => navigate('/platform-admin')} className="flex-1 px-4 py-3 bg-card border border-indigo-500/10 text-text-main rounded-xl transition-all duration-150 font-bold text-sm">Cancel</button>
            <button type="submit" disabled={isLoading} className="flex-1 px-4 py-3 btn-accent disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-150 font-bold text-sm shadow-lg shadow-indigo-600/20">{isLoading ? 'Creating Tenant...' : 'Create Tenant'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
