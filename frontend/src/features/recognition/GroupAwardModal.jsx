import React, { useState, useEffect, useRef } from 'react'
import Modal from '../../components/Modal'
import GroupRecipientPool from './GroupRecipientPool'
import api from '../../api/axiosClient'

export default function GroupAwardModal({ open, onClose, onSubmit, initialData }) {
  const [step, setStep] = useState(1)
  const [recipients, setRecipients] = useState([]) // [{id,name}]

  // Step 2
  const [awardLevel, setAwardLevel] = useState('Bronze - 300')
  const [behaviorAlignment, setBehaviorAlignment] = useState('Moderately')
  const [impactDuration, setImpactDuration] = useState('One-time')
  const awardLevelRef = useRef(null)
  const [awardLevelOpen, setAwardLevelOpen] = useState(false)
  const behaviorRef = useRef(null)
  const [behaviorOpen, setBehaviorOpen] = useState(false)
  const impactRef = useRef(null)
  const [impactOpen, setImpactOpen] = useState(false)

  // Step 3
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState([])

  // Budget
  const [budget, setBudget] = useState(null)
  const [budgetError, setBudgetError] = useState('')

  const [validationError, setValidationError] = useState('')

  function resetAll() {
    setStep(1)
    setRecipients([])
    setAwardLevel('Bronze - 300')
    setBehaviorAlignment('Moderately')
    setImpactDuration('One-time')
    setMessage('')
    setAttachments([])
    setValidationError('')
  }

  function handleNext() {
    if (step === 1 && recipients.length === 0) return setValidationError('Please select at least one recipient.')
    if (step === 2 && !awardLevel) return setValidationError('Please choose an award level.')
    // Budget check when moving from step 2
    if (step === 2) {
      const points = getAwardPoints(awardLevel)
      const total = points * recipients.length
      if (budget !== null && total > budget) return setValidationError('Insufficient lead budget for this group award.')
    }
    setValidationError('')
    setStep((s) => Math.min(3, s + 1))
  }

  async function handleSend(e) {
    e && e.preventDefault()
    if (!recipients.length) return setValidationError('Please select at least one recipient.')
    if (!awardLevel) return setValidationError('Please choose an award level.')
    // Budget final check
    const points = getAwardPoints(awardLevel)
    const total = points * recipients.length
    if (budget !== null && total > budget) return setValidationError('Insufficient lead budget for this group award.')

    const payload = {
      type: 'group',
      recipients: recipients.map((r) => ({ id: r.id, name: r.name })),
      award_level: awardLevel,
      behavior_alignment: behaviorAlignment,
      impact_duration: impactDuration,
      message,
      attachments, // upstream may handle uploads
    }

    // Parent handles API call; await if it returns a promise
    await onSubmit(payload)
    resetAll()
    onClose()
  }

  function handleFileChange(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const withPreviews = files.map((f) => Object.assign(f, { preview: URL.createObjectURL(f) }))
    setAttachments((s) => s.concat(withPreviews))
  }

  function getAwardPoints(level) {
    if (!level || typeof level !== 'string') return 0
    const parts = level.split('-')
    if (parts.length > 1) {
      const num = parseInt(parts[1].trim())
      return isNaN(num) ? 0 : num
    }
    const parsed = parseInt(level)
    return isNaN(parsed) ? 0 : parsed
  }

  useEffect(() => {
    if (!open) return
    let mounted = true
    ;(async () => {
      try {
        const resp = await api.get('/lead/budget')
        const data = resp.data || {}
        // backend returns paise; convert to rupees
        const bal = (data.budget_balance || 0) / 100
        if (mounted) setBudget(bal)
      } catch (err) {
        console.error('Failed to fetch lead budget:', err)
      }
    })()

    function handleClickOutside(e) {
      if (awardLevelRef.current && !awardLevelRef.current.contains(e.target)) setAwardLevelOpen(false)
      if (behaviorRef.current && !behaviorRef.current.contains(e.target)) setBehaviorOpen(false)
      if (impactRef.current && !impactRef.current.contains(e.target)) setImpactOpen(false)
    }
    window.addEventListener('mousedown', handleClickOutside)

    return () => { mounted = false; window.removeEventListener('mousedown', handleClickOutside) }
  }, [open])

  useEffect(() => {
    // Recompute budget error when recipients or award level change
    if (budget === null) return setBudgetError('')
    const points = getAwardPoints(awardLevel)
    const total = points * recipients.length
    if (recipients.length === 0) return setBudgetError('')
    if (total > budget) setBudgetError(`Required ₹${total} exceeds your budget of ₹${budget}`)
    else setBudgetError('')
  }, [recipients, awardLevel, budget])

  return (
    <Modal open={open} onClose={() => { resetAll(); onClose() }} className="max-w-4xl">
      <form onSubmit={handleSend} className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Create Group Award</h2>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setStep(Math.max(1, step - 1))} className="px-3 py-2 rounded-md bg-surface">Back</button>
            {step < 3 ? (
              <button type="button" onClick={handleNext} className="px-4 py-2 rounded-md bg-gradient-to-r from-indigo-500 to-indigo-400 text-white">Next</button>
            ) : (
              <button type="submit" className="px-4 py-2 rounded-md bg-teal-500 text-white">Send</button>
            )}
          </div>
        </div>

        {validationError && <div className="text-sm text-rose-400">{validationError}</div>}

        <div className="grid grid-cols-1 gap-6">
          {step === 1 && (
            <section className="p-4 bg-card border border-border-soft rounded-lg">
              <GroupRecipientPool value={recipients} onChange={setRecipients} />
            </section>
          )}

          {step === 2 && (
            <section className="p-4 bg-card border border-border-soft rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Award Level</label>
                <div ref={awardLevelRef} className="relative">
                  <button type="button" onClick={() => setAwardLevelOpen(!awardLevelOpen)} className="w-full text-left bg-black/10 border border-indigo-500/10 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-white flex items-center justify-between">
                    <span>{awardLevel}</span>
                    <span className="ml-3 text-white/70">▾</span>
                  </button>

                  {awardLevelOpen && (
                    <ul className="absolute left-0 right-0 mt-2 z-50 rounded-md overflow-hidden shadow-lg bg-black/30 border border-white/10" role="listbox">
                      {['Bronze - 300','Silver - 500','Gold - 1000'].map((opt) => (
                        <li key={opt} role="option" onClick={() => { setAwardLevel(opt); setAwardLevelOpen(false) }} className={`px-4 py-3 text-sm text-white hover:bg-white/5 cursor-pointer ${awardLevel === opt ? 'font-bold' : 'font-normal'}`}>{opt}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Behavior Alignment</label>
                <div ref={behaviorRef} className="relative">
                  <button type="button" onClick={() => setBehaviorOpen(!behaviorOpen)} className="w-full text-left bg-black/10 border border-indigo-500/10 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-white flex items-center justify-between">
                    <span>{behaviorAlignment}</span>
                    <span className="ml-3 text-white/70">▾</span>
                  </button>

                  {behaviorOpen && (
                    <ul className="absolute left-0 right-0 mt-2 z-50 rounded-md overflow-hidden shadow-lg bg-black/30 border border-white/10" role="listbox">
                      {['Slightly','Moderately','Significantly'].map((opt) => (
                        <li key={opt} role="option" onClick={() => { setBehaviorAlignment(opt); setBehaviorOpen(false) }} className={`px-4 py-3 text-sm text-white hover:bg-white/5 cursor-pointer ${behaviorAlignment === opt ? 'font-bold' : 'font-normal'}`}>{opt}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Impact Duration</label>
                <div ref={impactRef} className="relative">
                  <button type="button" onClick={() => setImpactOpen(!impactOpen)} className="w-full text-left bg-black/10 border border-indigo-500/10 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-white flex items-center justify-between">
                    <span>{impactDuration}</span>
                    <span className="ml-3 text-white/70">▾</span>
                  </button>

                  {impactOpen && (
                    <ul className="absolute left-0 right-0 mt-2 z-50 rounded-md overflow-hidden shadow-lg bg-black/30 border border-white/10" role="listbox">
                      {['One-time','Long-term'].map((opt) => (
                        <li key={opt} role="option" onClick={() => { setImpactDuration(opt); setImpactOpen(false) }} className={`px-4 py-3 text-sm text-white hover:bg-white/5 cursor-pointer ${impactDuration === opt ? 'font-bold' : 'font-normal'}`}>{opt}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="p-4 bg-card border border-border-soft rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Collective Message</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full bg-surface border border-indigo-500/20 rounded-md p-3 min-h-[140px]" placeholder="Describe the team's accomplishment..." />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Team Media (optional)</label>
                <input type="file" accept="image/*,video/*" onChange={handleFileChange} />
                {attachments.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {attachments.map((f, i) => (
                      <div key={i} className="p-2 bg-surface rounded-md text-sm">{f.name || 'file'}</div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </form>
    </Modal>
  )
}
