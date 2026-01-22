import React from 'react'
import RecentRecognitions from './RecentRecognitions'

export default function RecognitionFeed() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <RecentRecognitions />
        </div>
        <div className="col-span-1">
          <div className="bg-card p-4 rounded-lg">
            <div className="text-sm opacity-70 text-text-main">Top Tags</div>
            <div className="mt-3 flex flex-col gap-2">
              <div className="text-sm">Teamwork <span className="text-xs opacity-70 text-text-main">(45)</span></div>
              <div className="text-sm">Innovation <span className="text-xs opacity-70 text-text-main">(21)</span></div>
              <div className="text-sm">Support <span className="text-xs opacity-70 text-text-main">(17)</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
