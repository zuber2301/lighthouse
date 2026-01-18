import React, { useEffect, useState } from 'react'
import Card from '../../components/Card'
import { API_BASE } from '../../lib/api'

export default function PlatformLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchLogs() }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/platform/logs?limit=100`, { credentials: 'include' })
      if (res.ok) setLogs(await res.json())
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-bold">Security & Logs</h2>
        <p className="text-slate-400">Audit trail of platform-level actions (tenant lifecycle, provider changes, billing updates).</p>
      </Card>

      <Card>
        {loading ? <div>Loading...</div> : (
          <table className="w-full text-left">
            <thead className="text-slate-400 text-sm">
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
                <tr key={l.id} className="border-t border-slate-800">
                  <td className="p-3 text-slate-400 text-sm">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="p-3 font-medium">{l.admin_id || 'system'}</td>
                  <td className="p-3">{l.action}</td>
                  <td className="p-3 text-slate-400">{l.target_tenant_id || '—'}</td>
                  <td className="p-3 text-sm text-slate-300"><pre className="whitespace-pre-wrap">{JSON.stringify(l.details || {}, null, 2)}</pre></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
