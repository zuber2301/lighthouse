import React from 'react'
import { useApproveRecognition } from '../hooks'

function Avatar({ name }) {
  const initials = name ? name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase() : 'U'
  return (
    <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center font-semibold text-sm">{initials}</div>
  )
}

export default function RecognitionList({ pages, fetchNextPage, hasNextPage, isFetchingNextPage }) {
  const approve = useApproveRecognition()

  return (
    <div>
      {pages?.map((page, i) => (
        <div key={i} className="space-y-3">
          {page.map((r) => (
            <div key={r.id} className="p-4 bg-card rounded shadow-sm flex items-start gap-3">
              <Avatar name={r.nominee_name || r.nominee_id} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{r.nominee_name || r.nominee_id}</div>
                    <div className="text-xs text-text-main opacity-60">Points: <span className="font-semibold">{r.points}</span></div>
                  </div>
                  <div>
                    <span className={`px-2 py-1 text-xs rounded ${r.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {r.status}
                    </span>
                  </div>
                </div>
                {r.message && <div className="mt-2 text-sm text-text-main opacity-80">{r.message}</div>}
                <div className="mt-3 flex gap-2">
                  {r.status === 'PENDING' && (
                    <button onClick={() => approve.mutate(r.id)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm focus:outline-none focus-visible:ring-3 focus-visible:ring-primary">Approve</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}

      <div className="mt-4">
        <button
          onClick={() => fetchNextPage()}
          disabled={!hasNextPage || isFetchingNextPage}
          className="px-4 py-2 bg-blue-600 text-white rounded focus:outline-none focus-visible:ring-3 focus-visible:ring-primary"
        >
          {isFetchingNextPage ? 'Loading...' : hasNextPage ? 'Load more' : 'No more'}
        </button>
      </div>
    </div>
  )
}
