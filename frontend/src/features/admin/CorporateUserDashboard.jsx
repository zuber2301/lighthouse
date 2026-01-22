import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
import api from '../../lib/api'
import { useAuth } from '../../lib/AuthContext'
import RedemptionModal from '../rewards/RedemptionModal'
import RecognitionFeed from '../../components/RecognitionFeed'

export default function CorporateUserDashboard() {
  const { user } = useAuth()
  const [pointsBalance, setPointsBalance] = useState(user?.points_balance || 0)
  const [availableRewards, setAvailableRewards] = useState([])
  const [redemptionHistory, setRedemptionHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReward, setSelectedReward] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchPointsData()
    fetchRewards()
    fetchRedemptions()
  }, [])

  useEffect(() => {
    if (user?.points_balance !== undefined) {
      setPointsBalance(user.points_balance)
    }
  }, [user])

  const fetchPointsData = async () => {
    try {
      const response = await api.get('/user/points')
      const data = response?.data || {}
      setPointsBalance(data?.points_balance ?? 0)
    } catch (error) {
      console.error('Failed to fetch points data:', error)
    }
  }

  const fetchRewards = async () => {
    try {
      const response = await api.get('/user/rewards')
      const data = response?.data || []
      setAvailableRewards(data)
    } catch (error) {
      console.error('Failed to fetch rewards:', error)
    }
  }

  const fetchRedemptions = async () => {
    try {
      const response = await api.get('/user/redemptions')
      const data = response?.data || []
      setRedemptionHistory(data)
    } catch (error) {
      console.error('Failed to fetch redemptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const redeemReward = async (rewardId) => {
    const response = await api.post('/user/redeem', { reward_id: rewardId })
    const data = response?.data
    if (response.status >= 200 && response.status < 300) {
      setPointsBalance(data.points_remaining)
      fetchRedemptions()
    } else {
      const err = response?.data || {}
      throw new Error(err.detail || 'Redemption failed')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Wallet */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-[2rem] p-8 text-white shadow-sm-2xl shadow-sm-indigo-500/20"
      >
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Hello, {user?.full_name?.split(' ')[0] || 'there'}! 👋</h1>
            <p className="mt-2 text-indigo-100/80 font-medium">You're doing amazing! Ready to treat yourself?</p>
            
            <div className="mt-8 flex items-baseline gap-3">
              <span className="text-6xl font-black tracking-tighter drop-shadow-sm-md">
                {pointsBalance.toLocaleString()}
              </span>
              <span className="text-xl font-bold uppercase tracking-widest text-indigo-200/60 transition-all">Points</span>
            </div>
          </div>
          
          <button 
            onClick={() => window.location.href = '/rewards'}
            className="group relative px-8 py-4 bg-card text-indigo-600 rounded-2xl font-black text-lg shadow-sm-xl hover:scale-105 hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-3"
          >
            <span>Redeem Now</span>
            <span className="group-hover:translate-x-1 transition-transform">🎁</span>
          </button>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-card/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl"></div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Social Wall / Recognition Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-text-main flex items-center gap-3">
              <span className="text-3xl">🤝</span> Wall of Fame
            </h3>
            <button className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition" onClick={() => window.location.href = '/feed'}>View all</button>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border-soft rounded-3xl p-2 h-[500px] overflow-hidden">
             <RecognitionFeed />
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          {/* Milestone Progress */}
          <Card className="p-8 bg-card/50 border-border-soft rounded-[2rem] relative overflow-hidden group">
            <h3 className="text-xl font-black text-text-main mb-6 flex items-center gap-2">
              🏆 Next Badge
            </h3>
            <div className="flex flex-col items-center">
               <div className="relative">
                 <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center text-4xl shadow-sm-lg ring-4 ring-orange-500/20 group-hover:scale-110 transition-transform duration-500">
                    🥇
                 </div>
                 <div className="absolute -top-1 -right-1 bg-indigo-600 text-[10px] font-black px-2 py-1 rounded-full border-2 border-slate-900">
                    LV 4
                 </div>
               </div>
               
               <p className="mt-4 font-black text-text-main">Team Catalyst</p>
               <p className="text-xs opacity-70 text-text-main font-medium">Earn 250 more points</p>
               
               <div className="w-full mt-6 h-2 bg-surface rounded-full overflow-hidden border border-border-soft">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '75%' }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                  />
               </div>
               <div className="flex justify-between w-full mt-2 text-[10px] font-bold opacity-50 text-text-main uppercase">
                  <span>750 pts</span>
                  <span>1000 pts</span>
               </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <div className="space-y-4">
             <h3 className="text-lg font-black text-text-main">📜 Recent Activity</h3>
             <div className="space-y-3">
                {redemptionHistory.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-card/40 border border-border-soft/50 rounded-2xl hover:bg-surface/60 transition group">
                     <div className="h-10 w-10 rounded-xl bg-surface flex items-center justify-center text-xl group-hover:scale-110 transition">
                        🎁
                     </div>
                     <div className="flex-1">
                        <p className="text-sm font-bold text-text-main">{item.reward_title}</p>
                        <p className="text-[10px] opacity-50 text-text-main font-medium">{new Date(item.date).toLocaleDateString()}</p>
                     </div>
                     <span className="text-xs font-black text-rose-500">-{item.points_spent}</span>
                  </div>
                ))}
                {redemptionHistory.length === 0 && (
                  <div className="p-8 text-center bg-card/40 border border-dashed border-border-soft rounded-2xl">
                     <p className="text-sm opacity-50 text-text-main font-medium">No redemptions yet. Time to shop! 🛒</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>

      <RedemptionModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedReward(null)
          fetchPointsData()
        }}
        reward={selectedReward}
        currentBalance={pointsBalance}
        onConfirm={redeemReward}
      />
    </div>
  )
}
