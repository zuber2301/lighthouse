import React from 'react'

const GroupAwardCard = ({ data }) => {
  return (
    <article role="article" className="w-full max-w-xs transition-all hover:scale-[1.02] hover:-translate-y-1">
      <div className="rounded-lg bg-gradient-to-r from-teal-600 via-teal-500 to-teal-400 p-[1px] h-full shadow-lg shadow-teal-600/10">
        <div className="card-base p-5 flex flex-col gap-3 h-full">
          <div className="flex items-center justify-center">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-teal-500 to-teal-400 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-teal-500/20 uppercase ring-4 ring-teal-500/10">
              {data.sender_avatar || '👥'}
            </div>
          </div>

          <div className="text-center mt-2">
            <p className="text-[15px] text-text-main truncate font-normal leading-tight">
              <span className="font-bold">{data.sender_name}</span>
            </p>
            <p className="text-[11px] text-teal-600/60 uppercase tracking-widest font-black mt-1">Congratulated</p>
            <p className="text-[15px] text-text-main truncate font-bold mt-1">
              {data.receiver_name}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="px-3 py-1 bg-teal-500/10 text-teal-700 text-[10px] rounded-full font-black uppercase inline-flex items-center gap-1.5 border border-teal-500/10">
              <span>🤝</span>
              <span className="leading-none truncate max-w-[80px]">Group Award</span>
            </span>

            <span className="text-teal-600 text-[11px] font-black uppercase tracking-tight">+{data.points} Points</span>
          </div>

          <p className="mt-4 text-sm text-text-main opacity-70 italic text-center line-clamp-3 font-normal leading-relaxed px-2 border-l border-teal-500/20 ml-2">
            "{data.message || 'Well done team!'}"
          </p>

          <div className="mt-auto pt-4 flex justify-between items-center border-t border-border-soft">
            <div className="flex -space-x-1">
               <div className="w-6 h-6 rounded-full border border-card bg-teal-100 flex items-center justify-center text-[10px] shadow-sm-sm">🔥</div>
               <div className="w-6 h-6 rounded-full border border-card bg-teal-50 flex items-center justify-center text-[10px] shadow-sm-sm">🎉</div>
            </div>
            <span className="text-[10px] opacity-40 text-text-main font-bold uppercase tracking-widest">{data.time_ago || 'just now'}</span>
          </div>
        </div>
      </div>
    </article>
  )
}

export default GroupAwardCard
