import React from 'react'

export default function DepartmentHeatmap({ heatmap, loading }) {
  if (loading) {
    return <p className="text-sm text-text-muted">Loading activity heatmap…</p>
  }

  if (!heatmap || heatmap.length === 0) {
    return <p className="text-sm text-text-muted">No departmental activity has been recorded yet.</p>
  }

  const maxScore = Math.max(...heatmap.map((item) => item.activity_score || 0), 1)

  return (
    <div className="space-y-4">
      {heatmap.map((item) => (
        <div key={item.department} className="space-y-1">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-text-main/70">
            <span>{item.department}</span>
            <span>{item.activity_score?.toLocaleString() ?? 0}</span>
          </div>
          <div className="h-2 rounded-full bg-surface-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-tm-teal to-tm-teal-2 transition-all duration-200"
              style={{ width: `${Math.min((item.activity_score || 0) / maxScore, 1) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
