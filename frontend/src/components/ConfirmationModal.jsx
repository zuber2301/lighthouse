import React from 'react'
import Modal from './Modal'

export default function ConfirmationModal({ open, onClose, title, body, confirmLabel = 'Confirm', onConfirm, loading }) {
  return (
    <Modal open={open} onClose={onClose} className="max-w-xl">
      <div className="flex flex-col">
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <div className="mb-6 text-slate-300 leading-relaxed text-sm">
          {body}
        </div>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-5 py-2 rounded bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            disabled={loading} 
            className="px-5 py-2 rounded bg-red-600 text-white font-bold hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
