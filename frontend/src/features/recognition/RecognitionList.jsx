import React from 'react'

export default function RecognitionList({ items }) {
  return (
    <div className="w-full">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="opacity-70 text-text-main">
            <th className="py-2">Nominee</th>
            <th className="py-2">Points</th>
            <th className="py-2">Tag</th>
            <th className="py-2">Status</th>
            <th className="py-2">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-soft">
          {items.map((it, idx) => (
            <tr key={idx} className="align-top">
              <td className="py-3">
                <div className="font-semibold">{it.nominee}</div>
                <div className="text-xs opacity-70 text-text-main">by {it.actor}</div>
              </td>
              <td className="py-3 font-semibold">+{it.points}</td>
              <td className="py-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  it.value_tag === 'Individual award' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20' :
                  it.value_tag === 'Group award' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                  it.value_tag === 'E-Card' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' :
                  'bg-slate-500/20 text-slate-400 border border-slate-500/20'
                }`}>
                  {it.value_tag || it.tag || 'Award'}
                </span>
              </td>
              <td className="py-3"><span className="text-sm text-text-main/60">{it.status ?? 'Approved'}</span></td>
              <td className="py-3 opacity-70 text-text-main">{it.when}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 
