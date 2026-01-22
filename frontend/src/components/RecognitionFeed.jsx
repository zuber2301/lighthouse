import React from 'react'

const RecognitionCard = ({ data }) => (
  <article role="article" className="w-full max-w-xs">
    <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-400 p-[1px] h-full shadow-lg shadow-indigo-600/10">
      <div className="card-base p-4 flex flex-col gap-3 h-full">
        <div className="flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-teal-400 text-accent-contrast flex items-center justify-center text-lg font-bold shadow-md shadow-indigo-500/20">
            {data.sender_avatar}
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-text-main truncate">
            <span className="font-bold">{data.sender_name}</span>
            <span className="opacity-50 mx-1">recognized</span>
            <span className="font-bold">{data.receiver_name}</span>
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 text-[10px] rounded font-black uppercase inline-flex items-center gap-1 border border-indigo-500/10">
            <span>🏆</span>
            <span className="leading-none truncate">{data.badge_name}</span>
          </span>

          <span className="text-emerald-500 text-[10px] font-black uppercase tracking-tight">+{data.points} Points</span>
        </div>

        <p className="mt-2 text-sm text-text-main opacity-70 italic text-center line-clamp-3 font-medium leading-relaxed">"{data.message}"</p>

        <div className="mt-auto flex justify-between items-center">
          <div className="flex -space-x-1">
             <div className="w-5 h-5 rounded-full border border-card bg-indigo-100 flex items-center justify-center text-[8px]">👍</div>
             <div className="w-5 h-5 rounded-full border border-card bg-rose-100 flex items-center justify-center text-[8px]">❤️</div>
          </div>
          <span className="text-[10px] opacity-40 text-text-main font-bold uppercase tracking-widest">{data.time_ago}</span>
        </div>
      </div>
    </div>
  </article>
)

export const RecognitionFeed = ({ items = [] }) => {
  if (!items.length) {
    return (
      <div className="text-center py-20 flex flex-col items-center justify-center bg-card/50 rounded-3xl border border-dashed border-indigo-500/10 transition-colors duration-300">
        <div className="w-16 h-16 rounded-full bg-indigo-500/5 flex items-center justify-center text-3xl mb-4">✨</div>
        <p className="text-text-main font-bold opacity-30 uppercase tracking-widest text-xs">No recognitions yet</p>
        <p className="text-text-main opacity-20 text-[10px] mt-1">Be the first to appreciate someone's work!</p>
      </div>
    )
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
