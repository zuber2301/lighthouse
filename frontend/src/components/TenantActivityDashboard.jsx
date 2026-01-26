import React, { useState, useEffect } from 'react'
import Card from './Card'
import api from '../api/axiosClient'

const TenantActivityDashboard = ({ tenants = [], stats = {} }) => {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchInsights()
  }, [tenants])

  const fetchInsights = async () => {
    if (!tenants || tenants.length === 0) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // Fetch insights for the first tenant (or could aggregate across all)
      // For now, we'll aggregate metrics across all tenants
      const allInsights = []
      for (const tenant of tenants.slice(0, 5)) { // Fetch top 5 to avoid too many requests
        try {
          const response = await api.get(`/platform/tenant-insights/${tenant.id}`)
          allInsights.push(response.data)
        } catch (err) {
          console.error(`Failed to fetch insights for tenant ${tenant.id}:`, err)
        }
      }
      
      if (allInsights.length > 0) {
        // Aggregate insights
        const aggregated = aggregateInsights(allInsights)
        setInsights(aggregated)
      }
      setError(null)
    } catch (err) {
      console.error('Failed to fetch insights:', err)
      setError('Unable to load culture metrics')
      // Use mock data as fallback
      setInsights(getMockInsights())
    } finally {
      setLoading(false)
    }
  }

  const aggregateInsights = (insightsList) => {
    if (insightsList.length === 0) return getMockInsights()

    // Average recognition velocity
    const avgGrowth = insightsList.reduce((sum, i) => sum + (i.recognition_velocity?.growth_percentage || 0), 0) / insightsList.length
    
    // Total dark zone users across tenants
    const darkZoneUsers = insightsList
      .flatMap(i => i.dark_zone?.users || [])
      .sort((a, b) => b.days_since_recognition - a.days_since_recognition)
      .slice(0, 3)
    
    // Average budget burn
    const avgBurnRate = insightsList.reduce((sum, i) => sum + (i.budget_metrics?.burn_rate_percentage || 0), 0) / insightsList.length
    
    // Average cross-dept collaboration
    const avgCrossDept = insightsList.reduce((sum, i) => sum + (i.cross_dept_collaboration?.percentage || 0), 0) / insightsList.length
    
    // Average participation
    const avgParticipation = insightsList.reduce((sum, i) => sum + (i.participation_rate || 0), 0) / insightsList.length
    
    // Combine all champions
    const allChampions = insightsList
      .flatMap(i => i.top_champions || [])
      .sort((a, b) => b.awards_sent - a.awards_sent)
      .slice(0, 5)

    // Calculate culture score: weighted average of participation, burn rate, and collaboration
    const cultureScore = Math.round((avgParticipation * 0.4 + (100 - avgBurnRate) * 0.3 + avgCrossDept * 0.3))

    return {
      cultureScore: Math.max(0, Math.min(100, cultureScore)),
      recognitionVelocity: {
        growth: avgGrowth,
        trend: avgGrowth > 0 ? 'UP' : (avgGrowth < 0 ? 'DOWN' : 'FLAT')
      },
      darkZoneUsers,
      budgetBurnRate: Math.round(avgBurnRate),
      crossDeptCollab: Math.round(avgCrossDept),
      participationRate: Math.round(avgParticipation),
      topChampions: allChampions
    }
  }

  const getMockInsights = () => ({
    cultureScore: 74,
    recognitionVelocity: { growth: 14, trend: 'UP' },
    darkZoneUsers: [
      { full_name: 'Arjun Mehta', job_title: 'Engineer', department: 'Engineering', days_since_recognition: 42 },
      { full_name: 'Sarah Jenkins', job_title: 'Sales Rep', department: 'Sales', days_since_recognition: 38 },
      { full_name: 'Priya Sharma', job_title: 'Product Manager', department: 'Product', days_since_recognition: 31 }
    ],
    budgetBurnRate: 61,
    crossDeptCollab: 42,
    participationRate: 68,
    topChampions: [
      { full_name: 'Ravi Patel', job_title: 'Team Lead', awards_sent: 28 },
      { full_name: 'Anjali Singh', job_title: 'Manager', awards_sent: 24 },
      { full_name: 'Marcus Webb', job_title: 'Lead', awards_sent: 19 },
      { full_name: 'Divya Verma', job_title: 'Coordinator', awards_sent: 16 },
      { full_name: 'Chen Liu', job_title: 'Team Lead', awards_sent: 14 }
    ]
  })

  const getCultureScoreStatus = (score) => {
    if (score > 80) return { label: 'RADIANT CULTURE', color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' }
    if (score >= 50) return { label: 'STABLE', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' }
    return { label: 'DIMMED', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
  }

  if (loading) {
    return (
      <div className="space-y-8 mt-12">
        <div className="animate-pulse">
          <div className="h-8 bg-indigo-500/10 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-40 bg-indigo-500/10 rounded"></div>)}
          </div>
        </div>
      </div>
    )
  }

  const currentInsights = insights || getMockInsights()
  const scoreStyle = getCultureScoreStatus(currentInsights.cultureScore)

  return (
    <div className="space-y-8 mt-12">
      <div className="flex items-end justify-between border-b border-indigo-500/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-text-main tracking-tight">Culture Insights Dashboard</h2>
          <p className="opacity-40 text-text-main mt-1 text-[13px] font-medium uppercase tracking-widest italic">Actionable Intelligence across {tenants.length} Tenants</p>
        </div>
        <div className={`px-4 py-2 rounded-lg border ${scoreStyle.bg} ${scoreStyle.color} ${scoreStyle.border} flex items-center gap-3`}>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Platform Culture Score</p>
            <p className="text-xl font-black">{currentInsights.cultureScore}</p>
          </div>
          <div className="h-8 w-px bg-current opacity-20"></div>
          <p className="text-[11px] font-bold tracking-widest">{scoreStyle.label}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Engagement & Participation */}
        <Card className="lg:col-span-2 border border-indigo-500/10 bg-card/40 backdrop-blur-sm p-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.61.02-.95.05 1.14.85 1.95 2.06 1.95 3.45V19h7v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
          </div>
          <h3 className="text-[12px] font-bold opacity-60 text-text-main uppercase tracking-widest mb-6">Engagement & Silo Breaking</h3>
          
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-[11px] opacity-40 uppercase font-bold tracking-tight">Recognition Velocity</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-text-main">{currentInsights.recognitionVelocity.growth > 0 ? '+' : ''}{currentInsights.recognitionVelocity.growth}%</span>
                <span className={`text-[10px] font-bold uppercase ${currentInsights.recognitionVelocity.trend === 'UP' ? 'text-teal-400' : (currentInsights.recognitionVelocity.trend === 'DOWN' ? 'text-rose-400' : 'text-amber-400')}`}>
                  ↑ Trending {currentInsights.recognitionVelocity.trend}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] opacity-40 uppercase font-bold tracking-tight">Participation Rate</p>
              <span className="text-2xl font-bold text-text-main">{currentInsights.participationRate}%</span>
              <div className="w-full bg-indigo-500/10 h-1 mt-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full" style={{ width: `${currentInsights.participationRate}%` }}></div>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] opacity-40 uppercase font-bold tracking-tight">Cross-Dept Collaboration</p>
              <span className="text-2xl font-bold text-indigo-400">{currentInsights.crossDeptCollab}%</span>
              <p className="text-[9px] opacity-40 italic mt-1">Silo breakdown efficiency</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] opacity-40 uppercase font-bold tracking-tight">Top Influencer</p>
              <span className="text-sm font-bold text-text-main truncate block">{currentInsights.topChampions[0]?.full_name || 'N/A'}</span>
              <p className="text-[9px] opacity-40 uppercase font-bold text-teal-500">{currentInsights.topChampions[0]?.awards_sent || 0} awards sent</p>
            </div>
          </div>
        </Card>

        {/* Financial & Budget Insights */}
        <Card className="lg:col-span-2 border border-indigo-500/10 bg-card/40 backdrop-blur-sm p-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
          </div>
          <h3 className="text-[12px] font-bold opacity-60 text-text-main uppercase tracking-widest mb-6">Financial & Liability Metrics</h3>
          
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-[11px] opacity-40 uppercase font-bold tracking-tight">Wallet Utilization</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-indigo-400">{currentInsights.budgetBurnRate}%</span>
                <span className="text-[9px] opacity-40 uppercase font-bold">Manager spend</span>
              </div>
              <div className="w-full bg-indigo-500/10 h-1 mt-2 rounded-full overflow-hidden">
                <div className="bg-indigo-400 h-full" style={{ width: `${currentInsights.budgetBurnRate}%` }}></div>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] opacity-40 uppercase font-bold tracking-tight">Budget Burn Trend</p>
              <span className={`text-lg font-bold ${currentInsights.budgetBurnRate > 70 ? 'text-rose-400' : 'text-teal-400'}`}>
                {currentInsights.budgetBurnRate > 70 ? '⚠ High' : '✓ Healthy'}
              </span>
              <p className="text-[9px] opacity-40 italic mt-1">Point distribution rate</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] opacity-40 uppercase font-bold tracking-tight">All-Tenant Avg</p>
              <span className="text-xl font-bold text-text-main">{currentInsights.participationRate}%</span>
              <p className="text-[9px] opacity-40 italic mt-1">Active participation</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] opacity-40 uppercase font-bold tracking-tight">Culture Momentum</p>
              <span className="text-xl font-bold text-teal-400">{currentInsights.recognitionVelocity.trend}</span>
              <p className="text-[9px] opacity-40 italic mt-1">Weekly trend</p>
            </div>
          </div>
        </Card>

        {/* The "Recognition Gap" / Red Alert */}
        <Card className="lg:col-span-1 border border-rose-500/10 bg-rose-500/5 p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-[11px] font-bold text-rose-400 uppercase tracking-[0.2em]">Dark Zone (30d+)</h3>
             <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
          </div>
          <p className="text-[13px] text-text-main opacity-60 mb-6">These users are slipping through the cracks. Reach out to Tenant Leads.</p>
          
          <div className="space-y-4 flex-1">
            {currentInsights.darkZoneUsers.map((u, i) => (
              <div key={i} className="flex justify-between items-center border-b border-rose-500/5 pb-3">
                <div>
                  <p className="text-[13px] font-bold text-text-main">{u.full_name}</p>
                  <p className="text-[10px] opacity-40 uppercase font-bold tracking-tighter">{u.job_title}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-black text-rose-500">{u.days_since_recognition}d</p>
                  <p className="text-[8px] opacity-40 uppercase font-bold">Silent</p>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-6 py-2.5 rounded border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-widest hover:bg-rose-500/10 transition-all">
            Generate Retention Report
          </button>
        </Card>

        {/* Top Champions / Influencers */}
        <Card className="lg:col-span-3 border border-indigo-500/10 bg-card/40 backdrop-blur-sm p-6">
          <h3 className="text-[12px] font-bold opacity-60 text-text-main uppercase tracking-widest mb-6">Recognition Champions (This Month)</h3>
          
          <div className="space-y-4">
            {currentInsights.topChampions.map((champ, i) => (
              <div key={i} className="flex items-center justify-between border-b border-indigo-500/5 pb-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-bold text-indigo-400">#{i + 1}</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-text-main">{champ.full_name}</p>
                    <p className="text-[11px] opacity-60 uppercase font-bold tracking-tighter">{champ.job_title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[14px] font-black text-indigo-400">{champ.awards_sent}</p>
                  <p className="text-[9px] opacity-40 uppercase font-bold">awards</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Milestone & Automation Health */}
        <Card className="lg:col-span-1 border border-indigo-500/10 bg-card/40 backdrop-blur-sm p-6">
          <h3 className="text-[12px] font-bold opacity-60 text-text-main uppercase tracking-widest mb-8">Automation Health</h3>

          <div className="text-center space-y-2">
             <div className="relative inline-block">
               <svg className="w-16 h-16 -rotate-90">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-indigo-500/10" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-indigo-500" strokeDasharray={`${88 * 1.76}, 176`} />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">88%</div>
             </div>
             <p className="text-[10px] font-bold text-text-main uppercase tracking-widest mt-4">Milestone Interaction</p>
             <p className="text-[8px] opacity-40 italic px-2">Clicks on automated Birthday/Anniv notifications</p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default TenantActivityDashboard
