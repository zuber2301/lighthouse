import React, { useState } from 'react'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
import PointsBalance from './PointsBalance'
import RecognitionFeed from './RecognitionFeed'
import NominateModal from '../recognition/NominateModal'
import { useRecognitions } from '../../hooks/useRecognitions'
import styles from '../../themes/templatemo_602_graph_page/templatemo.module.css'
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
      <div className={styles.graphTheme}>
        <div className={`grid grid-cols-3 gap-6 ${styles.statsGrid}`}>
          <Card>
            <div data-theme="graph-stat-card" className={styles.statCard}>
              <div className={styles.statHeader}>
                <div className={styles.statIcon}>📊</div>
                <div className={styles.statTitle}>Total Revenue</div>
              </div>
              <div className={styles.statValue}>$42,847</div>
              <div className={styles.statDescription}>Monthly revenue increased by 23% compared to last month with strong performance across all channels.</div>
              <div className={styles.statChart}>
                <canvas className={styles.miniChart} id="miniChart1" />
              </div>
            </div>
          </Card>

          <Card>
            <div data-theme="graph-stat-card" className={styles.statCard}>
              <div className={styles.statHeader}>
                <div className={styles.statIcon}>👥</div>
                <div className={styles.statTitle}>Active Users</div>
              </div>
              <div className={styles.statValue}>18.5K</div>
              <div className={styles.statDescription}>Real-time analytics showing active users currently engaging with the platform.</div>
              <div className={styles.statChart}>
                <canvas className={styles.miniChart} id="miniChart2" />
              </div>
            </div>
          </Card>

          <Card>
            <div data-theme="graph-stat-card" className={styles.statCard}>
              <div className={styles.statHeader}>
                <div className={styles.statIcon}>🎯</div>
                <div className={styles.statTitle}>Conversion Rate</div>
              </div>
              <div className={styles.statValue}>94.3%</div>
              <div className={styles.statDescription}>Customer satisfaction rate based on recent surveys and feedback analysis.</div>
              <div className={styles.statChart}>
                <canvas className={styles.miniChart} id="miniChart3" />
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
  )
}
