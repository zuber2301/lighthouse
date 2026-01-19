import React from 'react'
import RewardCard from '../components/Card'

const CorporateDashboard = ({ user }) => {
  const points = user?.points_balance ?? 0

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold">Welcome back, {user?.full_name || 'there'}! 👋</h1>
          <p className="mt-2 opacity-90">You've received a recognition recently. Keep up the great work!</p>

          <div className="mt-8 flex items-end gap-4">
            <span className="text-5xl font-black tracking-tighter">{points}</span>
            <span className="text-xl font-medium mb-1 opacity-80 uppercase tracking-widest">Points Available</span>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-bold">Featured Rewards</h3>
          <div className="grid grid-cols-2 gap-4">
            <RewardCard title="Amazon Voucher" subtitle="500 points" />
            <RewardCard title="Starbucks Coffee" subtitle="200 points" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Latest Achievement</h3>
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 mb-4 bg-amber-100 rounded-full flex items-center justify-center text-4xl shadow-inner">🚀</div>
            <p className="font-bold text-indigo-600">Velocity Master</p>
            <p className="text-sm text-slate-500 mt-1">Awarded for high-speed delivery on Triton Project.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CorporateDashboard
