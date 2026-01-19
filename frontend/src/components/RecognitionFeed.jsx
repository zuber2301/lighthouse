import React from 'react'

const RecognitionCard = ({ data }) => (
  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-800 shadow-sm mb-4">
    <div className="flex items-start gap-4">
      <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-xl">
        {data.sender_avatar}
      </div>
      <div className="flex-1">
        <p className="text-sm">
          <span className="font-bold">{data.sender_name}</span> recognized <span className="font-bold">{data.receiver_name}</span>
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold uppercase">
             🏆 {data.badge_name}
          </span>
          <span className="text-emerald-600 font-bold">+{data.points} Points</span>
        </div>
        <p className="mt-3 text-slate-600 dark:text-slate-400 italic">"{data.message}"</p>
      </div>
      <div className="text-xs text-slate-400">{data.time_ago}</div>
    </div>
  </div>
)

export const RecognitionFeed = ({ items = [] }) => {
  if (!items.length) {
    return <div className="text-center text-slate-500 py-8">No recognitions yet</div>
  }

  return (
    <div>
      {items.map((it) => (
        <RecognitionCard key={it.id} data={it} />
      ))}
    </div>
  )
}

export default RecognitionFeed
