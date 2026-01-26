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
    <ul className="divide-y divide-slate-800">
      {items.map((s, i) => (
        <li key={i} className="py-3 flex items-center justify-between">
          <div>
            <div className="text-sm">
              <span className="font-semibold">{s.nominator_name}</span> recognized <span className="font-semibold">{s.nominee_name}</span>
            </div>
            <div className="text-xs opacity-70 text-text-main">
              {s.value_tag || s.award_category || 'General'} • {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'recently'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold">{s.points > 0 ? `+${s.points}` : 'E-Card'}</div>
          </div>
        </li>
      ))}
    </ul>
  )
}
