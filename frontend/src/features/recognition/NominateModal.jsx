import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import Modal from '../../components/Modal'
import api from '../../api/axiosClient'
// E-Card Designer removed; use simple design choices instead
const CATEGORIES = ['Individual Award', 'Group Award', 'E-Card']

export default function NominateModal({ open, onClose, onSubmit, initialCategory }) {
  const [searchParams, setSearchParams] = useSearchParams()
  // Recipient (support multiple)
  const [search, setSearch] = useState('')
  const [nominees, setNominees] = useState([])
  const [users, setUsers] = useState([])
  const searchTimer = useRef()
  const middleRef = useRef(null)
  const designWrapperRef = useRef(null)
  const [designOpen, setDesignOpen] = useState(false)
  const awardWrapperRef = useRef(null)
  const [awardOpen, setAwardOpen] = useState(false)
  const areaWrapperRef = useRef(null)
  const advancingRef = useRef(false)
  

  // Category
  const [category, setCategory] = useState(initialCategory || CATEGORIES[0])

  // Award points mapping and selection
  const AWARD_POINTS = {
    'Gold - Annual Excellence': 5000,
    'Silver - Quarterly Achievements': 2500,
    'Bronze - Monthly Recognition': 1000,
  }

  // Award Type selection (e.g., Gold/Silver/Bronze tiers)
  const [awardType, setAwardType] = useState('Gold - Annual Excellence')

  // Points (auto-populated from award type but editable)
  const [points, setPoints] = useState(AWARD_POINTS['Gold - Annual Excellence'])
  const [pointsManual, setPointsManual] = useState(false)

  // Handle query params for pre-filling (e.g. from Celebration Widget)
  useEffect(() => {
    if (open) {
      const userId = searchParams.get('userId')
      const note = searchParams.get('note')

      if (userId) {
        // Fetch user info to show in the pill
        api.get(`/user/search?id=${userId}`).then(res => {
          const u = res.data?.[0] || { id: userId, name: 'Recipient' }
          setNominees([u])
        })
      }
      if (note) {
        setMessage(note)
      }
      
      // Clear params so they don't persist on next open
      // Use replace:true to not add to history
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('userId')
      newParams.delete('note')
      setSearchParams(newParams, { replace: true })
    }
  }, [open, searchParams, setSearchParams])

  useEffect(() => {
    function handleClickOutside(e) {
      if (designWrapperRef.current && !designWrapperRef.current.contains(e.target)) setDesignOpen(false)
      if (awardWrapperRef.current && !awardWrapperRef.current.contains(e.target)) setAwardOpen(false)
    }
    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  // When awardType changes, if the user hasn't manually edited points, auto-populate the points value
  useEffect(() => {
    if (!pointsManual) {
      setPoints(AWARD_POINTS[awardType] ?? points)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awardType])

  const openedAsECard = initialCategory === 'E-Card'

  // multi-step flow: 1=Recipients, 2=Design, 3=Review & Send
  // simplified flow: 1=Recipients, 2=Design & Review (combined)
  const [step, setStep] = useState(1)
  const [validationError, setValidationError] = useState('')

  // snapshot of values to show in Review & Send (only set when advancing from Design -> Review)
  const [reviewSnapshot, setReviewSnapshot] = useState(null)

  // E-Card design selection (Classic, Modern, Fun). Default: none (no preview shown)
  const [design, setDesign] = useState('')

   // When E-Card category is selected, default design to Classic so a preview is shown
   useEffect(() => {
     if (category === 'E-Card' && !design) {
       setDesign('Classic')
     }
     // do not reset design when leaving E-Card to avoid unexpected UX
   }, [category])

  // Build simple e-card HTML string based on selection + fields
  function buildEcardHtml() {
    const img = attachments.find((a) => (a.type || '').startsWith('image/'))
    const imgSrc = img?.url || img?.preview || ''
    const displayDate = scheduledDate || new Date().toLocaleDateString('en-US')

    // Keep the same overall card dimensions/box but vary visual style strongly per design
      if (design === 'Classic') {
      return `
        <div style="width:100%;box-sizing:border-box;padding:28px;border-radius:14px;background:linear-gradient(135deg,#f8fbff,#eef6ff);color:#241E4C;font-family:Georgia,'Times New Roman',serif;border:1px solid rgba(0,0,0,0.05);">
          <div style="font-size:22px;font-weight:700;margin-bottom:8px;color:#1e1b4b">Congratulations!</div>
          ${imgSrc ? `<div style=\"text-align:center;margin:10px 0\"><img src=\"${imgSrc}\" style=\"max-width:100%;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.1);\"/></div>` : ''}
          <div style="font-size:16px;line-height:1.6;margin-bottom:12px;color:#241E4C;min-height:60px;">${message || '<i>No message provided</i>'}</div>
          <div style="display:flex;justify-content:between;align-items:center;border-top:1px solid rgba(0,0,0,0.05);padding-top:10px;">
            <div style="font-size:13px;opacity:0.8;color:#241E4C">Kind Regards</div>
            <div style="font-size:12px;opacity:0.6;margin-left:auto">${displayDate}</div>
          </div>
        </div>
      `
    }

    if (design === 'Modern') {
      return `
        <div style="width:100%;box-sizing:border-box;padding:30px;border-radius:14px;background:linear-gradient(90deg,#071021 0%,#0b1a2b 100%);color:#e6eef8;font-family:Inter,system-ui,Arial;border:1px solid rgba(255,255,255,0.05);">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
            <div style="width:35px;height:35px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#06b6d4);display:flex;align-items:center;justify-content:center;font-weight:700;color:white;font-size:18px">★</div>
            <div style="font-size:22px;font-weight:700;letter-spacing:-0.02em">Great Work</div>
          </div>
          ${imgSrc ? `<div style=\"margin:14px 0;text-align:center\"><img src=\"${imgSrc}\" style=\"max-width:100%;border-radius:12px;border:1px solid rgba(255,255,255,0.1);\"/></div>` : ''}
          <div style="font-size:15px;line-height:1.6;color:#cfe8ff;margin-bottom:14px">${message || '<i>No message provided</i>'}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#9fb8d9;opacity:0.8">
            <div style="text-transform:uppercase;tracking:0.1em;font-weight:600">Lighthouse Recognition</div>
            <div>${displayDate}</div>
          </div>
        </div>
      `
    }

    // Fun
    return `
      <div style="width:100%;box-sizing:border-box;padding:24px;border-radius:14px;background:linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%);color:#2b2b2b;font-family:'Comic Sans MS', cursive, sans-serif;border:3px solid #fff;box-shadow:0 8px 0 rgba(0,0,0,0.05);">
        <div style="font-size:26px;font-weight:900;margin-bottom:10px;transform:rotate(-1deg);display:inline-block;background:#fff;padding:2px 10px;border-radius:6px;">Woohoo! 🎉</div>
        ${imgSrc ? `<div style=\"text-align:center;margin:15px 0\"><img src=\"${imgSrc}\" style=\"max-width:100%;border-radius:10px;transform:rotate(1deg);border:3px solid white;\"/></div>` : ''}
        <div style="font-size:17px;line-height:1.5;margin:10px 0;font-weight:600">${message || 'You rock!'}</div>
        <div style="margin-top:15px;display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:700;opacity:0.8;">
          <div>High five! 🖐️</div>
          <div>${displayDate}</div>
        </div>
      </div>
    `
  }

  // keep ecardHtml in sync for submission
  useEffect(() => {
    setEcardHtml(buildEcardHtml())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design, message, attachments])

  // close on Escape key
  useEffect(() => {
    function onKey(e) {
      if (!open) return
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // When opening the modal specifically for E-Card, clear any previous E-Card state so each
  // open starts with a fresh, blank form (per UX request).
  const prevOpen = useRef(open)
  useEffect(() => {
    // Detect transitions from closed -> open
    if (!prevOpen.current && open) {
      if (category === 'E-Card') {
        // Clear fields but keep the category intact
        setNominees([])
        setMessage('')
        setAttachments([])
        setEcardHtml('')
        setEcardUrl('')
        // reset design to the default for E-Card so preview appears fresh
        setDesign('Classic')
        setPoints(AWARD_POINTS['Gold - Annual Excellence'])
        setPointsManual(false)
        setAreaOfFocus('')
        setScheduledDate('')
        setScheduledTime('')
        setReviewSnapshot(null)
        setStep(1)
      }
    }
    prevOpen.current = open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category])

  // smooth scroll & focus to middle (Design) column when advancing to step 2
  useEffect(() => {
    if (step !== 2) return
    // small delay to ensure DOM updated
    const t = setTimeout(() => {
      try {
        if (middleRef.current && middleRef.current.scrollIntoView) {
          middleRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // focus first focusable element inside the design column (select/input)
          const el = middleRef.current.querySelector('select, input, textarea, button')
          if (el && el.focus) el.focus({ preventScroll: true })
        }
      } catch (err) {
        // ignore
      }
    }, 80)
    return () => clearTimeout(t)
  }, [step])

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
    // prevent double advances from rapid clicks
    if (advancingRef.current) return
    advancingRef.current = true
    setTimeout(() => { advancingRef.current = false }, 300)

    if (step === 1) {
      setStep(2)
      return
    }

    if (step === 2) {
      // capture snapshot before moving to review
      try {
        const snap = {
          ecardHtml: buildEcardHtml(),
          message: message,
          design,
          points,
          nominees: Array.isArray(nominees) ? JSON.parse(JSON.stringify(nominees)) : nominees,
          areaOfFocus,
          awardType,
          scheduledDate,
          scheduledTime,
          category,
        }
        setReviewSnapshot(snap)
      } catch (err) {
        setReviewSnapshot(null)
      }
      setStep(3)
      return
    }

    // step >= 3: submit
    handleSubmit()
  }

  // Schedule
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  function resetAll() {
    setSearch('')
    setNominees([])
    setCategory(CATEGORIES[0])
    setAwardType('Gold - Annual Excellence')
    setPoints(AWARD_POINTS['Gold - Annual Excellence'])
    setPointsManual(false)
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
      const p = Object.assign({}, payload, { nominee_id: id, area_of_focus: areaOfFocus || undefined, award_type: awardType || undefined })
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

  // Determine theme colors based on category
  const isECard = category === 'E-Card' || openedAsECard;
  const themeColor = isECard ? 'blue' : 'indigo';
  const themeHex = isECard ? '#1d4ed8' : '#6366f1';

  return (
    <Modal open={open} onClose={onClose} className={`max-w-4xl transition-all duration-700 
      ${isECard 
        ? '!bg-gradient-to-br !from-[#241E4C] !via-[#1d4ed8] !to-[#241E4C]' 
        : '!bg-gradient-to-br !from-[#241E4C] !via-[#1e1b4b] !to-[#241E4C]'}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <h2 className={`text-3xl font-normal tracking-tighter ${category === 'Individual Award' ? 'text-white' : `text-${themeColor}-400`} mb-2`}>{openedAsECard ? 'Send a E-Card' : 'Individual Excellence Nomination Form'}</h2>

            <div className="mt-4 relative">
              <button type="button" onClick={onClose} aria-label="Close" className="absolute top-0 right-0 text-white/80 hover:text-white p-2 rounded-md">✕</button>
            </div>
            {validationError && <div className="text-sm text-rose-400 mt-2">{validationError}</div>}
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
          {/* Left column: Entry Form */}
          <div ref={middleRef} className={`space-y-4 bg-black/30 p-3 rounded-lg backdrop-blur-md shadow-2xl`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold ${step===1 ? `bg-${themeColor}-500 text-white shadow-lg shadow-${themeColor}-500/20` : 'bg-white/10 text-white/40'}`}>1</div>
              <div>
                <div className="text-sm font-bold uppercase tracking-widest text-white/70">Recipient</div>
              </div>
            </div>
            <section>
              <div className="relative">
                <input 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  placeholder="Find teammate..." 
                  className={`w-full bg-white/5 border border-white/10 rounded-md p-4 text-sm focus:outline-none focus:ring-2 focus:ring-${themeColor}-500/30 transition-all font-medium placeholder:text-white/20`} 
                />
                <svg className="w-4 h-4 absolute right-4 top-4.5 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/></svg>
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
                        className={`w-full text-left px-4 py-2.5 rounded-md text-sm transition-all flex items-center gap-3 ${selected ? `bg-${themeColor}-500 text-white font-bold` : `bg-surface hover:bg-${themeColor}-500/10 border border-${themeColor}-500/10`}`}
                      >
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] ${selected ? 'bg-white/20' : `bg-${themeColor}-500/20 ${category === 'Individual Award' ? 'text-white' : `text-${themeColor}-500`}`}`}>
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
                    <div key={id} className={`px-3 py-1 rounded-md bg-${themeColor}-500/10 flex items-center gap-2 text-sm ${category === 'Individual Award' ? 'text-white font-bold' : `text-${themeColor}-300 font-bold`}`}>
                      <span>{name}</span>
                      <button type="button" onClick={() => setNominees((s) => s.filter((x) => (typeof x === 'string' ? x !== id : x.id !== id)))} className="text-xs text-rose-400">✕</button>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              {!openedAsECard && (
                <>

                  <section>
                    <div className="text-sm font-normal tracking-tight text-white mb-3">Award Type</div>
                    <div ref={awardWrapperRef} className="relative">
                      <button type="button" onClick={() => setAwardOpen(!awardOpen)} className="w-full text-left bg-black/30 border border-white/10 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 transition-all text-white flex items-center justify-between">
                        <span>{awardType}</span>
                        <span className="ml-3 text-white/70">▾</span>
                      </button>

                      {awardOpen && (
                        <ul className="absolute left-0 right-0 mt-2 z-50 rounded-md overflow-hidden shadow-lg bg-black/40 border border-white/10" role="listbox">
                          {['Gold - Annual Excellence','Silver - Quarterly Achievements','Bronze - Monthly Recognition'].map((opt) => (
                            <li key={opt} role="option" onClick={() => { setAwardType(opt); setAwardOpen(false) }} className={`px-4 py-3 text-sm text-white hover:bg-white/5 cursor-pointer ${awardType === opt ? 'font-bold' : 'font-normal'}`}>{opt}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </section>

                  <section className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-normal tracking-tight text-white">Points</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setPoints(AWARD_POINTS[awardType]); setPointsManual(false); }}
                      title="Use award default points"
                      className={`px-3 py-1 rounded-md text-sm border border-${themeColor}-500/20 bg-${themeColor}-500/10 text-${themeColor}-300 hover:bg-${themeColor}-500/15 transition`}
                    >
                      {AWARD_POINTS[awardType].toLocaleString()}
                    </button>
                  </section>
                </>
              )} 
            </div>

            <section>
              <div className="text-sm font-normal tracking-tight text-white mb-3">Choose Award Category</div>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {['Collaboration','Innovation','Customer Focus','Execution','Leadership'].map((opt) => {
                  const id = `area-${(opt || 'none').replace(/\s+/g, '-').toLowerCase()}`
                  return (
                    <label key={id} htmlFor={id} className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm ${areaOfFocus === opt ? 'bg-white/10 text-white font-semibold' : 'bg-black/30 text-white/70'} cursor-pointer`}>
                      <input
                        id={id}
                        type="radio"
                        name="areaOfFocus"
                        value={opt}
                        checked={areaOfFocus === opt}
                        onChange={() => setAreaOfFocus(opt)}
                        className="accent-indigo-500 w-4 h-4"
                      />
                      <span className="truncate">{opt}</span>
                    </label>
                  )
                })}
              </div>
            </div>
            </section>

            <section>
              <div className="text-[15px] font-normal tracking-tight text-white mb-2">Message</div>
              <textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                className={`w-full bg-surface border border-${themeColor}-500/20 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-${themeColor}-500/30 min-h-[80px] font-normal placeholder:opacity-30`} 
                placeholder="Why does this person deserve recognition?" 
              />
              <div className="mt-2 flex items-center gap-2">
                  <button type="button" onClick={handleCoach} disabled={coachLoading || !message} className={`px-3 py-2 rounded-md bg-${themeColor}-500/10 text-sm hover:bg-${themeColor}-500/15 text-white font-bold`}>{coachLoading ? 'Improving…' : 'Improve your message'}</button> 
                {coachTips?.improved_message && (
                  <button type="button" onClick={() => setMessage(coachTips.improved_message)} className="text-sm text-blue-400">Apply suggestion</button>
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
              
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleTopNext}
                  disabled={step === 1 && nominees.length === 0}
                  className={`w-full px-4 py-2 rounded-md text-white font-bold ${step===1 && nominees.length === 0 ? 'opacity-60 cursor-not-allowed bg-${themeColor}-500/10' : `bg-${themeColor}-600 hover:brightness-105`}`}
                >
                  Next Step
                </button>
              </div>
            </section>

            

            {/* left column remains for recipient, message, attachments etc. */}
          </div>

          {/* Middle column: Design chooser + preview */}
          <div className={`space-y-3 bg-black/30 p-3 rounded-lg backdrop-blur-md shadow-2xl`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold ${(step===2 || step===3) ? `bg-${themeColor}-500 text-white shadow-lg shadow-${themeColor}-500/20` : 'bg-white/10 text-white/40'}`}>2</div>
              <div>
                <div className="text-sm font-bold uppercase tracking-widest text-white/70">{step === 3 ? 'Review & Send' : 'Design E-Card'}</div>
              </div>
            </div>
            <div>
              { (category === 'E-Card' || openedAsECard) ? (
                <>
                  {design ? (
                    <div className={`mt-4 p-3 rounded-md min-h-[80px] ${isECard ? `bg-${themeColor}-500/5 shadow-[inset_0_0_30px_rgba(29,78,216,0.04)]` : 'bg-surface border border-border-soft'} ${step === 3 ? 'ring-2 ring-blue-500/50' : ''}`}>
                      <div id="ecard-preview" dangerouslySetInnerHTML={{ __html: ecardHtml }} />
                    </div>
                  ) : (
                    <div className="mt-4 p-3 rounded-md bg-black/10 border border-white/5 text-sm text-white/60 text-center">No design selected — preview will appear once you choose a design.</div>
                  )}

                  {step < 3 && (
                    <div ref={designWrapperRef} className="relative mt-4">
                      <button
                        type="button"
                        onClick={() => setDesignOpen(!designOpen)}
                        className="w-full text-left bg-black/30 border border-white/10 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 transition-all text-white flex items-center justify-between"
                        aria-haspopup="listbox"
                        aria-expanded={designOpen}
                      >
                        <span>{design || 'None'}</span>
                        <span className="ml-3 text-white/70">▾</span>
                      </button>

                      {designOpen && (
                        <ul className="absolute left-0 right-0 mt-2 z-50 rounded-md overflow-hidden shadow-lg bg-black/40 border border-white/10" role="listbox">
                            {['Classic', 'Modern', 'Fun'].map((opt) => (
                              <li
                                key={opt}
                                role="option"
                                onClick={() => {
                                  setDesign(opt)
                                  setDesignOpen(false)
                                }}
                                className={`px-4 py-3 text-sm text-white hover:bg-white/5 cursor-pointer ${design === opt ? 'font-bold' : 'font-normal'}`}
                              >
                                {opt}
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {(!designOpen && step === 2) && (
                    <div className="mt-4 flex items-center justify-end">
                      <button type="button" onClick={handleTopNext} className={`px-6 py-2 rounded-md text-white font-black ${isECard ? `bg-${themeColor}-600 shadow-${themeColor}-600/20` : 'bg-indigo-600 shadow-indigo-600/20'}`}>
                        Review Order
                      </button>
                    </div>
                  )}

                  {/* Review & Send (moved in from column-3) */}
                  {step === 3 && (
                    <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="pt-4 border-t border-white/10 space-y-4">
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-white/40">
                          <div>Category</div>
                          <div className={`${category === 'Individual Award' ? 'text-white' : `text-${themeColor}-400`}`}>{category}</div>
                        </div>

                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-white/40">
                          <div>Design Style</div>
                          <div className="text-white">{design}</div>
                        </div>

                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-white/40">
                          <div>Recipients</div>
                          <div className="text-white text-right">{nominees.map(n => n.name).join(', ')}</div>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-end gap-3">
                        <button type="button" onClick={() => setStep(2)} className={`px-4 py-2 rounded-md bg-${themeColor}-500/10 text-white hover:bg-${themeColor}-500/20 border border-${themeColor}-500/20 font-bold transition-all`}>
                          Back to Design
                        </button>
                        <button type="submit" className={`px-8 py-2.5 rounded-md text-white font-black text-lg ${isECard ? `bg-${themeColor}-600 shadow-xl shadow-${themeColor}-600/30` : 'bg-indigo-600 shadow-xl shadow-indigo-600/30'} hover:scale-105 transition-transform active:scale-95`}>
                          Send Now
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm opacity-50 flex items-center justify-center h-40 border-2 border-dashed border-white/5 rounded-lg italic">
                  Select E-Card category to unlock designs
                </div>
              ) }
            </div>

          </div>


        </div>
      </form>
    </Modal>
  )
}
