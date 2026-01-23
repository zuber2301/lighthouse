import React from 'react'
import Modal from './Modal'

export default function ConfirmationModal({ open, onClose, title, body, confirmLabel = 'Confirm', onConfirm, loading }) {
  return (
    <Modal open={open} onClose={onClose} className="max-w-md">
      <div className="flex flex-col">
        <h3 className="text-lg font-bold text-text-main mb-2">{title}</h3>
        <div className="mb-4 text-text-main opacity-70 leading-relaxed text-sm">
          {body}
        </div>
        <div className="flex justify-start gap-2">
          <button 
            onClick={onClose} 
            className="px-3 py-1.5 rounded bg-card border border-indigo-500/10 text-text-main text-sm font-semibold hover:bg-indigo-500/5 transition"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            disabled={loading} 
            className="px-3 py-1.5 rounded btn-danger text-sm font-semibold hover:brightness-95 transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
