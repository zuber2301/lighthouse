import React from 'react'

const formatShortDate = (value) => {
  const parts = value.split('-')
  return parts[1] ? `${parts[1]}-${parts[2]}` : value
}

export default function BudgetBurnChart({ series, loading }) {
  if (loading) {
    return <p className="text-sm text-text-muted">Loading budget burn rate…</p>
  }

  if (!series || series.length === 0) {
    return <p className="text-sm text-text-muted">Budget burn data is not available yet.</p>
  }

  const maxBurn = Math.max(...series.map((point) => point.points_spent || 0), 1)

  return (
    <div className="h-36 w-full flex items-end gap-2">
      {series.map((point) => (
        <div key={point.date} className="flex-1 flex flex-col-reverse items-center gap-2">
          <span className="text-[9px] text-text-main/60">{point.points_spent?.toLocaleString() ?? 0}</span>
          <div className="w-full bg-surface-muted rounded-full overflow-hidden" style={{ height: '90%' }}>
            <div
              className="h-full bg-gradient-to-t from-rose-500 via-rose-400 to-rose-300"
              style={{ height: `${(point.points_spent || 0) / maxBurn * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-text-main/60">{formatShortDate(point.date)}</span>
        </div>
      ))}
    </div>
  )
}
