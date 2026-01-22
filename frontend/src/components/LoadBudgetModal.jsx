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
    <Modal open={open} onClose={onClose}>
      <div>
        <h3 className="text-lg font-bold mb-2 text-text-main">Load Master Budget</h3>
        <p className="text-sm text-text-main opacity-70 mb-4">Tenant: <span className="font-semibold">{tenant?.name}</span></p>

        <div className="mb-4">
          <label className="block text-sm text-text-main/60 mb-1">Amount</label>
          <CurrencyInput
            value={amount}
            onChange={(v) => setAmount(v)}
            placeholder="e.g. 1000000"
          />
        </div>

        {error && <div className="text-rose-400 text-sm mb-3">{error}</div>}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-card border border-indigo-500/10 text-text-main">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 rounded btn-accent font-bold">
            {loading ? 'Loading...' : 'Load & Confirm'}
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
