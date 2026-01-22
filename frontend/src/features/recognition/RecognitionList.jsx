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
        <tbody className="divide-y divide-slate-800">
          {items.map((it, idx) => (
            <tr key={idx} className="align-top">
              <td className="py-3">
                <div className="font-semibold">{it.nominee}</div>
                <div className="text-xs opacity-70 text-text-main">by {it.actor}</div>
              </td>
              <td className="py-3 font-semibold">+{it.points}</td>
              <td className="py-3 opacity-70 text-text-main">{it.tag}</td>
              <td className="py-3"><span className="text-sm text-slate-200">{it.status ?? 'Approved'}</span></td>
              <td className="py-3 opacity-70 text-text-main">{it.when}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 
