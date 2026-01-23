import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
import api from '../../lib/api'
import { useAuth } from '../../lib/AuthContext'
import RedemptionModal from '../rewards/RedemptionModal'
import RecognitionFeed from '../../components/RecognitionFeed'
import confetti from 'canvas-confetti'

export default function CorporateUserDashboard() {
  const { user, refreshUser } = useAuth()
  const [pointsBalance, setPointsBalance] = useState(user?.points_balance || 0)
  const [availableRewards, setAvailableRewards] = useState([])
  const [redemptionHistory, setRedemptionHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReward, setSelectedReward] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Recognition form state
  const [recognitionData, setRecognitionData] = useState({
    userId: '',
    search: '',
    amount: 50,
    note: '',
    category: 'Individual award'
  })
  const [users, setUsers] = useState([])
  const searchTimer = useRef()

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

  // Handle user search for recognition
  useEffect(() => {
    if (!recognitionData.search.trim()) {
      setUsers([])
      return
    }
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      api
        .get('/user/search', { params: { q: recognitionData.search } })
        .then((res) => setUsers(res.data || []))
        .catch(() => setUsers([]))
    }, 300)
    return () => clearTimeout(searchTimer.current)
  }, [recognitionData.search])

  const handleRecognize = async () => {
    if (!recognitionData.userId || !recognitionData.amount) return
    
    try {
      // Use the generic recognition endpoint
      await api.post('/recognition', {
        nominee_id: recognitionData.userId,
        points: Number(recognitionData.amount),
        message: recognitionData.note,
        value_tag: recognitionData.category,
        is_public: true
      })

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366F1', '#4f46e5', '#ff6b6b']
      })

      setRecognitionData({
        userId: '',
        search: '',
        amount: 50,
        note: '',
        category: 'Individual award'
      })
      
      refreshUser() // Update points after giving
    } catch (e) {
      console.error(e)
      alert(e.response?.data?.detail || 'Failed to give recognition')
    }
  }

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
        className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-[2rem] p-8 text-accent-contrast shadow-sm-2xl shadow-sm-indigo-500/20"
      >
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Hello, {user?.full_name?.split(' ')[0] || 'there'}! 👋</h1>
            <p className="mt-2 text-indigo-100/80 font-normal">You're doing amazing! Ready to treat yourself?</p>
            
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
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-card border border-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl"></div>
      </motion.div>
      {/* Give Recognition Section */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Give Recognition</h2>
            <p className="text-sm opacity-60">Celebrate your teammates' achievements</p>
          </div>
          <div className="flex bg-surface border border-indigo-500/10 p-1 rounded-2xl shadow-sm border border-border-soft">
            {['Individual award', 'Group award', 'E-Card'].map(tab => (
              <button
                key={tab}
                onClick={() => setRecognitionData({...recognitionData, category: tab})}
                className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  recognitionData.category === tab 
                  ? 'btn-accent shadow-lg text-white' 
                  : 'opacity-70 text-text-main hover:opacity-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative">
            <label className="block text-[11px] font-bold uppercase tracking-widest opacity-40 mb-2">Recipient</label>
            <input 
              value={recognitionData.search}
              onChange={(e) => setRecognitionData({...recognitionData, search: e.target.value})}
              placeholder="Search by name..." 
              className="w-full bg-surface border border-indigo-500/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            {users.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-card border border-border-soft rounded-xl shadow-2xl max-h-48 overflow-y-auto p-1">
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setRecognitionData({...recognitionData, userId: u.id, search: u.name});
                      setUsers([]);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-indigo-500/10 rounded-lg text-sm transition-colors flex items-center gap-2"
                  >
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-[10px] font-bold">
                      {u.name.charAt(0)}
                    </div>
                    {u.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest opacity-40 mb-2">Points</label>
            <input 
              type="number"
              value={recognitionData.amount}
              onChange={(e) => setRecognitionData({...recognitionData, amount: e.target.value})}
              className="w-full bg-surface border border-indigo-500/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-indigo-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest opacity-40 mb-2">Message</label>
            <input 
              value={recognitionData.note}
              onChange={(e) => setRecognitionData({...recognitionData, note: e.target.value})}
              placeholder="Why this award?"
              className="w-full bg-surface border border-indigo-500/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleRecognize}
            disabled={!recognitionData.userId || !recognitionData.amount}
            className="px-8 py-3 rounded-xl btn-accent font-bold text-sm shadow-xl shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-30"
          >
            Send Recognition
          </button>
        </div>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Social Wall / Recognition Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-text-main flex items-center gap-3">
              <span className="text-3xl">🤝</span> Wall of Fame
            </h3>
            <button className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition" onClick={() => window.location.href = '/feed'}>View all</button>
          </div>
          
          <div className="bg-card/50 border border-indigo-500/10 backdrop-blur-sm border border-border-soft rounded-3xl p-2 h-[500px] overflow-hidden">
             <RecognitionFeed />
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          {/* Milestone Progress */}
          <Card className="p-8 bg-card/5 border border-indigo-500/100 border-border-soft rounded-[2rem] relative overflow-hidden group">
            <h3 className="text-xl font-black text-text-main mb-6 flex items-center gap-2">
              🏆 Next Badge
            </h3>
            <div className="flex flex-col items-center">
               <div className="relative">
                 <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center text-4xl shadow-sm-lg ring-4 ring-orange-500/20 group-hover:scale-110 transition-transform duration-500">
                    🥇
                 </div>
                 <div className="absolute -top-1 -right-1 bg-indigo-600 text-[10px] font-black px-2 py-1 rounded-full border-2 border-indigo-500/5">
                    LV 4
                 </div>
               </div>
               
               <p className="mt-4 font-black text-text-main">Team Catalyst</p>
               <p className="text-xs opacity-70 text-text-main font-normal">Earn 250 more points</p>
               
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
                  <div key={i} className="flex items-center gap-4 p-4 bg-card/4 border border-indigo-500/100 border border-border-soft/50 rounded-2xl hover:bg-surface/60 transition group">
                     <div className="h-10 w-10 rounded-xl bg-surface flex items-center justify-center text-xl group-hover:scale-110 transition">
                        🎁
                     </div>
                     <div className="flex-1">
                        <p className="text-sm font-bold text-text-main">{item.reward_title}</p>
                        <p className="text-[10px] opacity-50 text-text-main font-normal">{new Date(item.date).toLocaleDateString()}</p>
                     </div>
                     <span className="text-xs font-black text-rose-500">-{item.points_spent}</span>
                  </div>
                ))}
                {redemptionHistory.length === 0 && (
                  <div className="p-8 text-center bg-card/4 border border-indigo-500/100 border border-dashed border-border-soft rounded-2xl">
                     <p className="text-sm opacity-50 text-text-main font-normal">No redemptions yet. Time to shop! 🛒</p>
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
