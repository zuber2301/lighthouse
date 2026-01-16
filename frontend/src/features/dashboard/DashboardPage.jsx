import React, { useState } from 'react'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
import PointsBalance from './PointsBalance'
import RecognitionFeed from './RecognitionFeed'
import NominateModal from '../recognition/NominateModal'
import { useRecognitions } from '../../hooks/useRecognitions'
import ThemeHero from '../../themes/templatemo_602_graph_page/ThemeHero'
import useTemplatemoTheme from '../../themes/templatemo_602_graph_page/useTemplatemoTheme'

export default function DashboardPage() {
  const [open, setOpen] = useState(false)

  const { create } = useRecognitions()
  useTemplatemoTheme()

  function handleSubmit(item) {
    // Use the shared recognitions mutation so Dashboard nominations appear in Recognition list
    create(item)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="What's happening right now?" actions={<button onClick={() => setOpen(true)} className="px-3 py-1 rounded-md bg-indigo-600 focus:outline-none focus-visible:ring-3 focus-visible:ring-primary">Nominate</button>} />
      <div className="bg-gradient-to-br from-tm-bg-dark to-surface p-6 rounded-xl">
        {/* Hero */}
        <div className="mb-6">
          <ThemeHero />
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6`}>
          <Card>
            <div data-theme="graph-stat-card" style={{ transform: 'translateY(20px)', opacity: 0 }} className="group bg-[rgba(255,255,255,0.03)] border border-white/6 rounded-xl p-4 hover:-translate-y-1 transform transition-all duration-200 hover:shadow-tm-neon focus-within:shadow-tm-neon">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-tm-teal to-tm-teal-2 text-tm-bg-dark">📊</div>
                <div className="text-sm text-slate-400 font-medium">Total Revenue</div>
              </div>
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-tm-teal">$42,847</div>
              <div className="text-sm text-slate-400">Monthly revenue increased by 23% compared to last month with strong performance across all channels.</div>
              <div className="mt-3 h-14">
                <canvas className="w-full h-full" id="miniChart1" />
              </div>
            </div>
          </Card>
          <Card>
            <div data-theme="graph-stat-card" style={{ transform: 'translateY(20px)', opacity: 0 }} className="group bg-[rgba(255,255,255,0.03)] border border-white/6 rounded-xl p-4 hover:-translate-y-1 transform transition-all duration-200 hover:shadow-tm-neon focus-within:shadow-tm-neon">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-tm-teal to-tm-teal-2 text-tm-bg-dark">👥</div>
                <div className="text-sm text-slate-400 font-medium">Active Users</div>
              </div>
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-tm-teal">18.5K</div>
              <div className="text-sm text-slate-400">Real-time analytics showing active users currently engaging with the platform.</div>
              <div className="mt-3 h-14">
                <canvas className="w-full h-full" id="miniChart2" />
              </div>
            </div>
          </Card>

          <Card>
            <div data-theme="graph-stat-card" style={{ transform: 'translateY(20px)', opacity: 0 }} className="group bg-[rgba(255,255,255,0.03)] border border-white/6 rounded-xl p-4 hover:-translate-y-1 transform transition-all duration-200 hover:shadow-tm-neon focus-within:shadow-tm-neon">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-tm-teal to-tm-teal-2 text-tm-bg-dark">🎯</div>
                <div className="text-sm text-slate-400 font-medium">Conversion Rate</div>
              </div>
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-tm-teal">94.3%</div>
              <div className="text-sm text-slate-400">Customer satisfaction rate based on recent surveys and feedback analysis.</div>
              <div className="mt-3 h-14">
                <canvas className="w-full h-full" id="miniChart3" />
              </div>
            </div>
          </Card>
        </div>

        <Card className="col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">Recent Recognition Feed</div>
              <div className="text-sm text-slate-400">Immutable ledger-backed activity</div>
            </div>
            <div className="text-sm text-slate-400">Feed — Redis-backed (live)</div>
          </div>

          <div className="mt-4">
            <RecognitionFeed />
          </div>
        </Card>

      </div>

      <NominateModal open={open} onClose={() => setOpen(false)} onSubmit={handleSubmit} />
    </div>
  )
}
