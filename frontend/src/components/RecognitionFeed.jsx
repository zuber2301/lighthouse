import React from 'react'
import { IndividualAwardCard, GroupAwardCard, ECard } from '../features/recognition/components'

const RecognitionCard = ({ data }) => {
  const tag = (data.value_tag || data.tag || '').toLowerCase()

  if (tag.includes('group')) {
    return <GroupAwardCard data={data} />
  }
  if (tag.includes('e-card') || tag.includes('ecard')) {
    return <ECard data={data} />
  }
  // Default to Individual Award
  return <IndividualAwardCard data={data} />
}

export const RecognitionFeed = ({ items = [] }) => {
  if (!items.length) {
    return (
      <div className="text-center py-20 flex flex-col items-center justify-center bg-card/50 rounded-lg border border-dashed border-indigo-500/10 transition-colors duration-300">
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
