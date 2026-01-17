import React, { useState, useEffect } from 'react'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'

export default function CorporateUserDashboard() {
  const [pointsBalance, setPointsBalance] = useState(0)
  const [recognitionHistory, setRecognitionHistory] = useState([])
  const [availableRewards, setAvailableRewards] = useState([])
  const [redemptionHistory, setRedemptionHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPointsData()
    fetchRewards()
    fetchRedemptions()
  }, [])

  const fetchPointsData = async () => {
    try {
      const response = await fetch('/api/user/points')
      const data = await response.json()
      setPointsBalance(data.points_balance)
      setRecognitionHistory(data.recognition_history)
    } catch (error) {
      console.error('Failed to fetch points data:', error)
    }
  }

  const fetchRewards = async () => {
    try {
      const response = await fetch('/api/user/rewards')
      const data = await response.json()
      setAvailableRewards(data)
    } catch (error) {
      console.error('Failed to fetch rewards:', error)
    }
  }

  const fetchRedemptions = async () => {
    try {
      const response = await fetch('/api/user/redemptions')
      const data = await response.json()
      setRedemptionHistory(data)
    } catch (error) {
      console.error('Failed to fetch redemptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const redeemReward = async (rewardId) => {
    try {
      const response = await fetch('/api/user/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reward_id: rewardId })
      })

      if (response.ok) {
        const data = await response.json()
        setPointsBalance(data.points_remaining)
        alert(`Successfully redeemed ${data.reward_title}!`)
        fetchRedemptions()
      } else {
        const error = await response.json()
        alert(error.detail || 'Redemption failed')
      }
    } catch (error) {
      console.error('Failed to redeem reward:', error)
      alert('Redemption failed')
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6">
      <PageHeader title="My Recognition" subtitle="View your points and redeem rewards" />

      {/* Points Balance */}
      <Card className="mb-6">
        <div className="bg-blue-900 text-white p-8 rounded-2xl">
          <h2 className="text-sm uppercase tracking-widest opacity-70">My Points Balance</h2>
          <h1 className="text-4xl font-bold">{pointsBalance.toLocaleString()}</h1>
          <p className="mt-2 opacity-80">points available to redeem</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recognition History */}
        <Card>
          <h3 className="font-bold text-lg mb-4">Recognition History</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recognitionHistory.length === 0 ? (
              <p className="text-gray-500">No recognition received yet</p>
            ) : (
              recognitionHistory.map((recognition, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">+{recognition.amount} points</p>
                    <p className="text-sm text-gray-600">{recognition.note}</p>
                    <p className="text-xs text-gray-500">{new Date(recognition.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-green-600 font-bold">
                    +{recognition.amount}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Available Rewards */}
        <Card>
          <h3 className="font-bold text-lg mb-4">Available Rewards</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {availableRewards.map(reward => (
              <div key={reward.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{reward.title}</p>
                  <p className="text-sm text-gray-600">by {reward.provider}</p>
                  <p className="text-sm font-bold text-blue-600">{reward.points_cost} points</p>
                </div>
                <button
                  onClick={() => redeemReward(reward.id)}
                  disabled={!reward.can_afford}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    reward.can_afford
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {reward.can_afford ? 'Redeem' : 'Not enough points'}
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Redemption History */}
      <Card className="mt-6">
        <h3 className="font-bold text-lg mb-4">Redemption History</h3>
        <div className="space-y-3">
          {redemptionHistory.length === 0 ? (
            <p className="text-gray-500">No redemptions yet</p>
          ) : (
            redemptionHistory.map(redemption => (
              <div key={redemption.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">{redemption.reward_title}</p>
                  <p className="text-sm text-gray-600">{redemption.points_spent} points spent</p>
                  <p className="text-xs text-gray-500">{new Date(redemption.date).toLocaleDateString()}</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  redemption.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  redemption.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {redemption.status}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}