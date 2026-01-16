import React from 'react'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
export default function RewardsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-tm-bg-dark to-surface p-6 rounded-xl">
        <PageHeader title="Rewards" subtitle="Browse and redeem rewards" />

        <div className="mt-4">
          <Card>
            <div className="text-slate-400">Rewards catalog placeholder.</div>
          </Card>
        </div>
      </div>
    </div>
  )
}
