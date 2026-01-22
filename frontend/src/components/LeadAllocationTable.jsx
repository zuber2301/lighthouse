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
      <div className="bg-indigo-900 rounded-3xl p-6 text-white flex justify-between items-center">
        <div>
          <p className="text-indigo-200 text-sm font-bold uppercase tracking-widest">Available for Allocation</p>
          <h2 className="text-3xl font-black mt-1">₹{(masterBalance/100).toLocaleString(undefined,{minimumFractionDigits:2})}</h2>
        </div>
        <div className="bg-white/10 p-4 rounded-2xl">
          <p className="text-xs opacity-80 uppercase font-bold">Total Leads</p>
          <p className="text-2xl font-bold text-center">{leads.length}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-card rounded-[2.5rem] border dark:border-border-soft shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-widest">
              <th className="px-8 py-5 font-bold">Department Lead</th>
              <th className="px-8 py-5 font-bold">Current Budget</th>
              <th className="px-8 py-5 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">{lead.full_name?.charAt(0)}</div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{lead.full_name}</p>
                      <p className="text-xs text-slate-500">{lead.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-lg font-mono font-bold text-slate-700 dark:text-slate-300">₹{((lead.lead_budget_balance||0)/100).toLocaleString(undefined,{minimumFractionDigits:2})}</span>
                </td>
                <td className="px-8 py-6 text-right">
                  <button onClick={() => openModal(lead)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-black transition">
                    <span className="text-lg">➜</span> Allocate Funds
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {leads.length === 0 && (
          <div className="p-20 text-center">
              <div className="inline-flex p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                <span className="text-slate-400 text-2xl">＋</span>
              </div>
            <p className="text-slate-500 font-medium">No Department Leads found for this tenant.</p>
          </div>
        )}
      </div>

      {modalOpen && activeLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-2">Allocate to {activeLead.full_name}</h3>
            <p className="text-sm text-slate-500 mb-4">Master pool: ₹{(masterBalance/100).toLocaleString(undefined,{minimumFractionDigits:2})}</p>

            <div className="mb-3">
              <label className="block text-sm font-medium text-slate-700">Amount (₹)</label>
              <input type="number" step="0.01" min="0" max={maxRupees()} value={amount} onChange={handleAmountChange} className={`mt-1 w-full px-3 py-2 border rounded-md ${parseFloat(amount||0) > maxRupees() ? 'border-red-500 text-red-600' : ''}`} />
              {parseFloat(amount||0) > maxRupees() && <p className="text-red-500 text-sm mt-1">Amount exceeds master pool</p>}
            </div>

            {error && <div className="text-red-600 mb-2">{error}</div>}

            <div className="flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 rounded bg-slate-200">Cancel</button>
              <button disabled={!canSubmit()} onClick={handleAllocate} className={`px-4 py-2 rounded font-bold ${canSubmit() ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-500'}`}>{submitting ? 'Allocating...' : 'Allocate'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
