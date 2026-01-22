import React, { useState, useEffect } from 'react'
import api from '../api/axiosClient'

const Currency = ({ paise }) => {
  const rupees = (paise || 0) / 100
  return <span className="text-lg font-mono font-bold">₹{rupees.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
}

export default function LeadAllocationTable({ tenantId, onAllocated }) {
  const [leads, setLeads] = useState([])
  const [masterBalance, setMasterBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeLead, setActiveLead] = useState(null)
  const [amount, setAmount] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchData() }, [tenantId])

  const fetchData = async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const t = await api.get(`/tenants/${tenantId}`)
      setMasterBalance(t.data.master_budget_balance_paise || 0)
      const r = await api.get(`/admin/tenants/${tenantId}/leads`)
      setLeads(r.data || [])
    } catch (e) {
      console.error('fetch leads failed', e)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (lead) => { setActiveLead(lead); setAmount(''); setError(null); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setActiveLead(null); setAmount(''); setError(null) }

  const handleAmountChange = (e) => {
    const v = e.target.value.replace(/[^0-9.]/g, '')
    setAmount(v)
    setError(null)
  }

  const maxRupees = () => (masterBalance || 0) / 100

  const canSubmit = () => {
    const val = parseFloat(amount || '0')
    return !submitting && val > 0 && val <= maxRupees()
  }

  const handleAllocate = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const payload = { tenant_id: tenantId, lead_id: activeLead.id, amount: parseFloat(amount) }
      const resp = await api.post('/admin/allocate-to-lead', payload)
      // update UI
      setMasterBalance(resp.data.master_budget_balance_paise)
      setLeads((prev) => prev.map(l => l.id === resp.data.lead_id ? { ...l, lead_budget_balance: resp.data.lead_budget_balance_paise } : l))
      closeModal()
      onAllocated && onAllocated(resp.data)
    } catch (e) {
      console.error('allocate failed', e)
      setError(e?.response?.data?.detail || 'Allocation failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="bg-indigo-600 rounded-3xl p-6 text-accent-contrast flex justify-between items-center shadow-lg shadow-indigo-600/20">
        <div>
          <p className="text-accent-contrast opacity-70 text-[10px] font-bold uppercase tracking-widest">Available for Allocation</p>
          <h2 className="text-3xl font-black mt-1">₹{(masterBalance/100).toLocaleString(undefined,{minimumFractionDigits:2})}</h2>
        </div>
        <div className="bg-card/10 border border-indigo-500/10 p-4 rounded-2xl backdrop-blur-sm">
          <p className="text-[10px] opacity-80 uppercase font-bold tracking-tight">Total Leads</p>
          <p className="text-2xl font-black text-center">{leads.length}</p>
        </div>
      </div>

      <div className="bg-card border border-indigo-500/10 rounded-[2.5rem] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-indigo-500/5 text-text-main text-[10px] uppercase tracking-widest opacity-60">
              <th className="px-8 py-5 font-bold">Department Lead</th>
              <th className="px-8 py-5 font-bold">Current Budget</th>
              <th className="px-8 py-5 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-500/5">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-indigo-500/5 transition duration-150">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-500">{lead.full_name?.charAt(0)}</div>
                    <div>
                      <p className="font-bold text-text-main">{lead.full_name}</p>
                      <p className="text-xs opacity-50 text-text-main">{lead.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-lg font-mono font-bold text-text-main">₹{((lead.lead_budget_balance||0)/100).toLocaleString(undefined,{minimumFractionDigits:2})}</span>
                </td>
                <td className="px-8 py-6 text-right">
                  <button onClick={() => openModal(lead)} className="inline-flex items-center gap-2 px-5 py-2.5 btn-accent rounded-xl text-sm font-bold hover:brightness-95 transition shadow-md shadow-indigo-600/10">
                    Allocate Funds
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {leads.length === 0 && (
          <div className="p-20 text-center">
              <div className="inline-flex p-4 bg-indigo-500/5 rounded-full mb-4">
                <span className="text-indigo-500/40 text-2xl">＋</span>
              </div>
            <p className="text-text-main opacity-50 font-normal">No Department Leads found for this tenant.</p>
          </div>
        )}
      </div>

      {modalOpen && activeLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-indigo-500/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-1 text-text-main">Allocate Funds</h3>
            <p className="text-sm opacity-60 text-text-main mb-6">Master pool: ₹{(masterBalance/100).toLocaleString(undefined,{minimumFractionDigits:2})}</p>

            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-widest text-text-main opacity-60 mb-2">Amount (₹)</label>
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                max={maxRupees()} 
                value={amount} 
                onChange={handleAmountChange} 
                className={`w-full px-4 py-3 bg-surface border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-text-main transition-all ${parseFloat(amount||0) > maxRupees() ? 'border-rose-500 ring-rose-500/20' : 'border-indigo-500/10'}`} 
                placeholder="Enter amount"
              />
              {parseFloat(amount||0) > maxRupees() && <p className="text-rose-500 text-[10px] font-bold mt-1 uppercase tracking-tight">Amount exceeds master pool</p>}
            </div>

            {error && <div className="text-rose-500 text-xs font-bold mb-4 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">{error}</div>}

            <div className="flex gap-3 mt-8">
              <button onClick={closeModal} className="flex-1 px-4 py-3 rounded-xl bg-surface text-text-main font-bold hover:bg-indigo-500/5 transition-all outline-none border border-indigo-500/10">Cancel</button>
              <button disabled={!canSubmit()} onClick={handleAllocate} className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all shadow-lg ${canSubmit() ? 'btn-accent shadow-indigo-600/20 hover:brightness-95' : 'bg-indigo-500/10 text-text-main opacity-20'}`}>
                {submitting ? 'Allocating...' : 'Confirm Allocation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
