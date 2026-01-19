import React from 'react'
import RecognitionFeed from '../components/RecognitionFeed'

const sample = [
  {
    id: 'r1',
    sender_avatar: 'SS',
    sender_name: 'Suresh S',
    receiver_name: 'Priya P',
    badge_name: 'Team Player',
    points: 50,
    message: 'Great collaboration on the Q4 launch!',
    time_ago: '2h'
  },
  {
    id: 'r2',
    sender_avatar: 'AB',
    sender_name: 'Alex B',
    receiver_name: 'Jamie L',
    badge_name: 'Problem Solver',
    points: 30,
    message: 'Amazing debugging skills during the incident.',
    time_ago: '1d'
  }
]

export default function RecognitionFeedDemo() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">Wall of Fame</h2>
      <RecognitionFeed items={sample} />
    </div>
  )
}
