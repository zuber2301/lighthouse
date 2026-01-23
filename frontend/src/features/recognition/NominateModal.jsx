import React, { useState, useEffect, useRef } from 'react'
import Modal from '../../components/Modal'
import api from '../../api/axiosClient'
// E-Card Designer removed; use simple design choices instead
const CATEGORIES = ['Individual award', 'Group award', 'E-Card']

export default function NominateModal({ open, onClose, onSubmit, initialCategory }) {
  // Recipient (support multiple)
  const [search, setSearch] = useState('')
  const [nominees, setNominees] = useState([])
  const [users, setUsers] = useState([])
  const searchTimer = useRef()

  // Category
  const [category, setCategory] = useState(initialCategory || CATEGORIES[0])
  const [points, setPoints] = useState(50)

  // Sync category if initialCategory changes
  useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory)
    }
  }, [initialCategory])

  // Message + attachments
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState([])
  const [ecardHtml, setEcardHtml] = useState('')
  const [ecardUrl, setEcardUrl] = useState('')

  // Area of focus (align recognition to company goals)
  const [areaOfFocus, setAreaOfFocus] = useState('')

  // Recognition coach suggestions
  const [coachTips, setCoachTips] = useState(null)
  const [coachLoading, setCoachLoading] = useState(false)

  const openedAsECard = initialCategory === 'E-Card'

  // multi-step flow: 1=Recipients, 2=Design, 3=Review & Send
  const [step, setStep] = useState(1)
  const [validationError, setValidationError] = useState('')

  // E-Card design selection (Classic, Modern, Fun)
  const [design, setDesign] = useState('Classic')

  // Build simple e-card HTML string based on selection + fields
  function buildEcardHtml() {
    const img = attachments.find((a) => (a.type || '').startsWith('image/'))
    const imgSrc = img?.url || img?.preview || ''

    // Keep the same overall card dimensions/box but vary visual style strongly per design
    if (design === 'Classic') {
      return `
        <div style="width:100%;box-sizing:border-box;padding:28px;border-radius:14px;background:linear-gradient(135deg,#f8fbff,#eef6ff);color:#0f172a;font-family:Georgia,'Times New Roman',serif;">
          <div style="font-size:22px;font-weight:700;margin-bottom:8px;">${message ? 'Well done!' : 'Congratulations!'}</div>
          ${imgSrc ? `<div style=\"text-align:center;margin:10px 0\"><img src=\"${imgSrc}\" style=\"max-width:100%;border-radius:10px;\"/></div>` : ''}
          <div style="font-size:16px;line-height:1.6;margin-bottom:10px;color:#0f172a">${message || ''}</div>
          <div style="font-size:14px;opacity:0.9">— From your team</div>
        </div>
      `
    }

    if (design === 'Modern') {
      return `
        <div style="width:100%;box-sizing:border-box;padding:30px;border-radius:14px;background:linear-gradient(90deg,#071021 0%,#0b1a2b 100%);color:#e6eef8;font-family:Inter,system-ui,Arial;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
            <div style="width:56px;height:56px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#06b6d4);display:flex;align-items:center;justify-content:center;font-weight:700;color:white;font-size:18px">★</div>
            <div style="font-size:22px;font-weight:700">Nice work</div>
          </div>
          ${imgSrc ? `<div style=\"margin:14px 0;text-align:center\"><img src=\"${imgSrc}\" style=\"max-width:100%;border-radius:12px;\"/></div>` : ''}
          <div style="font-size:15px;line-height:1.5;color:#cfe8ff">${message || ''}</div>
          <div style="margin-top:12px;font-size:13px;opacity:0.85;color:#9fb8d9">Shared on ${new Date().toLocaleDateString()}</div>
        </div>
      `
    }

    // Fun
    return `
      <div style="width:100%;box-sizing:border-box;padding:22px;border-radius:14px;background:linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%);color:#2b2b2b;font-family:Comic Sans MS,'Comic Neue','Segoe UI',sans-serif;">
        <div style="font-size:22px;font-weight:800;margin-bottom:6px">Woohoo!</div>
        ${imgSrc ? `<div style=\"text-align:center;margin:10px 0\"><img src=\"${imgSrc}\" style=\"max-width:100%;border-radius:10px;\"/></div>` : ''}
        <div style="font-size:16px;line-height:1.5">${message || ''}</div>
        <div style="margin-top:12px;font-size:13px;opacity:0.9">🎉</div>
      </div>
    `
  }

  // keep ecardHtml in sync for submission
  useEffect(() => {
    setEcardHtml(buildEcardHtml())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design, message, attachments])

  function handleTopNext() {
    // validation for step 1: require at least one recipient
    if (step === 1) {
      if (!nominees.length) {
        setValidationError('Please select at least one recipient to continue.')
        return
      }
    }
    // clear previous errors
    setValidationError('')
    if (step < 3) setStep(step + 1)
    else handleSubmit()
  }

  // Schedule
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  function resetAll() {
    setSearch('')
    setNominees([])
    setCategory(CATEGORIES[0])
    setMessage('')
    setAttachments([])
    setScheduledDate('')
    setScheduledTime('')
    setEcardHtml('')
    setEcardUrl('')
  }

  function handleFileChange(e) {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // create previews immediately
    const withPreviews = files.map((f) => Object.assign(f, { preview: URL.createObjectURL(f) }))
    setAttachments((s) => s.concat(withPreviews))

    // upload to backend
    const form = new FormData()
    files.forEach((f) => form.append('files', f))
    api
      .post('/recognition/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((res) => {
        const uploaded = res.data || []
        // merge uploaded urls into attachments (match by name)
        setAttachments((prev) =>
          prev.map((p) => {
            const u = uploaded.find((x) => x.name === p.name)
            return u ? Object.assign({}, p, { url: u.url, type: u.type }) : p
          })
        )
      })
      .catch(() => {
        // ignore upload errors for now; previews still shown
      })
  }

  // formatting toolbar removed; simple textarea used for message

  function removeAttachment(idx) {
    setAttachments((s) => s.filter((_, i) => i !== idx))
  }

  async function handleCoach() {
    if (!message || coachLoading) return
    setCoachLoading(true)
    try {
      const res = await api.post('/recognition/coach', { message })
      setCoachTips(res.data || null)
    } catch (err) {
      console.error('Coach failed', err)
      setCoachTips({ tips: ['Could not generate suggestions at this time.'], improved_message: message })
    } finally {
      setCoachLoading(false)
    }
  }

  async function handleSubmit(e) {
    e && e.preventDefault()
    if (!nominees.length) return
    // embed uploaded attachments into message so backend receives references
    const base = api.defaults.baseURL || ''
    let fullMessage = message || ''
    attachments.forEach((a) => {
      if (a.url) {
        const full = `${base.replace(/\/$/, '')}${a.url}`
        if ((a.type || '').startsWith('image/')) {
          fullMessage += `<div><img src=\"${full}\" alt=\"${a.name}\" style=\"max-width:100%\"/></div>`
        } else {
          fullMessage += `<div><a href=\"${full}\" target=\"_blank\">${a.name}</a></div>`
        }
      }
    })

    const payload = {
      nominee_id: null, // set per-recipient when sending
      points: Number(points),
      value_tag: category,
      // Provide ecard_html (so backend can persist) and/or ecard_url (uploaded image)
      message: fullMessage || undefined,
      ecard_html: category === 'E-Card' ? (ecardHtml || undefined) : undefined,
      ecard_url: category === 'E-Card' ? (ecardUrl || undefined) : undefined,
      ecard_design: category === 'E-Card' ? design : undefined,
      is_public: true,
    }

    // send one recognition per selected nominee
    for (const nominee of nominees) {
      const id = typeof nominee === 'string' ? nominee : nominee.id
      const p = Object.assign({}, payload, { nominee_id: id, area_of_focus: areaOfFocus || undefined })
      // parent will perform API call; await to preserve order
      // eslint-disable-next-line no-await-in-loop
      await onSubmit(p)
    }
    resetAll()
    onClose()
  }

  // legacy EMPLOYEES list removed; live `users` search is used instead
  // perform debounced live search against backend when user types
  useEffect(() => {
    if (!search.trim()) {
      setUsers([])
      return
    }
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      api
        .get('/user/search', { params: { q: search } })
        .then((res) => setUsers(res.data || []))
        .catch(() => setUsers([]))
    }, 300)
    return () => clearTimeout(searchTimer.current)
  }, [search])

  return (
    <Modal open={open} onClose={onClose} className="max-w-6xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-3xl font-normal text-text-main tracking-tight">{openedAsECard ? 'Send a E-Card' : 'Nominate a Peer'}</h2>
          <div className="text-[13px] font-normal tracking-[0.08em] opacity-40 text-text-main mt-1">{openedAsECard ? 'Create and send a personalized e-card' : 'Reward excellence across your organization'}</div>

            <div className="mt-6 flex items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4">
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className={`px-3 py-2 rounded-full ${step===1 ? 'opacity-50 cursor-not-allowed bg-surface text-text-main' : 'bg-surface border border-border-soft text-text-main hover:brightness-95'}`}
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => { resetAll(); onClose(); }}
                className={`px-4 py-2 rounded-full text-white shadow-lg bg-gradient-to-r from-gray-500 to-gray-600 hover:brightness-95`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleTopNext}
                disabled={step === 1 && nominees.length === 0}
                className={`px-4 py-2 rounded-full text-white shadow-lg ${step===3 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-indigo-400' } ${step===1 && nominees.length === 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {step < 3 ? 'Next' : 'Send'}
              </button>
            </div>
            {validationError && <div className="text-sm text-rose-400 mt-2">{validationError}</div>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Left column: Entry Form */}
          <div className="space-y-6 bg-card border border-border-soft p-6 rounded-2xl shadow-inner ring-2 ring-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.06)]">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step===1 ? 'bg-indigo-500 text-white' : 'bg-surface text-text-main'}`}>1</div>
              <div>
                <div className="text-sm font-semibold">Recipient</div>
              </div>
            </div>
            <section>
              <div className="relative">
                <input 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  placeholder="Search by name or email..." 
                  className="w-full bg-surface border border-indigo-500/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-normal" 
                />
                <svg className="w-4 h-4 absolute right-3 top-3.5 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>

              {search.trim() ? (
                <div className="mt-3 max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar styled-scrollbar">
                  {users.map((u) => {
                    const selected = nominees.some((n) => (typeof n === 'string' ? n === u.id : n.id === u.id))
                    return (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => {
                          setNominees((prev) => {
                            const already = prev.some((n) => (typeof n === 'string' ? n === u.id : n.id === u.id))
                            if (already) return prev.filter((n) => (typeof n === 'string' ? n !== u.id : n.id !== u.id))
                            return prev.concat({ id: u.id, name: u.name })
                          })
                          setSearch('')
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all flex items-center gap-3 ${selected ? 'bg-indigo-500 text-white font-bold' : 'bg-surface hover:bg-indigo-500/10 border border-indigo-500/10'}`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${selected ? 'bg-white/20' : 'bg-indigo-500/20 text-indigo-500'}`}>
                          {u.name.charAt(0)}
                        </div>
                        {u.name}
                      </button>
                    )
                  })}
                  {!users.length && <div className="text-xs opacity-40 italic py-2">No teammates found</div>}
                </div>
              ) : null}
            </section>

            {/* Selected recipients */}
            {nominees.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {nominees.map((n) => {
                  const id = typeof n === 'string' ? n : n.id
                  const name = typeof n === 'string' ? (users.find((x) => x.id === n)?.name || n) : n.name
                  return (
                    <div key={id} className="px-3 py-1 rounded-full bg-indigo-500/10 flex items-center gap-2 text-sm">
                      <span>{name}</span>
                      <button type="button" onClick={() => setNominees((s) => s.filter((x) => (typeof x === 'string' ? x !== id : x.id !== id)))} className="text-xs text-rose-400">✕</button>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              {!openedAsECard && (
                <>
                  <section>
                    <div className="text-[15px] font-normal tracking-tight text-white mb-3">Recognition Type</div>
                    <div className="flex bg-surface border border-indigo-500/10 p-1.5 rounded-2xl shadow-sm border border-border-soft">
                      {CATEGORIES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCategory(c)}
                          className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-normal transition-all ${
                            category === c 
                            ? 'btn-accent text-white shadow-lg shadow-indigo-500/20' 
                            : 'text-text-main opacity-60 hover:opacity-100 hover:bg-white/5'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <div className="text-[15px] font-normal tracking-tight text-white mb-3">Points</div>
                    <input 
                      type="number" 
                      value={points} 
                      onChange={(e) => setPoints(Number(e.target.value))} 
                      className="w-full bg-surface border border-indigo-500/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-normal text-indigo-500" 
                      min={1} 
                    />
                  </section>
                </>
              )}
            </div>

            <section>
              <div className="text-[15px] font-normal tracking-tight text-white mb-3">Area of Focus</div>
              <select value={areaOfFocus} onChange={(e) => setAreaOfFocus(e.target.value)} className="w-full bg-surface border border-indigo-500/20 rounded-xl p-3 text-sm">
                <option value="">-- Select area --</option>
                <option value="Collaboration">Collaboration</option>
                <option value="Innovation">Innovation</option>
                <option value="Customer Focus">Customer Focus</option>
                <option value="Execution">Execution</option>
                <option value="Leadership">Leadership</option>
              </select>
            </section>

            <section>
              <div className="text-[15px] font-normal tracking-tight text-white mb-3">Message</div>
              <textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                className="w-full bg-surface border border-indigo-500/20 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-h-[120px] font-normal placeholder:opacity-30" 
                placeholder="Why does this person deserve recognition?" 
              />
              <div className="mt-2 flex items-center gap-2">
                <button type="button" onClick={handleCoach} disabled={coachLoading || !message} className="px-3 py-2 rounded-xl bg-indigo-500/10 text-sm hover:bg-indigo-500/15">{coachLoading ? 'Improving…' : 'Improve your message'}</button>
                {coachTips?.improved_message && (
                  <button type="button" onClick={() => setMessage(coachTips.improved_message)} className="text-sm text-emerald-400">Apply suggestion</button>
                )}
              </div>
              {coachTips && (
                <div className="mt-3 p-3 bg-surface border border-border-soft rounded-lg text-sm">
                  <div className="font-semibold text-white mb-1">Recognition Coach</div>
                  <div className="text-text-main/80 text-sm">Example: Give one specific action the person took.</div>
                  <div className="text-text-main/80 text-sm">Impact: State the outcome and who benefited.</div>
                  <div className="text-text-main/80 text-sm">Timing: Note when or which project it occurred.</div>
                </div>
              )}
            </section>

            

            {/* left column remains for recipient, message, attachments etc. */}
          </div>

          {/* Middle column: Design chooser + preview */}
          <div className="space-y-6 bg-card border border-border-soft p-6 rounded-2xl shadow-inner ring-2 ring-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.06)]">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step===2 ? 'bg-indigo-500 text-white' : 'bg-surface text-text-main'}`}>2</div>
              <div>
                <div className="text-sm font-semibold">Design E-Card</div>
              </div>
            </div>
            <div>
              { (category === 'E-Card' || openedAsECard) ? (
                <>
                  <select value={design} onChange={(e) => setDesign(e.target.value)} className="w-full bg-surface border border-indigo-500/20 rounded-xl p-3 text-sm">
                    <option>Classic</option>
                    <option>Modern</option>
                    <option>Fun</option>
                  </select>
                  <div className="mt-3 p-4 bg-surface border border-border-soft rounded-xl">
                    <div id="ecard-preview" dangerouslySetInnerHTML={{ __html: ecardHtml }} />
                  </div>
                </>
              ) : (
                <div className="text-sm opacity-50">Designs available when E-Card is selected</div>
              ) }
            </div>

          </div>

          {/* Right column: Summary, steps and review */}
          <div className="flex flex-col gap-6">
            {/* Stepper + Review area */}
            <div className="space-y-6 bg-card border border-border-soft p-6 rounded-2xl shadow-inner ring-2 ring-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.06)]">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step===3 ? 'bg-emerald-500 text-white' : 'bg-surface text-text-main'}`}>3</div>
                <div>
                  <div className="text-sm font-semibold">Review & Send</div>
                </div>
              </div>
              {/* Top stepper shows the flow; right-column step list removed to avoid duplication */}

              <div className="pt-4 border-t border-border-soft">
                {step === 2 && (
                  <div>
                    <div className="text-sm mb-2">Design: {design}</div>
                    <div className="p-3 bg-surface border border-border-soft rounded-md">
                      <div dangerouslySetInnerHTML={{ __html: ecardHtml }} />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <div className="text-sm font-semibold mb-2">Review</div>
                    <div className="text-sm">Category: {category}</div>
                    <div className="text-sm">Area of Focus: {areaOfFocus || '—'}</div>
                    <div className="mt-3 p-3 bg-indigo-500/5 rounded-md border border-indigo-500/5">
                      <div className="font-semibold">Message</div>
                      <div className="text-sm italic">{message || '—'}</div>
                    </div>
                    <div className="mt-3">
                      <div className="font-semibold">E-Card Preview</div>
                      <div className="mt-2 p-3 bg-surface border border-border-soft rounded-md">
                        <div dangerouslySetInnerHTML={{ __html: ecardHtml }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* navigation moved to top controls */}
            </div>
            {/* middle column: Design chooser + preview (shows when E-Card selected or opened as E-Card) */}
          
            <div className="flex-1 space-y-6 bg-card border border-border-soft p-6 rounded-2xl shadow-inner">
              <div className="text-[15px] font-normal tracking-tight text-white border-b border-border-soft pb-3">Preview Recognition</div>

              <div className="space-y-4">
                <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/5 min-h-[100px]">
                  <span className="text-[15px] font-normal text-white block mb-2">Message Preview</span>
                  <p className="text-sm text-text-main/80 font-normal italic leading-relaxed">
                    {message ? message : 'Write a message to see it previewed here...'}
                  </p>
                </div>
              </div>

              {!openedAsECard && (
                <section className="pt-4 border-t border-border-soft">
                  <div className="text-[11px] font-normal text-text-main/30 mb-4">Schedule (Optional)</div>
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="date" 
                      value={scheduledDate} 
                      onChange={(e) => setScheduledDate(e.target.value)} 
                      className="bg-surface border border-border-soft rounded-xl p-3 text-[13px] font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all cursor-pointer text-text-main" 
                    />
                    <input 
                      type="time" 
                      value={scheduledTime} 
                      onChange={(e) => setScheduledTime(e.target.value)} 
                      className="bg-surface border border-border-soft rounded-xl p-3 text-[13px] font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all cursor-pointer text-text-main" 
                    />
                  </div>
                </section>
              )}
            </div>

            {/* bottom cancel removed per design — top Cancel remains in header */}
          </div>
        </div>
      </form>
    </Modal>
  )
}
