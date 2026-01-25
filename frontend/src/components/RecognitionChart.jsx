import React from 'react'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

export default function RecognitionChart({ timeSeries, loading }) {
  if (loading) {
    return <div className="text-sm text-text-muted">Loading recognition history…</div>
  }

  if (!timeSeries?.labels?.length) {
    return <div className="text-sm text-text-muted">Recognition timeline data is not available yet.</div>
  }

  const values = timeSeries.recognitions ?? []
  const maxValue = Math.max(...values, 1)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-text-muted">
        <span>Recognition History</span>
        <span>Last {values.length} days</span>
      </div>
      <div className="flex gap-1">
        {values.map((count, index) => {
          const height = clamp((count / maxValue) * 100, 10, 100)
          return (
            <div key={index} className="flex-1 rounded-full bg-gradient-to-t from-tm-teal to-tm-teal-2" style={{ height: `${height}%` }} />
          )
        })}
      </div>
      <div className="text-xs text-text-muted flex justify-between">
        {timeSeries.labels.slice(-5).map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  )
}
