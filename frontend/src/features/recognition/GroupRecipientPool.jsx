import React, { useState, useEffect, useRef } from 'react'
import api from '../../api/axiosClient'

// Props:
// - value: [{id, name}] current selection
// - onChange: fn(newSelection)
// - placeholder: optional input placeholder
export default function GroupRecipientPool({ value = [], onChange = () => {}, placeholder = 'Search by name or email...' }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [presetLoading, setPresetLoading] = useState(false)
  const searchTimer = useRef()

  useEffect(() => {
    if (!query.trim()) return setResults([])
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setLoading(true)
      api
        .get('/user/search', { params: { q: query } })
        .then((res) => setResults(res.data || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(searchTimer.current)
  }, [query])

  function isSelected(id) {
    return value.some((u) => u.id === id)
  }

  function addUser(u) {
    if (isSelected(u.id)) return
    const next = value.concat({ id: u.id, name: u.name })
    onChange(next)
  }

  function removeUser(id) {
    onChange(value.filter((u) => u.id !== id))
  }

  async function selectMyTeam() {
    setPresetLoading(true)
    try {
      const res = await api.get('/user/my-team')
      const users = res.data || []
      // merge unique by id
      const merged = [...value]
      users.forEach((u) => {
        if (!merged.some((m) => m.id === u.id)) merged.push({ id: u.id, name: u.name })
      })
      onChange(merged)
    } catch (err) {
      // ignore
    } finally {
      setPresetLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="text-sm font-semibold">Recipients</div>
        <div className="text-xs opacity-50">Selected: <span className="font-medium">{value.length}</span></div>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-surface border border-indigo-500/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
        <button
          type="button"
          onClick={selectMyTeam}
          disabled={presetLoading}
          className="px-3 py-2 rounded-xl bg-indigo-500 text-white text-sm shadow-sm"
        >
          {presetLoading ? 'Adding…' : 'Select My Team'}
        </button>
      </div>

      {query.trim() && (
        <div className="mb-3 max-h-40 overflow-y-auto custom-scrollbar styled-scrollbar">
          {loading ? (
            <div className="text-sm opacity-50">Searching…</div>
          ) : results.length ? (
            results.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => addUser(u)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 flex items-center gap-3 ${isSelected(u.id) ? 'bg-indigo-500 text-white' : 'bg-surface hover:bg-indigo-500/10'}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${isSelected(u.id) ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-500'}`}>{u.name?.charAt(0) || '?'}</div>
                <div className="truncate">{u.name} <span className="text-xs opacity-50 ml-2">{u.email}</span></div>
              </button>
            ))
          ) : (
            <div className="text-sm opacity-50 italic">No teammates found</div>
          )}
        </div>
      )}

      {value.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {value.map((u) => (
            <div key={u.id} className="px-3 py-1 rounded-full bg-indigo-500/10 flex items-center gap-2 text-sm">
              <span className="font-medium">{u.name}</span>
              <button type="button" onClick={() => removeUser(u.id)} className="text-xs text-rose-400">✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs opacity-60">Tip: use "Select My Team" to quickly add your direct reports.</div>
    </div>
  )
}
