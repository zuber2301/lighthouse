import React, { useState } from 'react'
import Modal from '../../components/Modal'

const EMPLOYEES = ['Alice', 'Bob', 'Charlie', 'Dana', 'Eve']

export default function NominateModal({ open, onClose, onSubmit }) {
  const [nominee, setNominee] = useState(EMPLOYEES[0])
  const [points, setPoints] = useState(50)
  const [tag, setTag] = useState('')
  const [message, setMessage] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!nominee || points <= 0) return
    onSubmit({ actor: 'You', nominee, points, tag, message })
    // reset minimal fields and close
    setPoints(50)
    setTag('')
    setMessage('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-lg font-semibold">Nominate a Peer</h2>

        <label className="block">
          <div className="text-sm text-slate-400">Select Employee</div>
          <select value={nominee} onChange={(e) => setNominee(e.target.value)} className="mt-1 w-full bg-slate-900 rounded-md p-2 focus:outline-none focus-visible:ring-3 focus-visible:ring-primary">
            {EMPLOYEES.map((e) => (
              <option key={e} value={e} className="bg-slate-800">{e}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <div className="text-sm text-slate-400">Points</div>
          <input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} className="mt-1 w-full bg-slate-900 rounded-md p-2" min={1} />
        </label>

        <label className="block">
          <div className="text-sm text-slate-400">Value Tag</div>
          <input value={tag} onChange={(e) => setTag(e.target.value)} className="mt-1 w-full bg-slate-900 rounded-md p-2" placeholder="Teamwork, Innovation" />
        </label>

        <label className="block">
          <div className="text-sm text-slate-400">Message</div>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1 w-full bg-slate-900 rounded-md p-2" rows={4} />
        </label>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-slate-700 focus:outline-none focus-visible:ring-3 focus-visible:ring-primary">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 focus:outline-none focus-visible:ring-3 focus-visible:ring-primary">Submit Recognition</button>
        </div>
      </form>
    </Modal>
  )
}
