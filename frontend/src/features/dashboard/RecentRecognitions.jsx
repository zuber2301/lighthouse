import React from 'react'

const SAMPLE = [
  { actor: 'Alice', nominee: 'Bob', points: 50, tag: 'Teamwork', when: '2h ago' },
  { actor: 'Manager', nominee: 'Charlie', points: 100, tag: 'Innovation', when: '1d ago' },
  { actor: 'DevOps', nominee: 'Dana', points: 25, tag: 'Support', when: '2d ago' },
]

export default function RecentRecognitions() {
  return (
    <ul className="divide-y divide-slate-800">
      {SAMPLE.map((s, i) => (
        <li key={i} className="py-3 flex items-center justify-between">
          <div>
            <div className="text-sm">
              <span className="font-semibold">{s.actor}</span> recognized <span className="font-semibold">{s.nominee}</span>
            </div>
            <div className="text-xs text-slate-400">{s.tag} • {s.when}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold">+{s.points}</div>
          </div>
        </li>
      ))}
    </ul>
  )
}
