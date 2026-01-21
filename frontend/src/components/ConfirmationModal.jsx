import React from 'react'
import Modal from './Modal'

export default function ConfirmationModal({ open, onClose, title, body, confirmLabel = 'Confirm', onConfirm, loading }) {
  return (
    <Modal open={open} onClose={onClose}>
      <div>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <div className="mb-4 text-sm text-slate-200">{body}</div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-slate-700 text-slate-200">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="px-4 py-2 rounded bg-red-600 text-white font-bold">
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
