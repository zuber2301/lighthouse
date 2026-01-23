import React, { useState, useEffect, useRef } from 'react'
import Modal from '../../components/Modal'
import api from '../../api/axiosClient'
const CATEGORIES = ['Individual award', 'Group award', 'E-Card']

export default function NominateModal({ open, onClose, onSubmit, initialCategory }) {
  // Recipient
  const [search, setSearch] = useState('')
  const [nominee, setNominee] = useState(null)
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

  // Schedule
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  function resetAll() {
    setSearch('')
    setNominee(null)
    setCategory(CATEGORIES[0])
    setMessage('')
    setAttachments([])
    setScheduledDate('')
    setScheduledTime('')
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

  function handleSubmit(e) {
    e.preventDefault()
    if (!nominee) return
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
      nominee_id: nominee,
      points: Number(points),
      value_tag: category,
      message: fullMessage || undefined,
      is_public: true,
    }
    onSubmit(payload)
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
    <Modal open={open} onClose={onClose} className="max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-3xl font-normal text-text-main tracking-tight">Nominate a Peer</h2>
          <div className="text-[13px] font-normal tracking-[0.08em] opacity-40 text-text-main mt-1">Reward excellence across your organization</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Left column: Entry Form */}
          <div className="space-y-6 bg-indigo-500/5 p-6 rounded-2xl border border-indigo-500/10">
            <section>
              <div className="text-[15px] font-normal tracking-tight text-white mb-3">Recipient</div>
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
                <div className="mt-3 max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {users.map((u) => (
                    <button 
                      type="button" 
                      key={u.id} 
                      onClick={() => { setNominee(u.id); setSearch(u.name); }} 
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all flex items-center gap-3 ${nominee === u.id ? 'bg-indigo-500 text-white font-bold' : 'bg-surface hover:bg-indigo-500/10 border border-indigo-500/10'}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${nominee === u.id ? 'bg-white/20' : 'bg-indigo-500/20 text-indigo-500'}`}>
                        {u.name.charAt(0)}
                      </div>
                      {u.name}
                    </button>
                  ))}
                  {!users.length && <div className="text-xs opacity-40 italic py-2">No teammates found</div>}
                </div>
              ) : null}
            </section>

            <div className="grid grid-cols-1 gap-6">
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
            </div>

            <section>
              <div className="text-[15px] font-normal tracking-tight text-white mb-3">Message</div>
              <textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                className="w-full bg-surface border border-indigo-500/20 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-h-[120px] font-normal placeholder:opacity-30" 
                placeholder="Why does this person deserve recognition?" 
              />
            </section>

            <section>
              <div className="text-[15px] font-normal tracking-tight text-white mb-3">Attachments</div>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl cursor-pointer transition-all active:scale-95 group">
                  <span className="text-lg group-hover:rotate-12 transition-transform">📁</span>
                  <span className="text-[12px] font-normal text-indigo-300">Upload Media</span>
                  <input type="file" accept="image/*,video/*" multiple onChange={handleFileChange} className="hidden" />
                </label>
                
                {attachments.map((a, i) => (
                  <div key={i} className="relative w-14 h-14 bg-surface border border-indigo-500/20 rounded-xl overflow-hidden group">
                    {a.type && a.type.startsWith('image/') ? (
                      <img src={a.preview} alt={a.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-indigo-500/10 flex items-center justify-center text-[8px] font-bold">VID</div>
                    )}
                    <button type="button" onClick={() => removeAttachment(i)} className="absolute inset-0 bg-rose-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity rounded-xl">✕</button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right column: Summary & Schedule */}
          <div className="flex flex-col gap-6">
            <div className="flex-1 space-y-6 bg-card border border-border-soft p-6 rounded-2xl shadow-inner">
              <div className="text-[15px] font-normal tracking-tight text-white border-b border-border-soft pb-3">Preview Recognition</div>
              
              <div className="space-y-4">
                  <div className="flex justify-between items-center bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/5">
                    <span className="text-[16px] font-normal text-white">Recipient</span>
                    <span className="text-sm font-normal text-indigo-500">{users.find((x)=>x.id===nominee)?.name || 'None selected'}</span>
                  </div>
                
                  <div className="flex justify-between items-center bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/5">
                    <span className="text-[16px] font-normal text-white">Category</span>
                    <span className="text-sm font-normal text-emerald-500">{category}</span>
                  </div>

                <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/5 min-h-[100px]">
                  <span className="text-[15px] font-normal text-white block mb-2">Message Preview</span>
                  <p className="text-sm text-text-main/80 font-normal italic leading-relaxed">
                    {message ? message : 'Write a message to see it previewed here...'}
                  </p>
                </div>
              </div>

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
            </div>

            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 py-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-text-main text-[13px] font-normal hover:bg-slate-500/5 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={!nominee} 
                className="flex-[2] py-4 rounded-2xl btn-accent text-white font-normal text-[13px] shadow-xl shadow-indigo-600/20 disabled:opacity-30 disabled:grayscale transition-all active:scale-95"
              >
                Submit Recognition
              </button>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}
