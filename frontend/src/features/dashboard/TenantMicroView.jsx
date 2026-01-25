import React from 'react'
import Card from '../../components/Card'
import DepartmentHeatmap from '../../components/DepartmentHeatmap'
import BudgetBurnChart from '../../components/BudgetBurnChart'

const formatCurrency = (paise) => {
  if (paise == null) return '—'
  const dollars = paise / 100
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dollars)
}

export default function TenantMicroView({ tenant, stats, loading }) {
  const leaderboard = stats?.leaderboard || []
  const milestones = stats?.milestone_alerts || []
  const leadAllocations = stats?.lead_allocations || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-lg text-text-main/70 uppercase tracking-wide">Micro View</div>
          <h2 className="text-3xl font-bold text-white">{tenant?.name} Insights</h2>
          <p className="text-sm text-text-main/60">Department, budget, and milestone intelligence for the selected tenant.</p>
        </div>
        <div className="text-right text-sm text-text-main/60">
          Remaining Master Budget
          <div className="text-lg font-bold text-tm-teal">{formatCurrency(stats?.tenant?.master_budget_balance_paise)}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-text-main">Departmental Heatmap</div>
              <p className="text-sm text-text-main/60">Activity by department over the last 30 days.</p>
            </div>
            <span className="text-xs uppercase tracking-wide text-text-muted">30d</span>
          </div>
          <DepartmentHeatmap heatmap={stats?.department_heatmap} loading={loading} />
        </Card>
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-text-main">Budget Burn Rate</div>
              <p className="text-sm text-text-main/60">Points burned by leads day-over-day.</p>
            </div>
            <span className="text-xs uppercase tracking-wide text-text-muted">10d</span>
          </div>
          <BudgetBurnChart series={stats?.budget_burn_rate} loading={loading} />
          <div className="flex flex-wrap gap-3 text-xs text-text-main/60">
            {leadAllocations.length === 0 && !loading && (
              <span className="px-3 py-1 rounded-full bg-surface-muted">No leads tracked yet</span>
            )}
            {leadAllocations.map((lead) => (
              <span key={lead.id} className="px-3 py-1 rounded-full border border-border-soft">
                {lead.name}: {formatCurrency(lead.budget_paise)}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-text-main">Leaderboard</div>
              <p className="text-sm text-text-main/60">Top recipients of High-Fives inside this tenant.</p>
            </div>
            <span className="text-xs uppercase tracking-wide text-text-muted">Top 8</span>
          </div>
          {leaderboard.length === 0 && !loading && (
            <p className="text-sm text-text-muted">No recognized users yet.</p>
          )}
          <ul className="space-y-3">
            {leaderboard.map((user, index) => (
              <li key={user.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">{index + 1}. {user.name}</div>
                  <div className="text-[10px] uppercase tracking-wider text-text-main/60">{user.recognitions} recognitions</div>
                </div>
                <div className="text-right text-sm text-tm-teal">{user.points?.toLocaleString() ?? 0} pts</div>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="space-y-4">
          <div>
            <div className="text-lg font-semibold text-text-main">Milestone Alerts</div>
            <p className="text-sm text-text-main/60">Upcoming birthdays and anniversaries for {tenant?.name} people.</p>
          </div>
          {milestones.length === 0 && !loading && (
            <p className="text-sm text-text-muted">No upcoming milestones in the next 30 days.</p>
          )}
          <ul className="space-y-3">
            {milestones.map((item) => (
              <li key={`${item.name}-${item.date}-${item.type}`} className="flex items-center justify-between text-sm border-b border-border-soft pb-3">
                <div>
                  <div className="font-semibold text-white">{item.name}</div>
                  <div className="text-[10px] uppercase tracking-wide text-text-main/70">{item.type}</div>
                </div>
                <div className="text-right text-xs text-text-main/70">
                  <div>{item.date}</div>
                  <div className="text-tm-teal">in {item.days_until} days</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
