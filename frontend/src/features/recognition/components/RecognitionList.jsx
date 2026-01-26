import React from 'react'
import AchievementCard from './AchievementCard'

export default function RecognitionList({ pages, fetchNextPage, hasNextPage, isFetchingNextPage }) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages?.map((page, i) => (
          <React.Fragment key={i}>
            {page.map((r) => (
              <AchievementCard key={r.id} data={r} />
            ))}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={() => fetchNextPage()}
          disabled={!hasNextPage || isFetchingNextPage}
          className="px-6 py-2.5 btn-accent rounded-full text-sm font-semibold shadow-lg focus:outline-none focus-visible:ring-3 focus-visible:ring-primary disabled:opacity-50"
        >
          {isFetchingNextPage ? 'Loading...' : hasNextPage ? 'View More Achievements' : 'All caught up!'}
        </button>
      </div>
    </div>
  )
}
