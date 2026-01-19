import React, { useState, useEffect } from 'react'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
import RedemptionModal from './RedemptionModal'
import { getRewards, redeemReward } from '../../api/rewards'
import { useAuth } from '../../lib/AuthContext'

export default function RewardsPage() {
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReward, setSelectedReward] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user, refreshUser } = useAuth()

  useEffect(() => {
    fetchRewards()
  }, [])

  const fetchRewards = async () => {
    try {
      const data = await getRewards()
      setRewards(data)
    } catch (err) {
      console.error('Failed to fetch rewards:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRedeemClick = (reward) => {
    setSelectedReward(reward)
    setIsModalOpen(true)
  }

  const handleConfirmRedemption = async (rewardId) => {
    await redeemReward(rewardId)
    await refreshUser() // Refresh balance in context
    fetchRewards() // Refresh list if needed
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-tm-bg-dark to-surface p-6 rounded-xl">
        <PageHeader 
          title="Rewards" 
          subtitle={`Browse and redeem rewards. Your balance: ${user?.points_balance || 0} pts`} 
        />

        {loading ? (
          <div className="text-center py-10 text-slate-400">Loading rewards...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {rewards.map((reward) => (
              <Card key={reward.id} className="p-0 overflow-hidden group">
                <div className="h-40 bg-slate-800 flex items-center justify-center text-5xl">
                   {reward.icon || '🎁'}
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{reward.title}</h3>
                    <span className="bg-indigo-900/50 text-indigo-400 px-2 py-1 rounded text-xs font-bold">
                      {reward.points_cost} pts
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mb-6 line-clamp-2">
                    {reward.description || 'No description available.'}
                  </p>
                  <button 
                    onClick={() => handleRedeemClick(reward)}
                    disabled={user?.points_balance < reward.points_cost}
                    className={`w-full py-2 rounded-lg font-bold transition ${
                      user?.points_balance >= reward.points_cost
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {user?.points_balance >= reward.points_cost ? 'Redeem Now' : 'Insufficient Points'}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <RedemptionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reward={selectedReward}
        currentBalance={user?.points_balance || 0}
        onConfirm={handleConfirmRedemption}
      />
    </div>
  )
}
