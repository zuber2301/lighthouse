import React, { useEffect, useState } from 'react'
import Card from '../../components/Card'
import api from '../../lib/api'

export default function PlatformLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchLogs() }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/platform/logs', { params: { limit: 100 } })
      setLogs(res.data || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-bold">Security & Logs</h2>
        <p className="opacity-70 text-text-main">Audit trail of platform-level actions (tenant lifecycle, provider changes, billing updates).</p>
      </Card>

      <Card>
        {loading ? <div>Loading...</div> : (
          <table className="w-full text-left">
            <thead className="opacity-70 text-text-main text-sm">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">Admin</th>
                <th className="p-3">Action</th>
                <th className="p-3">Target</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} className="border-t border-border-soft">
                  <td className="p-3 opacity-70 text-text-main text-sm">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="p-3 font-normal">{l.admin_id || 'system'}</td>
                  <td className="p-3">{l.action}</td>
                  <td className="p-3 opacity-70 text-text-main">{l.target_tenant_id || '—'}</td>
                  <td className="p-3 text-sm text-text-main opacity-80"><pre className="whitespace-pre-wrap">{JSON.stringify(l.details || {}, null, 2)}</pre></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
