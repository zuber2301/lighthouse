import React, { useState, useEffect } from 'react'
import api from '../../lib/api'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
import { useTenant } from '../../lib/TenantContext'
import CompactBudgetCard from '../../components/CompactBudgetCard'

export default function TenantAdminBudget() {
  const { selectedTenant } = useTenant()
  const [masterBalance, setMasterBalance] = useState(0)
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('budget')
  const [forecast, setForecast] = useState([])

  useEffect(() => {
    fetchBudgetStatus()
    fetchForecast()
  }, [])

  const fetchForecast = async () => {
    try {
      const response = await api.get('/milestones/upcoming?days=90')
      const items = response.data || []
      
      // Group by month
      const months = {}
      items.forEach(m => {
        // Simple logic for days_away to months
        const targetDate = new Date()
        targetDate.setDate(targetDate.getDate() + m.days_away)
        const monthLabel = targetDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })
        
        if (!months[monthLabel]) months[monthLabel] = { count: 0, points: 0 }
        months[monthLabel].count += 1
        months[monthLabel].points += 100 // System standard
      })
      
      setForecast(Object.entries(months).map(([label, data]) => ({ label, ...data })))
    } catch (e) {
      console.error('Forecast failed', e)
    }
  }

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

    try {
      const res = await api.post('/tenant/budget/load', { amount: parseInt(amount, 10) })
      const data = res.data
      setMasterBalance((data.master_balance || 0) / 100)
      setLoadAmount('')
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

    try {
      const res = await api.post('/tenant/budget/allocate', { lead_id: leadId, amount: num })
      const data = res.data
      setMasterBalance((data.master_balance || 0) / 100)
      setLeads(leads.map(l => l.id === leadId ? { ...l, budget: (data.lead_budget || 0) / 100 } : l))
      setAllocationAmounts({ ...allocationAmounts, [leadId]: '' })
    } catch (error) {
      console.error('Failed to allocate budget:', error)
    }
  }

  const [loadAmount, setLoadAmount] = useState('')
  const [allocationAmounts, setAllocationAmounts] = useState({})

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const totalAllocated = leads.reduce((sum, l) => sum + l.budget, 0);
  const mockSpent = totalAllocated * 0.4; // 40% spent for demo

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader 
          title="Command Center" 
          subtitle={`Managing ${selectedTenant?.name || 'Triton Industries'}`} 
        />
        <div className="flex bg-card border border-indigo-500/10 p-1 rounded-xl shadow-sm-sm border border-border-soft">
          {['budget', 'employees', 'culture', 'rewards'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab 
                ? 'btn-accent shadow-sm-md' 
                : 'opacity-70 text-text-main hover:text-text-main'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'budget' && (
        <>
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="flex flex-col justify-between">
              <p className="text-xs font-bold opacity-70 text-text-main uppercase">Master Balance</p>
              <h2 className="text-2xl font-bold text-text-main mt-2">₹{masterBalance.toLocaleString()}</h2>
              <div className="mt-4 flex gap-2">
                <input 
                  type="number" 
                  placeholder="Load ₹"
                  value={loadAmount}
                  onChange={e => setLoadAmount(e.target.value)}
                  className="w-full text-xs bg-surface border border-indigo-500/10 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none text-text-main"
                />
                <button 
                  onClick={() => loadBudget(loadAmount)}
                  className="btn-accent text-[10px] font-bold px-3 py-1 rounded-lg hover:brightness-95 transition-colors"
                >
                  LOAD
                </button>
              </div>
            </Card>
            <Card>
              <p className="text-xs font-bold opacity-70 text-text-main uppercase">Active Users</p>
              <h2 className="text-2xl font-bold text-text-main mt-2">1,284</h2>
              <p className="text-xs text-emerald-500 font-normal mt-auto">+12 this week</p>
            </Card>
            <Card>
              <p className="text-xs font-bold opacity-70 text-text-main uppercase">Total Recognition</p>
              <h2 className="text-2xl font-bold text-text-main mt-2">856</h2>
              <p className="text-xs text-indigo-500 font-normal mt-auto">Avg 4.2 / user</p>
            </Card>
            <Card>
              <p className="text-xs font-bold opacity-70 text-text-main uppercase">Redemptions</p>
              <h2 className="text-2xl font-bold text-text-main mt-2">142</h2>
              <p className="text-xs opacity-60 text-text-main font-normal mt-auto">24 pending approval</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Middle Left: Compact Budget Card */}
            <div className="lg:col-span-2">
              <CompactBudgetCard 
                master={masterBalance + totalAllocated} 
                allocated={totalAllocated} 
                spent={mockSpent} 
              />
            </div>

            {/* Middle Right: Initiatives/Badges Quick View */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-text-main">Active Initiatives</h3>
                <button className="text-[10px] text-indigo-500 font-bold hover:underline">VIEW ALL</button>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Q1 Safety Sprint", color: "bg-amber-500/10 text-amber-500", icon: "⚓" },
                  { label: "Code Quality Month", color: "bg-indigo-500/10 text-indigo-500", icon: "💻" },
                  { label: "Wellness Week", color: "bg-emerald-500/10 text-emerald-500", icon: "🧘" }
                ].map((init, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                    <span className="text-lg">{init.icon}</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-text-main">{init.label}</p>
                      <div className="h-1 w-full bg-indigo-500/10 rounded-full mt-1 overflow-hidden">
                        <div className={`h-full ${init.color.split(' ')[1].replace('500', '600')}`} style={{ width: '60%' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Milestone Budget Forecast */}
          {forecast.length > 0 && (
            <Card className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-l-4 border-l-purple-500">
               <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-text-main">Automated Milestone Forecast</h3>
                  <p className="text-[11px] opacity-70">Projected budget for Birthday & Anniversary awards (100 pts ea.)</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-purple-600">
                    {forecast.reduce((sum, f) => sum + f.points, 0).toLocaleString()}
                  </span>
                  <p className="text-[10px] font-bold opacity-60 uppercase tracking-tighter">Total 90-Day Pts</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {forecast.map((f, i) => (
                  <div key={i} className="p-4 bg-white/50 border border-purple-500/10 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase text-purple-600 tracking-widest">{f.label}</p>
                      <p className="text-lg font-bold text-text-main">{f.count} <span className="text-sm font-normal opacity-60">Milestones</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-text-main">{f.points.toLocaleString()} pts</p>
                      <div className="h-1.5 w-16 bg-purple-500/10 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${(f.count / Math.max(...forecast.map(x => x.count))) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Bottom: Lead Allocation Table */}
          <Card className="overflow-hidden p-0">
            <div className="p-6 border-b border-indigo-500/10 flex justify-between items-center">
              <h3 className="font-bold text-text-main">Department Lead Allocations</h3>
              <button className="text-xs bg-indigo-500/10 text-indigo-500 font-bold px-3 py-1 rounded-lg hover:bg-indigo-500/20 transition-colors">EXPORT CSV</button>
            </div>
            <div className="overflow-x-auto styled-scrollbar">
              <table className="w-full">
                <thead className="bg-indigo-500/5 text-[10px] uppercase tracking-widest opacity-70 text-text-main">
                  <tr>
                    <th className="px-6 py-3 text-left">Department Lead</th>
                    <th className="px-6 py-3 text-left">Department</th>
                    <th className="px-6 py-3 text-right">Current Budget</th>
                    <th className="px-6 py-3 text-right">Transfer Funds</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-500/10">
                  {leads.map(lead => (
                    <tr key={lead.id} className="hover:bg-indigo-500/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 text-xs font-bold">
                            {lead.full_name?.charAt(0) || lead.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text-main">{lead.full_name || lead.name}</p>
                            <p className="text-[10px] opacity-70 text-text-main">{lead.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-normal px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 uppercase tracking-tight">
                          {lead.department || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-bold text-text-main">₹{lead.budget.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <input 
                            type="number" 
                            placeholder="Amount"
                            className="w-24 text-xs bg-surface border border-indigo-500/10 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500 text-text-main"
                            value={allocationAmounts[lead.id] || ''}
                            onChange={e => setAllocationAmounts({ ...allocationAmounts, [lead.id]: e.target.value })}
                          />
                          <button 
                            onClick={() => allocateToLead(lead.id, allocationAmounts[lead.id])}
                            className="btn-accent text-[10px] font-bold px-3 py-1 rounded-lg hover:brightness-95 transition-colors"
                          >
                            SEND
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

          {activeTab !== 'budget' && (
        <Card className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-card/20 flex items-center justify-center text-2xl mb-4">🏗️</div>
          <h3 className="text-lg font-bold text-text-main">Section Under Construction</h3>
          <p className="text-sm text-text-main/60 mt-2 max-w-sm">
            We're building the premium {activeTab} management experience for Triton Industries.
          </p>
          <button 
            onClick={() => setActiveTab('budget')}
            className="mt-6 text-indigo-600 font-bold hover:underline text-sm"
          >
            ← Back to Budget Control
          </button>
        </Card>
      )}
    </div>
  )
}