import React from 'react'
import { useRecognitions } from '../../hooks/useRecognitions'

export default function RecentRecognitions() {
  const { items, isLoading } = useRecognitions()

  if (isLoading) {
    return <div className="text-sm opacity-50 p-4">Loading feed...</div>
  }

  if (!items || items.length === 0) {
    return <div className="text-sm opacity-50 p-4">No recent recognitions yet.</div>
  }

  return (
    <ul className="space-y-4">
      {items.map((s, i) => (
        <li key={i} className="bg-slate-800/20 border border-slate-700/30 rounded-xl p-4 transition-all hover:bg-slate-800/40">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
                {s.nominator_name?.[0]}{s.nominator_name?.split(' ')?.[1]?.[0]}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">
                  <span className="text-indigo-400">{s.nominator_name}</span> recognized <span className="text-indigo-400">{s.nominee_name}</span>
                </div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500 mt-0.5 font-bold">
                  {s.value_tag || s.award_category || 'General'} {s.ecard_design && `(${s.ecard_design} E-Card)`} • {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'recently'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-black bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30">
                {s.points > 0 ? `+${s.points} PTS` : 'E-CARD'}
              </div>
            </div>
          </div>
          {s.message && (
            <div className="mt-3 text-sm text-slate-400 italic line-clamp-2 pl-14 border-l-2 border-slate-700/50">
              "{s.message.replace(/<[^>]*>?/gm, '').slice(0, 100)}..."
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
