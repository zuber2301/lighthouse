import React, { useState, useEffect } from 'react'
import api from '../../lib/api'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
import { useTenant } from '../../lib/TenantContext'

export default function TenantLeadDashboard() {
  const { selectedTenant } = useTenant()
  const [team, setTeam] = useState([])
  const [budget, setBudget] = useState(0)
  const [loading, setLoading] = useState(true)
  const [recognitionData, setRecognitionData] = useState({
    userId: '',
    amount: '',
    note: ''
  })

  useEffect(() => {
    fetchTeamData()
    fetchBudget()
  }, [])

  const fetchTeamData = async () => {
    try {
      const response = await api.get('/lead/team')
      const data = response.data || {}
      setTeam(data.team_members || [])
    } catch (error) {
      console.error('Failed to fetch team data:', error)
    }
  }

  const fetchBudget = async () => {
    try {
      const response = await api.get('/lead/budget')
      const data = response.data || {}
      setBudget((data.budget_balance || 0) / 100) // Convert paise to rupees
    } catch (error) {
      console.error('Failed to fetch budget:', error)
    } finally {
      setLoading(false)
    }
  }

  const recognizeUser = async () => {
    if (!recognitionData.userId || !recognitionData.amount) {
      alert('Please select a user and enter points amount')
      return
    }

    if (parseInt(recognitionData.amount) > budget) {
      alert('Insufficient budget')
      return
    }

    try {
      const response = await api.post('/lead/recognize', {
        user_id: recognitionData.userId,
        amount: parseInt(recognitionData.amount),
        note: recognitionData.note
      })

      if (response.status === 200 || response.status === 201) {
        const data = response.data
        // Update local state
        setTeam(team.map(member =>
          member.id === recognitionData.userId
            ? { ...member, points_balance: data.user_points }
            : member
        ))
        setBudget(data.lead_budget_remaining / 100)
        setRecognitionData({ userId: '', amount: '', note: '' })
        fetchTeamData() // Refresh to get latest data
      }
    } catch (error) {
      console.error('Failed to recognize user:', error)
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6">
      <PageHeader title="Team Recognition" subtitle={`Give points to your team members${selectedTenant ? ` — ${selectedTenant.name}` : ''}`} />

      {/* Budget Display */}
      <Card className="mb-6">
        <div className="bg-green-900 text-white p-6 rounded-xl">
          <h2 className="text-sm uppercase tracking-widest opacity-70">Your Recognition Budget</h2>
          <h1 className="text-3xl font-bold">₹{budget.toLocaleString()}</h1>
        </div>
      </Card>

      {/* Recognition Form */}
      <Card className="mb-6">
        <h3 className="font-bold text-lg mb-4">Give Recognition</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-main opacity-80 mb-2">Team Member</label>
            <select
              value={recognitionData.userId}
              onChange={(e) => setRecognitionData({...recognitionData, userId: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Select a team member</option>
              {team.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-main opacity-80 mb-2">Points</label>
            <input
              type="number"
              value={recognitionData.amount}
              onChange={(e) => setRecognitionData({...recognitionData, amount: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-main opacity-80 mb-2">Note (Optional)</label>
            <input
              type="text"
              value={recognitionData.note}
              onChange={(e) => setRecognitionData({...recognitionData, note: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Great work on the project!"
            />
          </div>
        </div>
        <button
          onClick={recognizeUser}
          className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          disabled={!recognitionData.userId || !recognitionData.amount}
        >
          Give Recognition
        </button>
      </Card>

      {/* Team Performance */}
      <Card>
        <h3 className="font-bold text-lg mb-4">Team Performance</h3>
        <div className="grid gap-4">
          {team.map(member => (
            <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-bold">{member.name}</p>
                <p className="text-sm text-slate-500">Points Balance: {member.points_balance}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-green-600">{member.points_balance}</span>
                <p className="text-xs text-slate-500">points</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}