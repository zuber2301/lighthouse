import React, { useState, useEffect } from 'react'
import api from '../../lib/api'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
import { useTenant } from '../../lib/TenantContext'

export default function TenantAdminBudget() {
  const { selectedTenant } = useTenant()
  const [masterBalance, setMasterBalance] = useState(0)
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBudgetStatus()
  }, [])

  const fetchBudgetStatus = async () => {
    try {
      const response = await api.get('/tenant/budget')
      const data = response.data || {}
      setMasterBalance((data.master_budget || 0) / 100)
      setLeads((data.leads || []).map(lead => ({ ...lead, budget: (lead.budget || 0) / 100 })))
    } catch (error) {
      console.error('Failed to fetch budget status:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadBudget = async (amount) => {
    if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      alert('Enter a valid positive amount')
      return
    }

    if (!window.confirm(`Load ₹${Number(amount).toLocaleString()} to master budget?`)) return

    try {
      const res = await api.post('/tenant/budget/load', { amount: parseInt(amount, 10) })
      const data = res.data
      setMasterBalance((data.master_balance || 0) / 100)
    } catch (error) {
      console.error('Failed to load budget:', error)
    }
  }

  const allocateToLead = async (leadId, amount) => {
    const num = parseInt(amount, 10)
    if (!Number.isFinite(num) || num <= 0) {
      alert('Enter a valid positive amount')
      return
    }
    if (num > masterBalance) {
      alert('Insufficient Master Balance')
      return
    }

    if (!window.confirm(`Allocate ₹${num.toLocaleString()} to ${leadId}?`)) return

    try {
      const res = await api.post('/tenant/budget/allocate', { lead_id: leadId, amount: num })
      const data = res.data
      setMasterBalance((data.master_balance || 0) / 100)
      setLeads(leads.map(l => l.id === leadId ? { ...l, budget: (data.lead_budget || 0) / 100 } : l))
    } catch (error) {
      console.error('Failed to allocate budget:', error)
    }
  }

  const [loadAmount, setLoadAmount] = useState('')
  const [allocationAmounts, setAllocationAmounts] = useState({})

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6">
      <PageHeader title="Budget Management" subtitle={`Load funds and allocate to department leads${selectedTenant ? ` — ${selectedTenant.name}` : ''}`} />

      {/* Load Budget Section */}
      <Card className="mb-6">
        <div className="bg-indigo-900 text-white p-8 rounded-2xl mb-6">
          <h2 className="text-sm uppercase tracking-widest opacity-70">Company Master Budget</h2>
          <h1 className="text-4xl font-bold">₹{masterBalance.toLocaleString()}</h1>
        </div>

        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Load Amount (₹)</label>
            <input
              type="number"
              value={loadAmount}
              onChange={(e) => setLoadAmount(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-32"
              placeholder="100000"
            />
          </div>
          <button
            onClick={() => {
              loadBudget(loadAmount)
              setLoadAmount('')
            }}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
            disabled={!loadAmount || parseInt(loadAmount) <= 0}
          >
            Load Budget
          </button>
        </div>
      </Card>

      {/* Allocate to Leads Section */}
      <Card>
        <h3 className="font-bold text-lg mb-4">Allocate to Department Leads</h3>
        <div className="grid gap-4">
          {leads.map(lead => (
            <div key={lead.id} className="flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm">
              <div>
                <p className="font-bold">{lead.name}</p>
                <p className="text-sm text-slate-500">Current Budget: ₹{lead.budget.toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Amount"
                  className="border p-2 rounded-lg w-32"
                  value={allocationAmounts[lead.id] || ''}
                  onChange={(e) => setAllocationAmounts({
                    ...allocationAmounts,
                    [lead.id]: e.target.value
                  })}
                />
                <button
                  onClick={() => {
                    allocateToLead(lead.id, allocationAmounts[lead.id])
                    setAllocationAmounts({
                      ...allocationAmounts,
                      [lead.id]: ''
                    })
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  disabled={!allocationAmounts[lead.id] || parseInt(allocationAmounts[lead.id]) <= 0}
                >
                  Transfer
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}