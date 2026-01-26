import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useHighFive, useApproveRecognition } from '../hooks'
import AwardBadge from './AwardBadge'

function Avatar({ name, url, size = '10' }) {
  const initials = name ? name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase() : 'U'
  const sizeClass = size === '14' ? 'w-14 h-14 text-xl' : 'w-10 h-10 text-sm'
  
  return (
    <div className={`${sizeClass} rounded-full bg-surface border border-tm-indigo/20 flex items-center justify-center overflow-hidden font-normal`}>
      {url ? (
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  )
}

const AchievementCard = ({ data }) => {
  const highFive = useHighFive()
  const approve = useApproveRecognition()

  const nomineeName = data.nominee_name || data.receiver_name || 'Anonymous'
  const nomineeAvatar = data.nominee_avatar || data.receiver_avatar
  const nominatorName = data.nominator_name || data.sender_name || 'Someone'
  const nominatorAvatar = data.nominator_avatar || data.sender_avatar
  const category = data.award_category || (data.points >= 500 ? 'GOLD' : data.points >= 250 ? 'SILVER' : data.points >= 100 ? 'BRONZE' : 'ECARD')
  const date = data.created_at ? new Date(data.created_at) : null

  return (
    <div className="p-5 bg-card border border-indigo-500/10 rounded-xl shadow-tm-neon flex flex-col gap-4 hover:border-indigo-500/30 transition-colors animate-fade-in group">
      
      {/* Header: Nominee and Badge */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={nomineeName} url={nomineeAvatar} />
          <div>
            <div className="text-sm font-semibold">{nomineeName}</div>
            {data.nominee_department && (
              <div className="text-[10px] text-tm-indigo uppercase font-medium">[{data.nominee_department}]</div>
            )}
          </div>
        </div>
        <AwardBadge category={category} />
      </div>

      {/* Message / Achievement */}
      <div className="flex-1 min-h-[60px]">
        <p className="text-sm text-text-main opacity-90 line-clamp-3 italic">
          "{data.message || 'No message provided.'}"
        </p>
      </div>

      {/* Sender Information */}
      <div className="flex items-center gap-2 border-t border-indigo-500/5 pt-3 mt-auto">
          <Avatar name={nominatorName} url={nominatorAvatar} size="10" />
          <div className="text-xs text-text-main opacity-60">
            Recognized by <span className="font-semibold opacity-100">{nominatorName}</span>
          </div>
      </div>

      {/* Footer: Points, Pulse, Date, Actions */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1 text-xs font-black ${category === 'ECARD' ? 'text-slate-500' : 'text-emerald-400'}`}>
            <span className="text-sm">+{data.points}</span> <span>PTS</span>
          </div>
          <button 
            onClick={() => highFive.mutate(data.id)}
            disabled={highFive.isLoading}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-500/5 text-tm-indigo hover:bg-indigo-500/10 transition-colors active:scale-90"
            title="Give a high-five"
          >
            <span className="text-xs group-hover:animate-bounce">🙌</span>
            <span className="text-xs font-bold">{data.high_five_count || 0}</span>
          </button>
        </div>
        
        <div className="text-[10px] text-text-main opacity-40">
          {date ? formatDistanceToNow(date, { addSuffix: true }) : ''}
        </div>
      </div>

      {/* Pending Approval Action */}
      {data.status === 'PENDING' && (
        <div className="mt-2 pt-3 border-t border-yellow-500/10">
          <button 
            onClick={() => approve.mutate(data.id)} 
            disabled={approve.isLoading}
            className="w-full px-3 py-1.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 rounded text-xs font-bold hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
          >
            {approve.isLoading ? 'Approving...' : 'Approve Recognition'}
          </button>
        </div>
      )}
    </div>
  )
}

export default AchievementCard
