import React from 'react'

const ECard = ({ data }) => {
  const sender = data?.sender_name || data?.sender || 'Your team'
  const receiver = data?.receiver_name || data?.recipient || 'Recipient'

  return (
    <article role="article" className="w-full max-w-xs transition-all hover:scale-[1.02] hover:-translate-y-1">
      <div className="rounded-lg bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 p-[1px] h-full shadow-lg shadow-indigo-900/40">
        <div className="card-base p-5 flex flex-col gap-3 h-full !bg-indigo-900/30 backdrop-blur-md">
          <div className="flex items-center justify-center">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-400 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-indigo-500/20 ring-4 ring-white/10 uppercase">
              💌
            </div>
          </div>

          <div className="text-center mt-2">
            <p className="text-[15px] text-white truncate font-normal leading-tight">
              <span className="font-bold">Electronic Card</span>
            </p>
            <p className="text-[12px] text-white/50 uppercase tracking-widest font-black mt-1">From</p>
            <p className="text-[15px] text-white truncate font-bold mt-1">{sender}</p>
            <p className="text-[12px] text-white/50 uppercase tracking-widest font-black mt-1">To</p>
            <p className="text-[15px] text-white truncate font-bold mt-1">{receiver}</p>
          </div>

          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="px-2.5 py-1 bg-white/10 text-white text-[10px] rounded-full font-black uppercase inline-flex items-center gap-1.5 border border-white/20">
              <span>💡</span>
              <span className="leading-none truncate max-w-[80px]">{data?.badge_name || data?.value_tag || 'E-Card'}</span>
            </span>

            <span className="bg-white text-indigo-900 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight shadow-sm-md">
              +{data?.points ?? 0} Points
            </span>
          </div>

          <div className="mt-4 relative">
            <span className="absolute -top-3 -left-2 text-3xl text-white/10 italic">"</span>
            <p className="text-sm text-white/90 italic text-center line-clamp-3 font-normal leading-relaxed px-2">
              {data?.message || 'Thank you for your incredible support!'}
            </p>
            <span className="absolute -bottom-4 -right-2 text-3xl text-white/10 italic">"</span>
          </div>

          <div className="mt-auto pt-6 flex justify-between items-center border-t border-white/5">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full border border-indigo-900/30 bg-white/10 flex items-center justify-center text-[10px] shadow-sm-sm ring-1 ring-white/5">👍</div>
              <div className="w-6 h-6 rounded-full border border-indigo-900/30 bg-white/10 flex items-center justify-center text-[10px] shadow-sm-sm ring-1 ring-white/5">❤️</div>
            </div>
            <span className="text-[10px] opacity-40 text-white font-bold uppercase tracking-widest">{data?.time_ago || 'recent'}</span>
          </div>
        </div>
      </div>
    </article>
  )
}

export default ECard
