import React, { useState } from 'react'
import Modal from './Modal'
import api from '../api/axiosClient'
import CurrencyInput from './CurrencyInput'
import ConfirmationModal from './ConfirmationModal'

const LoadBudgetModal = ({ open, onClose, tenant, onLoaded }) => {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSubmit = () => {
    setError(null)
    const num = Number(amount)
    if (!tenant) {
      setError('No tenant selected')
      return
    }
    if (!Number.isFinite(num) || num <= 0) {
      setError('Enter a valid positive amount')
      return
    }
    setShowConfirm(true)
  }

  const doLoad = async () => {
    setError(null)
    setLoading(true)
    try {
      const num = Number(amount)
      const resp = await api.post('/platform/load-budget', { tenant_id: tenant.id, amount: num })
      const data = resp.data
      onLoaded && onLoaded(data)
      setAmount('')
      setShowConfirm(false)
      onClose()
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const formattedPreview = () => {
    if (!amount) return ''
    const n = Number(amount)
    if (!isFinite(n)) return amount
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-md">
      <div>
        <h3 className="text-xl font-black text-text-main tracking-tight">Load Master Budget</h3>
        <p className="text-sm text-text-main opacity-50 mb-6 mt-1 uppercase tracking-widest font-bold">Tenant: <span className="text-indigo-500 opacity-100 italic">{tenant?.name}</span></p>

        <div className="mb-6">
          <label className="block text-[13px] font-black uppercase tracking-widest text-text-main/40 mb-2">Amount (INR)</label>
          <CurrencyInput
            value={amount}
            onChange={(v) => setAmount(v)}
            placeholder="e.g. 1000000"
          />
        </div>

        {error && <div className="text-rose-400 text-[11px] font-bold uppercase tracking-widest mb-4 bg-rose-500/5 p-3 rounded-xl border border-rose-500/10">Error: {error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-indigo-500/10 text-text-main text-xs font-black uppercase tracking-widest hover:bg-slate-500/5 transition-all">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="px-5 py-2.5 rounded-xl btn-accent font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">
            {loading ? 'Processing...' : 'Load Budget'}
          </button>
        </div>

      <ConfirmationModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Load"
        body={<>
          You are about to load <strong>₹{formattedPreview() || amount}</strong> into <strong>{tenant?.name}</strong>.
          This action will increase the tenant's master budget and is auditable.
        </>}
        confirmLabel="Confirm Load"
        onConfirm={doLoad}
        loading={loading}
      />
      </div>
    </Modal>
  )
}

export default LoadBudgetModal
