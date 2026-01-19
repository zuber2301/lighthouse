import React from 'react'
import RecognitionFeed from '../components/RecognitionFeed'

const sample = [
  { id: 'r1', sender_avatar: 'SS', sender_name: 'Suresh S', receiver_name: 'Priya P', badge_name: 'Team Player', points: 50, message: 'Great collaboration on the Q4 launch!', time_ago: '2h' },
  { id: 'r2', sender_avatar: 'AB', sender_name: 'Alex B', receiver_name: 'Jamie L', badge_name: 'Problem Solver', points: 30, message: 'Amazing debugging skills during the incident.', time_ago: '1d' },
  { id: 'r3', sender_avatar: 'MK', sender_name: 'Maya K', receiver_name: 'Jordan R', badge_name: 'Innovator', points: 40, message: 'Loved the new approach to the onboarding flow.', time_ago: '3d' },
  { id: 'r4', sender_avatar: 'PT', sender_name: 'Priya T', receiver_name: 'Sam W', badge_name: 'Mentor', points: 20, message: 'Thanks for the support during onboarding.', time_ago: '4d' },
  { id: 'r5', sender_avatar: 'DL', sender_name: 'Dale L', receiver_name: 'Chris N', badge_name: 'Problem Solver', points: 30, message: 'Quick work fixing the outage!', time_ago: '1w' },
  { id: 'r6', sender_avatar: 'AR', sender_name: 'Aisha R', receiver_name: 'Kim P', badge_name: 'Team Player', points: 50, message: 'Great collaboration across teams.', time_ago: '2w' }
]

export default function RecognitionFeedDemo() {
  return (
    <div className="w-full py-8 pl-8">
      <h2 className="text-2xl font-bold mb-4">Wall of Fame</h2>
      <RecognitionFeed items={sample} />
    </div>
  )
}
