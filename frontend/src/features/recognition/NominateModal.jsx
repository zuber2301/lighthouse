import React, { useState, useEffect, useRef } from 'react'
import Modal from '../../components/Modal'
import api from '../../api/axiosClient'
const CATEGORIES = ['Core Values', 'Small Wins', 'Innovation', 'Customer Impact']

export default function NominateModal({ open, onClose, onSubmit }) {
  // Recipient
  const [search, setSearch] = useState('')
  const [nominee, setNominee] = useState(null)
  const [users, setUsers] = useState([])
  const searchTimer = useRef()

  // Category
  const [category, setCategory] = useState(CATEGORIES[0])
  const [points, setPoints] = useState(50)

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
    <Modal open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-lg font-semibold">Nominate a Peer</h2>

        <div className="text-sm opacity-70 text-text-main">All sections are shown below — fill any fields and submit.</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Left column: Recipient, Category, Design */}
            <section>
              <div className="text-sm opacity-70 text-text-main">Select Recipient</div>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teammates..." className="mt-1 w-full bg-card border border-indigo-500/10 rounded-md p-2" />
              {search.trim() ? (
                users.length ? (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {users.map((u) => (
                      <button type="button" key={u.id} onClick={() => setNominee(u.id)} className={`text-left p-2 rounded-md ${nominee === u.id ? 'ring-2 ring-primary bg-card border border-indigo-500/10' : 'bg-card border border-indigo-500/10'}`}>
                        {u.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-slate-500">No matches</div>
                )
              ) : (
                <div className="mt-2 text-sm text-slate-500">Type to search teammates...</div>
              )}
              {nominee && <div className="text-sm text-text-main opacity-80 mt-1">Selected: {users.find((x)=>x.id===nominee)?.name || nominee}</div>}
            </section>

            <section>
              <div className="text-sm opacity-70 text-text-main">Select Area of Focus</div>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full bg-card border border-indigo-500/10 rounded-md p-2">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-card border border-indigo-500/10">{c}</option>
                ))}
              </select>
              <label className="block mt-3">
                <div className="text-sm opacity-70 text-text-main">Points</div>
                <input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} className="mt-1 w-full bg-card border border-indigo-500/10 rounded-md p-2" min={1} />
              </label>
            </section>

            <section>
              <div className="text-sm opacity-70 text-text-main">Design Message</div>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1 w-full bg-card border border-indigo-500/10 rounded-md p-3 min-h-[150px]" rows={6} placeholder="Write a message..." />

              <div className="mt-3">
                <div className="text-sm opacity-70 text-text-main">Add images or videos</div>
                <input type="file" accept="image/*,video/*" multiple onChange={handleFileChange} className="mt-1" />
                <div className="flex gap-2 mt-2">
                  {attachments.map((a, i) => (
                    <div key={i} className="relative w-24 h-16 bg-card border border-indigo-500/10 rounded-md overflow-hidden">
                      {a.type && a.type.startsWith('image/') ? (
                        // eslint-disable-next-line jsx-a11y/img-redundant-alt
                        <img src={a.preview} alt={a.name} className="w-full h-full object-cover" />
                      ) : (
                        <video src={a.preview} className="w-full h-full object-cover" />
                      )}
                      <button type="button" onClick={() => removeAttachment(i)} className="absolute top-1 right-1 text-xs bg-black/50 rounded-full px-1">x</button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            </div>

            <div className="space-y-4 flex flex-col">
              {/* Right column: Review & Schedule */}
              <section>
                <div className="text-sm opacity-70 text-text-main">Review & Schedule</div>
                <div className="bg-card border border-indigo-500/10 p-3 rounded-md mt-2 min-h-[150px]">
                  <div className="text-sm text-text-main opacity-80">Recipient: <span className="font-medium">{users.find((x)=>x.id===nominee)?.name || '—'}</span></div>
                  <div className="text-sm text-text-main opacity-80">Category: <span className="font-medium">{category}</span></div>
                  <div className="mt-2 text-sm text-text-main opacity-80">Message:</div>
                  <div className="mt-1 p-2 bg-card border border-indigo-500/10 rounded-md">
                    {message ? <pre className="whitespace-pre-wrap">{message}</pre> : <i>No message provided</i>}
                  </div>
                  <div className="mt-2 text-sm text-text-main opacity-80">Attachments:</div>
                  <ul className="mt-1 list-disc list-inside text-sm text-text-main opacity-80">
                    {attachments.length === 0 ? <li>None</li> : attachments.map((a, i) => <li key={i}>{a.name}</li>)}
                  </ul>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="bg-card border border-indigo-500/10 rounded-md p-2" />
                    <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="bg-card border border-indigo-500/10 rounded-md p-2" />
                  </div>
                </div>
              </section>

              <div className="mt-4 mb-2 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-1.5 rounded-full bg-surface text-text-main font-bold hover:bg-card border border-border-soft transition-all">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-full btn-recognition text-xs font-bold transition-all shadow-lg">Submit Recognition</button>
              </div>
            </div>
        </div>

        {/* Buttons moved to the right column; duplicate bottom buttons removed */}
      </form>
    </Modal>
  )
}
