import React from 'react'

const RecognitionCard = ({ data }) => (
  <article role="article" className="w-full max-w-xs">
    <div className="rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-teal-400 p-[1px] h-full">
      <div className="bg-card/80 dark:bg-card/90 rounded-xl p-4 flex flex-col gap-3 h-full">
        <div className="flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-600 to-teal-400 text-white flex items-center justify-center text-base font-semibold">
            {data.sender_avatar}
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-slate-100 truncate">
            <span className="font-semibold">{data.sender_name}</span>
            <span className="text-slate-400"> {' '} recognized {' '}</span>
            <span className="font-semibold">{data.receiver_name}</span>
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <span className="px-2 py-0.5 bg-gradient-to-r from-indigo-800/25 to-teal-700/10 text-indigo-100 text-xs rounded font-bold uppercase inline-flex items-center gap-1">
            <span>🏆</span>
            <span className="leading-none truncate">{data.badge_name}</span>
          </span>

          <span className="text-emerald-300 text-sm font-semibold">+{data.points} Points</span>
        </div>

        <p className="mt-2 text-sm text-slate-300 italic text-center line-clamp-3">"{data.message}"</p>

        <div className="mt-auto text-right">
          <span className="text-xs text-slate-400">{data.time_ago}</span>
        </div>
      </div>
    </div>
  </article>
)

export const RecognitionFeed = ({ items = [] }) => {
  if (!items.length) {
    return <div className="text-center text-slate-500 py-8">No recognitions yet</div>
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {items.map((it) => (
          <RecognitionCard key={it.id} data={it} />
        ))}
      </div>
    </div>
  )
}

export default RecognitionFeed
